import requests
import json

base_url = "http://localhost:8000"

def login():
    res = requests.post(f"{base_url}/auth/login", data={"username": "admin", "password": "password"})
    return res.json()["access_token"]

def get_config(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{base_url}/reviews/config", headers=headers)
    return res.json()

def put_config(token, payload):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.put(f"{base_url}/reviews/config", headers=headers, json=payload)
    return res.status_code, res.text

try:
    token = login()
    config = get_config(token)
    print("Initial Config:", config)
    
    # Try updating exactly like frontend
    payload = config.copy()
    payload.pop("id", None)
    payload["periods"] = payload.get("periods", []) + [{"subject_id": "test", "semester_id": "test", "status": "open"}]
    
    code, text = put_config(token, payload)
    print("Update Payload:", json.dumps(payload))
    print("Update Result:", code, text)
except Exception as e:
    print(e)
