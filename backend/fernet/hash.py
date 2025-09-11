# hash.py
from cryptography.fernet import Fernet
import base64
import os

# Generate a key once and save it securely (env var / firebase remote config)
SECRET_KEY = os.getenv("APP_SECRET_KEY")

if not SECRET_KEY:
    # Generate new key if not set (for demo only, don't do this in prod)
    SECRET_KEY = Fernet.generate_key().decode()
    print("Generated SECRET_KEY, save this securely:", SECRET_KEY)

fernet = Fernet(SECRET_KEY.encode() if isinstance(SECRET_KEY, str) else SECRET_KEY)

def encrypt_value(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def decrypt_value(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
