from pymongo import MongoClient
import json
from bson import json_util

client = MongoClient("mongodb://localhost:27017/")
db = client["student_grading_db"]

# Print subjects
print("Subjects:")
for s in db.subjects.find():
    print(json.loads(json_util.dumps(s)))

# Print user
print("User 'admin':")
print(json.loads(json_util.dumps(db.users.find_one({"user_code": "admin"}))))
