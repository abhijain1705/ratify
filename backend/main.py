import os
from dotenv import load_dotenv
import boto3
import asyncio
import requests
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect

# Import config to ensure Firebase is initialized!
import firebase.firebase_config

from firebase.firestore_client import save_connector
from functions.auth import verify_firebase_token, User
from fernet.hash import encrypt_value, decrypt_value
from clouds.aws.aws import validate_aws_credentials, get_cpu_utilization, set_asg_capacity, get_billing

load_dotenv()

app = FastAPI()

USER_CONNECTORS = {}

# 🔹 Fake store for demo (replace with DB/Vault/KMS)
USER_CONNECTORS = {}


def get_ec2_client(aws_access_key, aws_secret_key, region="us-east-1"):
    return boto3.client(
        "ec2",
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=region
    )

@app.post("/api/aws/security/firewall")
def add_firewall_rule(data: dict, user: User = Depends(verify_firebase_token)):
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
        ec2 = get_ec2_client(user.aws_access_key, user.aws_secret_key)
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
def fetch_billing(data: dict, user: User = Depends(verify_firebase_token)):
    connector = get_user_connector(user)
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
def connect_aws(data: dict, user: User = Depends(verify_firebase_token)):
    access_key = data["access_key"]
    secret_key = data["secret_key"]
    region = data.get("region", "us-east-1")

    try:
        identity = validate_aws_credentials(access_key, secret_key, region)
        save_connector(user.uid, {
            "access_key": encrypt_value(access_key),
            "secret_key": encrypt_value(secret_key),
            "region": region,
            "identity": identity,
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Store ENCRYPTED
    USER_CONNECTORS[user.uid] = {
        "access_key": encrypt_value(access_key),
        "secret_key": encrypt_value(secret_key),
        "region": region,
        "identity": identity,
    }

    return {"msg": "AWS connector added", "identity": identity}

def get_user_connector(user: User):
    connector = USER_CONNECTORS.get(user.uid)
    if not connector:
        raise HTTPException(status_code=404, detail="AWS connector not found")

    # Decrypt before use
    return {
        "access_key": decrypt_value(connector["access_key"]),
        "secret_key": decrypt_value(connector["secret_key"]),
        "region": connector["region"],
        "identity": connector["identity"],
    }

from fastapi import Body

@app.post("/api/aws/metrics/{instance_id}")
def fetch_metrics(
    instance_id: str,
    data: dict = Body(...),
    user: User = Depends(verify_firebase_token)
):
    connector = get_user_connector(user)
    
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
def scale_asg(payload: dict, user: User = Depends(verify_firebase_token)):
    connector = get_user_connector(user)
    asg_name = payload["asg"]
    desired = payload["desired_capacity"]

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


# ---------- WebSocket: real-time metrics & billing stream ----------
@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    """
    WebSocket endpoint for streaming:
      /ws/stream?token=<idToken>&type=metrics&instance_id=i-0abc...&interval=5
      /ws/stream?token=<idToken>&type=billing&start=2025-09-01&end=2025-09-10&interval=60
    """
    await websocket.accept()

    # Read query params
    params = websocket.query_params
    token = params.get("token")
    stream_type = params.get("type", "metrics")  # metrics | billing
    interval = int(params.get("interval", "5"))  # seconds
    instance_id = params.get("instance_id")  # required when type=metrics
    start = params.get("start")
    end = params.get("end")

    # Basic auth check
    if not token:
        await websocket.send_json({"error": "Missing token query param"})
        await websocket.close(code=1008)
        return

    # Verify Firebase token (throws on invalid)
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid")
    except Exception as e:
        await websocket.send_json({"error": f"Invalid token: {e}"})
        await websocket.close(code=1008)
        return

    # Load connector for user (in-memory store used by app)
    connector = USER_CONNECTORS.get(uid)
    if not connector:
        await websocket.send_json({"error": "No AWS connector found for user. Please call /api/connectors/aws first."})
        await websocket.close(code=1008)
        return

    # Decrypt credentials for use
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
                if not instance_id:
                    await websocket.send_json({"error": "instance_id query param required for metrics stream"})
                    await asyncio.sleep(interval)
                    continue

                # Fetch last N minutes (e.g., last 10 mins)
                cw = cloudwatch_client()
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(minutes=10)

                resp = cw.get_metric_statistics(
                    Namespace="AWS/EC2",
                    MetricName="CPUUtilization",
                    Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=60,  # 1-minute datapoints if detailed monitoring enabled; else 300s
                    Statistics=["Average"]
                )

                # sort datapoints by timestamp and send last one
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
                    payload = {
                        "type": "metrics",
                        "instance_id": instance_id,
                        "message": "no datapoints yet"
                    }

                await websocket.send_json(payload)

            elif stream_type == "billing":
                # requires Cost Explorer enabled in the account
                ce = ce_client()
                # default last 7 days if not provided
                if not start or not end:
                    end_date = datetime.utcnow().date()
                    start_date = end_date - timedelta(days=7)
                else:
                    # assume client passed ISO date strings
                    start_date = datetime.fromisoformat(start).date()
                    end_date = datetime.fromisoformat(end).date()

                resp = ce.get_cost_and_usage(
                    TimePeriod={"Start": start_date.isoformat(), "End": end_date.isoformat()},
                    Granularity="DAILY",
                    Metrics=["UnblendedCost"]
                )

                # Normalize a simpler payload for frontend
                results = []
                for item in resp.get("ResultsByTime", []):
                    results.append({
                        "start": item["TimePeriod"]["Start"],
                        "end": item["TimePeriod"]["End"],
                        "amount": item["Total"]["UnblendedCost"]["Amount"],
                        "unit": item["Total"]["UnblendedCost"]["Unit"]
                    })

                await websocket.send_json({
                    "type": "billing",
                    "data": results
                })

            else:
                await websocket.send_json({"error": f"Unknown stream type: {stream_type}"})

            # wait for interval or until the client disconnects
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=interval)
                # If client sends a ping text we ignore; use receive_text to keep socket alive.
            except asyncio.TimeoutError:
                # timeout: send next metric (normal flow)
                pass

    except WebSocketDisconnect:
        # client closed websocket
        print(f"Websocket disconnected for user {uid}")
    except Exception as exc:
        # send error then close
        try:
            await websocket.send_json({"error": str(exc)})
        except:
            pass
        await websocket.close()
