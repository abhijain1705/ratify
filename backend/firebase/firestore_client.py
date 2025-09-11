from firebase_admin import firestore
# Import config to ensure initialization
import firebase_config

db = firestore.client()

def save_connector(user_id: str, connector: dict):
    db.collection("connectors").document(user_id).set(connector)

def get_connector(user_id: str):
    doc = db.collection("connectors").document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None