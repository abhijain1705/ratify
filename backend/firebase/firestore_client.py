from firebase_admin import firestore
# Import config to ensure initialization
import firebase.firebase_config

db = firestore.client()

def save_connector(user_id: str, platform: str, connector: dict):
    db.collection("connectors").document(platform + user_id).set(connector)

def get_connector(user_id: str, platform: str):
    doc = db.collection("connectors").document(platform + user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None