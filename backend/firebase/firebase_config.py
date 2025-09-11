import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

load_dotenv()  # Loads .env file from project root

# Path to service account key from .env or fallback to hardcoded
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_PATH", "./ratify-e2f8a-firebase-adminsdk-fbsvc-b48c454983.json")

# Only initialize if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_path)
    default_app = firebase_admin.initialize_app(cred)