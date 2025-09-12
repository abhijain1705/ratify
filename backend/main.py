import os
import boto3
import asyncio
import requests
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime, timedelta
from firebase_admin import auth as firebase_auth
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Body, Request

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from azure.identity import ClientSecretCredential
from clouds.azure.azure import get_azure_vm_metrics, get_azure_storage_metrics, get_azure_billing

from firebase.firestore_client import save_connector
from functions.auth import verify_firebase_token, User
from fernet.hash import encrypt_value, decrypt_value
from clouds.aws.aws import validate_aws_credentials, get_cpu_utilization, set_asg_capacity, get_billing, get_s3_metrics, get_rds_metrics, get_ec2_client, check_iam_policies, check_security_groups

import redis.asyncio as aioredis
import json
from fastapi.middleware.cors import CORSMiddleware

limiter = Limiter(key_func=get_remote_address)
load_dotenv()

app = FastAPI()

# Allow CORS for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis = aioredis.from_url(REDIS_URL, decode_responses=True)

# Register exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



@app.get("/ping")
@limiter.limit("10/minute")   # 10 requests per minute per IP
async def ping(request: Request):
    return {"msg": "pong"}

# ---------- Models ----------
class AzureConnector(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str
    subscription_id: str

class VMMetricsRequest(BaseModel):
    resource_group: str
    vm_name: str
    metric_name: str = "Percentage CPU"

class StorageMetricsRequest(BaseModel):
    resource_group: str
    storage_account: str
    metric_name: str = "UsedCapacity"

class BillingRequest(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD

    # ---------- Redis Helper Functions ----------
async def save_connector_to_redis(user_id: str, provider: str, connector: dict):
    key = f"user:{user_id}:connectors"
    # Encrypt sensitive values before saving
    safe_connector = {k: encrypt_value(v) if "secret" in k or "key" in k else v
                      for k, v in connector.items()}
    await redis.hset(key, provider, json.dumps(safe_connector))


async def get_connector_from_redis(user_id: str, provider: str):
    key = f"user:{user_id}:connectors"
    data = await redis.hget(key, provider)
    if not data:
        return None
    connector = json.loads(data)
    # Decrypt secrets
    return {k: decrypt_value(v) if "secret" in k or "key" in k else v
            for k, v in connector.items()}


async def delete_connector_from_redis(user_id: str, provider: str):
    key = f"user:{user_id}:connectors"
    await redis.hdel(key, provider)


@app.get("/api/connectors/status")
async def connectors_status(user: User = Depends(verify_firebase_token)):
    aws_connector = await get_connector_from_redis(user.uid, "aws")
    azure_connector = await get_connector_from_redis(user.uid, "azure")
    return {
        "aws": aws_connector is not None,
        "azure": azure_connector is not None
    }

@app.get("/api/connectors/aws/status")
async def aws_connector_status(user: User = Depends(verify_firebase_token)):
    aws_connector = await get_connector_from_redis(user.uid, "aws")
    return {"aws": aws_connector is not None}

@app.get("/api/connectors/azure/status")
async def azure_connector_status(user: User = Depends(verify_firebase_token)):
    azure_connector = await get_connector_from_redis(user.uid, "azure")
    return {"azure": azure_connector is not None}

# ---------- Helpers ----------
async def get_user_azure_credential(user_id):
    connector = await get_connector_from_redis(user_id, "azure")
    if not connector:
        raise Exception("No Azure connector found for this user")
    return ClientSecretCredential(
        tenant_id=connector["tenant_id"],
        client_id=connector["client_id"],
        client_secret=decrypt_value(connector["client_secret"]),
    ), connector["subscription_id"]

# ---------- Endpoints ----------
@app.post("/api/connectors/azure")
async def connect_azure(connector: AzureConnector, user: User = Depends(verify_firebase_token)):
    try:
        await save_connector_to_redis(user.uid, "azure", {
            "tenant_id": (connector.tenant_id),
            "client_id": (connector.client_id),
            "client_secret": encrypt_value(connector.client_secret),   # 🔐 encrypted
            "subscription_id": (connector.subscription_id),
        })

        save_connector(
            user.uid,
            "azure",
            {"service": "azure", "data": connector.dict()}
        )

        return {"message": "Azure connector saved securely"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/azure/vm-metrics")
async def azure_vm_metrics(data: VMMetricsRequest = Body(...), user: User = Depends(verify_firebase_token)):
    try:
        cred, sub_id = await get_user_azure_credential(user.uid)
        result = get_azure_vm_metrics(cred, sub_id, data.resource_group, data.vm_name, data.metric_name)
        return {"metrics": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@app.post("/api/azure/storage-metrics")
async def azure_storage_metrics(data: StorageMetricsRequest = Body(...), user: User = Depends(verify_firebase_token)):
    try:
        cred, sub_id = await get_user_azure_credential(user.uid)
        result = get_azure_storage_metrics(cred, sub_id, data.resource_group, data.storage_account, data.metric_name)
        return {"metrics": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/azure/billing")
async def azure_billing(data: BillingRequest = Body(...), user: User = Depends(verify_firebase_token)):
    try:
        cred, sub_id = await get_user_azure_credential(user.uid)
        result = get_azure_billing(cred, sub_id, data.start_date, data.end_date)
        return {"billing": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))    

async def get_user_azure_credential(user_id):
    connector = await get_connector_from_redis(user_id, "azure")
    if not connector:
        raise Exception("No Azure connector found for this user")

    return ClientSecretCredential(
        tenant_id=connector["tenant_id"],
        client_id=connector["client_id"],
        client_secret=decrypt_value(connector["client_secret"])
    ), connector["subscription_id"]

@app.post("/api/aws/security/firewall")
async def add_firewall_rule(data: dict, user: User = Depends(verify_firebase_token)):
    """
    Adds a firewall (security group) rule
    Example body:
    {
        "sg_id": "sg-0123456789abcdef",
        "port": 22,
        "protocol": "tcp",   
        "cidr": "0.0.0.0/0"
    }
    """
    try:
        connector = await get_user_connector(user)
        ec2 = get_ec2_client(connector["access_key"], connector["secret_key"], connector["region"])
        ec2.authorize_security_group_ingress(
            GroupId=data["sg_id"],
            IpPermissions=[{
                "IpProtocol": data.get("protocol", "tcp"),
                "FromPort": data["port"],
                "ToPort": data["port"],
                "IpRanges": [{"CidrIp": data["cidr"]}],
            }]
        )
        return {"msg": f"Rule added: {data['protocol']} {data['port']} from {data['cidr']}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/aws/rds-metrics/{db_instance_identifier}")
async def fetch_rds_metrics(
    db_instance_identifier: str,
    data: dict = Body(...),
    user: User = Depends(verify_firebase_token)
):
    """
    Fetch RDS CloudWatch metrics for a given DB instance and time window.
    Body example:
    {
        "start": "2023-01-01T00:00:00",
        "end": "2023-01-31T23:59:59",
        "metrics": ["CPUUtilization", "FreeStorageSpace"]   # Optional, fetches these metrics
    }
    """
    connector = await get_user_connector(user)
    start = data.get("start")
    end = data.get("end")

    if not start or not end:
        raise HTTPException(status_code=400, detail="Start and end dates required")

    start_time = datetime.fromisoformat(start)
    end_time = datetime.fromisoformat(end)

    # This function should be implemented in your clouds.aws.aws module!
    return get_rds_metrics(
        connector["access_key"],
        connector["secret_key"],
        connector["region"],
        db_instance_identifier,
        start_time,
        end_time
    )

@app.get("/api/aws/security-checks")
async def aws_security_checks(user: User = Depends(verify_firebase_token)):
    try:
        connector = await get_user_connector(user)
        ec2 = boto3.client(
            "ec2",
            aws_access_key_id=decrypt_value(connector["access_key"]),
            aws_secret_access_key=decrypt_value(connector["secret_key"]),
            region_name=connector["region"],
        )
        iam = boto3.client(
            "iam",
            aws_access_key_id=decrypt_value(connector["access_key"]),
            aws_secret_access_key=decrypt_value(connector["secret_key"]),
            region_name=connector["region"],
        )

        sg_issues = check_security_groups(ec2)
        iam_issues = check_iam_policies(iam)

        return {
            "security_groups": sg_issues,
            "iam": iam_issues,
            "ddos": "Rate limiting & throttling enabled at API level."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/aws/s3-metrics/{bucket_name}")
async def fetch_s3_metrics(
    bucket_name: str,
    data: dict = Body(...),
    user: User = Depends(verify_firebase_token)
):
    connector = await get_user_connector(user)

    start = data.get("start")  # e.g. "2023-01-01"
    end = data.get("end")      # e.g. "2023-01-31"

    if not start or not end:
        raise HTTPException(status_code=400, detail="Start and end dates required")

    start_time = datetime.fromisoformat(start)
    end_time = datetime.fromisoformat(end)

    return get_s3_metrics(
        connector["access_key"],
        connector["secret_key"],
        connector["region"],
        bucket_name,
        start_time,
        end_time
    )

@app.post("/api/login")
def login(payload: dict):
    """
    Login user via Firebase (email + password).
    Returns Firebase ID token and refresh token.
    """
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    resp = requests.post(url, json={
        "email": email,
        "password": password,
        "returnSecureToken": True
    })

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail=resp.json().get("error", {}).get("message", "Login failed"))

    return resp.json()


@app.post("/api/billing")
async def fetch_billing(data: dict, user: User = Depends(verify_firebase_token)):
    connector = await get_user_connector(user)
    start = data.get("start")  # e.g. "2023-01-01"
    end = data.get("end")      # e.g. "2023-01-31"

    if not start or not end:
        raise HTTPException(status_code=400, detail="Start and end dates required")

    return get_billing(
        connector["access_key"],
        connector["secret_key"],
        start,
        connector["region"],
        end
    )


@app.post("/api/connectors/aws")
async def connect_aws(data: dict, user: User = Depends(verify_firebase_token)):
    access_key = data["access_key"]
    secret_key = data["secret_key"]
    region = data.get("region", "us-east-1")

    try:
        identity = validate_aws_credentials(access_key, secret_key, region)
        save_connector(user.uid, "aws", {
            "access_key": encrypt_value(access_key),
            "secret_key": encrypt_value(secret_key),
            "region": region,
            "identity": identity,
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Store ENCRYPTED
    await save_connector_to_redis(user.uid, "aws", {
        "access_key": encrypt_value(access_key),
        "secret_key": encrypt_value(secret_key),
        "region": region,
        "identity": identity,
    })

    return {"msg": "AWS connector added", "identity": identity}

async def get_user_connector(user: User):
    connector = await get_connector_from_redis(user.uid, "aws")
    if not connector:
        raise HTTPException(status_code=404, detail="AWS connector not found")

    # Decrypt before use
    return {
        "access_key": decrypt_value(connector["access_key"]),
        "secret_key": decrypt_value(connector["secret_key"]),
        "region": connector["region"],
        "identity": connector["identity"],
    }


@app.post("/api/aws/metrics/{instance_id}")
async def fetch_metrics(
    instance_id: str,
    data: dict = Body(...),
    user: User = Depends(verify_firebase_token)
):
    connector = await get_user_connector(user)
    
    start = data.get("start")  # e.g. "2023-01-01"
    end = data.get("end")      # e.g. "2023-01-31"

    return get_cpu_utilization(
        connector["access_key"],
        connector["secret_key"],
        connector["region"],
        instance_id,
        start,
        end
    )


@app.post("/api/aws/scale")
async def scale_asg(payload: dict, user: User = Depends(verify_firebase_token)):
    connector = await get_user_connector(user)
    asg_name = payload["asg"]
    desired = payload["desired_capacity"]

    if not asg_name or desired is None:
        raise HTTPException(status_code=400, detail="ASG name and desired capacity required")

    return set_asg_capacity(
        connector["access_key"],
        connector["secret_key"],
        connector["region"],
        asg_name,
        desired,
    )


@app.get("/api/profile")
async def profile(user: User = Depends(verify_firebase_token)):
    return {"uid": user.uid, "email": user.email, "roles": user.roles}


# 🔹 Role-based example
def require_admin(user: User = Depends(verify_firebase_token)):
    if "admin" not in user.roles:
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


@app.post("/api/register-cloud")
async def register_cloud(payload: dict, user: User = Depends(require_admin)):
    # store encrypted connector, start validation, etc.
    return {"ok": True}


# ---------- WeSocket: real-time metrics, billing, in azure
# ---------- WebSocket: Azure real-time metrics, billing, storage ----------
@app.websocket("/ws/azure")
async def ws_azure(websocket: WebSocket):
    """
    WebSocket endpoint for Azure:
      /ws/azure?token=<idToken>&type=vm-metrics&resource_group=my-rg&vm_name=myVM&metric=Percentage%20CPU&interval=10
      /ws/azure?token=<idToken>&type=storage-metrics&resource_group=my-rg&storage_account=mystorage&metric=UsedCapacity&interval=60
      /ws/azure?token=<idToken>&type=billing&start=2025-09-01&end=2025-09-10&interval=300
    """
    await websocket.accept()

    params = websocket.query_params
    token = params.get("token")
    stream_type = params.get("type", "vm-metrics")
    interval = int(params.get("interval", "10"))  # seconds

    resource_group = params.get("resource_group")
    vm_name = params.get("vm_name")
    storage_account = params.get("storage_account")
    metric = params.get("metric", "Percentage CPU")

    start = params.get("start")
    end = params.get("end")

    # 🔹 Verify token
    if not token:
        await websocket.send_json({"error": "Missing token"})
        await websocket.close(code=1008)
        return

    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid")
    except Exception as e:
        await websocket.send_json({"error": f"Invalid token: {e}"})
        await websocket.close(code=1008)
        return

    # 🔹 Load Azure connector
    try:
        cred, sub_id = await get_user_azure_credential(uid)
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close(code=1008)
        return

    try:
        while True:
            if stream_type == "vm-metrics":
                if not resource_group or not vm_name:
                    await websocket.send_json({"error": "resource_group and vm_name required"})
                else:
                    try:
                        result = get_azure_vm_metrics(cred, sub_id, resource_group, vm_name, metric)
                        await websocket.send_json({
                            "type": "vm-metrics",
                            "resource_group": resource_group,
                            "vm_name": vm_name,
                            "metric": metric,
                            "data": result
                        })
                    except Exception as e:
                        await websocket.send_json({"error": str(e)})

            elif stream_type == "storage-metrics":
                if not resource_group or not storage_account:
                    await websocket.send_json({"error": "resource_group and storage_account required"})
                else:
                    try:
                        result = get_azure_storage_metrics(cred, sub_id, resource_group, storage_account, metric)
                        await websocket.send_json({
                            "type": "storage-metrics",
                            "resource_group": resource_group,
                            "storage_account": storage_account,
                            "metric": metric,
                            "data": result
                        })
                    except Exception as e:
                        await websocket.send_json({"error": str(e)})

            elif stream_type == "billing":
                try:
                    if not start or not end:
                        end_date = datetime.utcnow().date()
                        start_date = end_date - timedelta(days=7)
                    else:
                        start_date = datetime.fromisoformat(start).date()
                        end_date = datetime.fromisoformat(end).date()

                    result = get_azure_billing(cred, sub_id, start_date.isoformat(), end_date.isoformat())
                    await websocket.send_json({
                        "type": "billing",
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat(),
                        "data": result
                    })
                except Exception as e:
                    await websocket.send_json({"error": str(e)})

            else:
                await websocket.send_json({"error": f"Unknown stream type: {stream_type}"})

            # wait for interval or break on disconnect
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=interval)
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        print(f"Azure WebSocket disconnected for user {uid}")
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
        await websocket.close(code=1011)


# ---------- WebSocket: real-time metrics, billing, and S3 ----------
@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    """
    WebSocket endpoint for streaming:
      /ws/stream?token=<idToken>&type=metrics&instance_id=i-0abc...&interval=5
      /ws/stream?token=<idToken>&type=billing&start=2025-09-01&end=2025-09-10&interval=60
      /ws/stream?token=<idToken>&type=s3-metrics&bucket_name=my-bucket&metric=BucketSizeBytes&interval=60
    """
    await websocket.accept()

    # Read query params
    params = websocket.query_params
    token = params.get("token")
    stream_type = params.get("type", "metrics")  # metrics | billing | s3-metrics
    interval = int(params.get("interval", "5"))  # seconds
    instance_id = params.get("instance_id")
    bucket_name = params.get("bucket_name")
    metric_name = params.get("metric", "BucketSizeBytes")  # default metric
    start = params.get("start")
    end = params.get("end")

    # Basic auth check
    if not token:
        await websocket.send_json({"error": "Missing token query param"})
        await websocket.close(code=1008)
        return

    # Verify Firebase token
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid")
    except Exception as e:
        await websocket.send_json({"error": f"Invalid token: {e}"})
        await websocket.close(code=1008)
        return

    # Load connector for user
    connector = await get_connector_from_redis(uid, "aws")
    if not connector:
        await websocket.send_json({"error": "No AWS connector found for user. Please call /api/connectors/aws first."})
        await websocket.close(code=1008)
        return

    # Decrypt credentials
    try:
        aws_access_key = decrypt_value(connector["access_key"])
        aws_secret_key = decrypt_value(connector["secret_key"])
        region = connector.get("region", "us-east-1")
    except Exception as e:
        await websocket.send_json({"error": f"Failed to decrypt credentials: {e}"})
        await websocket.close(code=1011)
        return

    # Helper clients
    def cloudwatch_client():
        return boto3.client(
            "cloudwatch",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=region
        )

    def ce_client():
        return boto3.client(
            "ce",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=region
        )

    try:
        while True:
            if stream_type == "metrics":
                # ---------- EC2 metrics ----------
                if not instance_id:
                    await websocket.send_json({"error": "instance_id query param required for metrics stream"})
                    await asyncio.sleep(interval)
                    continue

                cw = cloudwatch_client()
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(minutes=10)

                resp = cw.get_metric_statistics(
                    Namespace="AWS/EC2",
                    MetricName="CPUUtilization",
                    Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=60,
                    Statistics=["Average"]
                )

                dps = resp.get("Datapoints", [])
                if dps:
                    last = sorted(dps, key=lambda x: x["Timestamp"])[-1]
                    payload = {
                        "type": "metrics",
                        "instance_id": instance_id,
                        "timestamp": last["Timestamp"].isoformat(),
                        "value": last.get("Average"),
                        "unit": last.get("Unit")
                    }
                else:
                    payload = {"type": "metrics", "instance_id": instance_id, "message": "no datapoints yet"}

                await websocket.send_json(payload)

            elif stream_type == "billing":
                # ---------- Billing ----------
                ce = ce_client()
                if not start or not end:
                    end_date = datetime.utcnow().date()
                    start_date = end_date - timedelta(days=7)
                else:
                    start_date = datetime.fromisoformat(start).date()
                    end_date = datetime.fromisoformat(end).date()

                resp = ce.get_cost_and_usage(
                    TimePeriod={"Start": start_date.isoformat(), "End": end_date.isoformat()},
                    Granularity="DAILY",
                    Metrics=["UnblendedCost"]
                )

                results = []
                for item in resp.get("ResultsByTime", []):
                    results.append({
                        "start": item["TimePeriod"]["Start"],
                        "end": item["TimePeriod"]["End"],
                        "amount": item["Total"]["UnblendedCost"]["Amount"],
                        "unit": item["Total"]["UnblendedCost"]["Unit"]
                    })

                await websocket.send_json({"type": "billing", "data": results})

            elif stream_type == "s3-metrics":
                # ---------- S3 metrics ----------
                if not bucket_name:
                    await websocket.send_json({"error": "bucket_name query param required for s3-metrics"})
                    await asyncio.sleep(interval)
                    continue

                cw = cloudwatch_client()
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(days=2)  # last 2 days (since S3 is daily)

                # Dimensions differ based on metric
                dimensions = [{"Name": "BucketName", "Value": bucket_name}]
                if metric_name in ["BucketSizeBytes", "NumberOfObjects"]:
                    dimensions.append({"Name": "StorageType", "Value": "StandardStorage"})

                resp = cw.get_metric_statistics(
                    Namespace="AWS/S3",
                    MetricName=metric_name,
                    Dimensions=dimensions,
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=86400,  # daily
                    Statistics=["Average"]
                )

                dps = resp.get("Datapoints", [])
                if dps:
                    last = sorted(dps, key=lambda x: x["Timestamp"])[-1]
                    payload = {
                        "type": "s3-metrics",
                        "bucket": bucket_name,
                        "metric": metric_name,
                        "timestamp": last["Timestamp"].isoformat(),
                        "value": last.get("Average"),
                        "unit": last.get("Unit")
                    }
                else:
                    payload = {"type": "s3-metrics", "bucket": bucket_name, "metric": metric_name, "message": "no datapoints yet"}

                await websocket.send_json(payload)

            else:
                await websocket.send_json({"error": f"Unknown stream type: {stream_type}"})

            # wait for interval
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=interval)
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        print(f"Websocket disconnected for user {uid}")
    except Exception as exc:
        try:
            await websocket.send_json({"error": str(exc)})
        except:
            pass
        await websocket.close()
