# main.py
from fastapi import FastAPI, Depends, HTTPException
from auth import verify_firebase_token, User
from aws_client import validate_aws_credentials, get_cpu_utilization, set_asg_capacity
from hash import encrypt_value, decrypt_value

app = FastAPI()

# 🔹 Fake store for demo (replace with DB/Vault/KMS)
USER_CONNECTORS = {}

@app.post("/api/connectors/aws")
def connect_aws(data: dict, user: User = Depends(verify_firebase_token)):
    access_key = data["access_key"]
    secret_key = data["secret_key"]
    region = data.get("region", "us-east-1")

    try:
        identity = validate_aws_credentials(access_key, secret_key, region)
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

@app.get("/api/aws/metrics/{instance_id}")
def fetch_metrics(instance_id: str, user: User = Depends(verify_firebase_token)):
    connector = get_user_connector(user)
    return get_cpu_utilization(
        connector["access_key"],
        connector["secret_key"],
        connector["region"],
        instance_id,
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
