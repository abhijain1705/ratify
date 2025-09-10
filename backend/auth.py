# auth.py
from fastapi import Request, HTTPException, Depends
from firebase_admin import auth as firebase_auth, credentials, initialize_app
from typing import Optional
from pydantic import BaseModel

# Initialize Firebase Admin SDK once (use a service account JSON)
cred = credentials.Certificate("path/to/firebase-service-account.json")
initialize_app(cred)

class User(BaseModel):
    uid: str
    email: Optional[str]
    roles: list[str] = []

async def verify_firebase_token(request: Request) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization token")
    id_token = auth_header.split(" ")[1]
    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    uid = decoded.get("uid")
    email = decoded.get("email")
    # use custom claims you set in Firebase for roles
    roles = decoded.get("roles", []) or []
    return User(uid=uid, email=email, roles=roles)
