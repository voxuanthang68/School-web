import requests
import json
import traceback

base_url = "http://localhost:8000"

try:
    print("Logging in...")
    res = requests.post(f"{base_url}/auth/login", data={"username": "admin", "password": "password"})
    if res.status_code != 200:
        print("Login failed:", res.status_code, res.text)
        exit(1)
        
    token = res.json()["access_token"]
    print("Token:", token[:20])

    print("Fetching config...")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.get(f"{base_url}/reviews/config", headers=headers)
    config = res.json()
    print("Config fetched ok.", config.keys())

    print("Trying to PUT config...")
    payload = config.copy()
    if "id" in payload:
        del payload["id"]
    
    payload["periods"] = payload.get("periods", []) + [{
        "subject_id": "test",
        "semester_id": "test",
        "subject_name": "Test",
        "semester_name": "Test",
        "start_date": "2025-01-01T00:00",
        "end_date": "2025-01-02T00:00",
        "status": "open"
    }]
    
    put_res = requests.put(f"{base_url}/reviews/config", headers=headers, json=payload)
    print("PUT Result Code:", put_res.status_code)
    try:
        print("PUT Result Body:", put_res.json())
    except:
        print("PUT Result Text:", put_res.text)

except Exception as e:
    traceback.print_exc()
