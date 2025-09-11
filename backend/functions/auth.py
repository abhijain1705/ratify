from fastapi import Request, HTTPException
from firebase_admin import auth
from typing import Optional
from pydantic import BaseModel

# Import config to ensure initialization
import firebase_config

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
        decoded = auth.verify_id_token(id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    uid = decoded.get("uid")
    email = decoded.get("email")
    roles = decoded.get("roles", []) or []

    return User(uid=uid, email=email, roles=roles)