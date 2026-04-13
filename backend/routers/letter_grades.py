from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import letter_grades_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/letter-grades", tags=["letter-grades"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


# Default letter grade scale
DEFAULT_SCALE = [
    {"letter": "A", "min_score": 8.5, "max_score": 10.0, "gpa_4": 4.0},
    {"letter": "B+", "min_score": 8.0, "max_score": 8.49, "gpa_4": 3.5},
    {"letter": "B", "min_score": 7.0, "max_score": 7.99, "gpa_4": 3.0},
    {"letter": "C+", "min_score": 6.5, "max_score": 6.99, "gpa_4": 2.5},
    {"letter": "C", "min_score": 5.5, "max_score": 6.49, "gpa_4": 2.0},
    {"letter": "D+", "min_score": 5.0, "max_score": 5.49, "gpa_4": 1.5},
    {"letter": "D", "min_score": 4.0, "max_score": 4.99, "gpa_4": 1.0},
    {"letter": "F", "min_score": 0.0, "max_score": 3.99, "gpa_4": 0.0},
]


@router.get("/")
async def get_letter_grades(current_user: dict = Depends(get_current_active_user)):
    doc = letter_grades_collection.find_one({})
    if not doc:
        # Initialize with defaults
        result = letter_grades_collection.insert_one({"scale": DEFAULT_SCALE})
        doc = letter_grades_collection.find_one({"_id": result.inserted_id})
    return serialize(doc)


@router.put("/")
async def update_letter_grades(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    """Update the letter grade scale. data: { scale: [{letter, min_score, max_score, gpa_4}] }"""
    scale = data.get("scale", DEFAULT_SCALE)

    existing = letter_grades_collection.find_one({})
    if existing:
        letter_grades_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"scale": scale}}
        )
        updated = letter_grades_collection.find_one({"_id": existing["_id"]})
    else:
        result = letter_grades_collection.insert_one({"scale": scale})
        updated = letter_grades_collection.find_one({"_id": result.inserted_id})

    return serialize(updated)
