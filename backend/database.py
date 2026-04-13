import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "school_grading")

client = MongoClient(MONGODB_URL)
db = client[MONGO_DB_NAME]

# Collections
users_collection = db["users"]
semesters_collection = db["semesters"]
subjects_collection = db["subjects"]
grade_types_collection = db["grade_types"]
letter_grades_collection = db["letter_grades"]
teaching_assignments_collection = db["teaching_assignments"]
enrollments_collection = db["enrollments"]
classes_collection = db["classes"]
grades_collection = db["grades"]
reviews_collection = db["reviews"]
review_config_collection = db["review_config"]
notifications_collection = db["notifications"]

# Create indexes
users_collection.create_index("email", unique=True)
subjects_collection.create_index("code", unique=True)
grade_types_collection.create_index("subject_id")
teaching_assignments_collection.create_index([("teacher_id", 1), ("subject_id", 1), ("semester_id", 1)], unique=True)
enrollments_collection.create_index([("student_id", 1), ("subject_id", 1), ("semester_id", 1)], unique=True)
grades_collection.create_index([("student_id", 1), ("class_id", 1)], unique=True)
