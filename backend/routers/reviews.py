from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from database import (
    reviews_collection, review_config_collection,
    grades_collection, classes_collection, users_collection,
    subjects_collection
)
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_review(data: dict, current_user: dict = Depends(require_role(["student"]))):
    """Student submits a grade review request."""
    # Check review config
    config = review_config_collection.find_one({})
    if config and not config.get("enabled", True):
        raise HTTPException(status_code=400, detail="Phúc khảo đang đóng")

    grade = grades_collection.find_one({"_id": ObjectId(data["grade_id"])})
    if not grade:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản điểm")

    if grade["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể phúc khảo điểm của mình")

    # Check duplicate
    existing = reviews_collection.find_one({
        "grade_id": data["grade_id"],
        "student_id": current_user["id"],
        "status": {"$in": ["pending", "processing"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã gửi yêu cầu phúc khảo cho điểm này")

    # Get class/subject info
    cls = classes_collection.find_one({"_id": ObjectId(grade["class_id"])})
    subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])}) if cls else None

    review = {
        "student_id": current_user["id"],
        "grade_id": data["grade_id"],
        "class_id": grade["class_id"],
        "reason": data.get("reason", ""),
        "old_score": str(grade.get("final_score_10", "")),
        "new_score": "",
        "status": "pending",  # pending / processing / resolved
        "result": "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = reviews_collection.insert_one(review)
    created = reviews_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_reviews(current_user: dict = Depends(get_current_active_user)):
    """Get reviews based on role."""
    query = {}
    if current_user["role"] == "student":
        query = {"student_id": current_user["id"]}
    elif current_user["role"] == "teacher":
        # Get classes of this teacher
        teacher_classes = list(classes_collection.find({"teacher_id": current_user["id"]}))
        class_ids = [str(c["_id"]) for c in teacher_classes]
        query = {"class_id": {"$in": class_ids}}

    reviews = []
    for doc in reviews_collection.find(query).sort("created_at", -1):
        r = serialize(doc)
        student = users_collection.find_one({"_id": ObjectId(r["student_id"])})
        r["student_name"] = student.get("name", "") if student else ""
        r["student_code"] = student.get("user_code", "") if student else ""

        # Get class/subject info
        cls = classes_collection.find_one({"_id": ObjectId(r["class_id"])})
        if cls:
            r["class_name"] = cls.get("name", "")
            subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
            r["subject_name"] = subject.get("name", "") if subject else ""

        reviews.append(r)
    return reviews


# ─── Review Config ───
@router.get("/config")
async def get_review_config(current_user: dict = Depends(get_current_active_user)):
    doc = review_config_collection.find_one({})
    if not doc:
        default_config = {"enabled": True, "deadline_days": 7, "description": "Thời gian phúc khảo: 7 ngày"}
        result = review_config_collection.insert_one(default_config)
        doc = review_config_collection.find_one({"_id": result.inserted_id})
    return serialize(doc)


@router.put("/config")
async def update_review_config(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    doc = review_config_collection.find_one({})
    if doc:
        review_config_collection.update_one({"_id": doc["_id"]}, {"$set": data})
        updated = review_config_collection.find_one({"_id": doc["_id"]})
    else:
        result = review_config_collection.insert_one(data)
        updated = review_config_collection.find_one({"_id": result.inserted_id})
    return serialize(updated)


@router.put("/{review_id}")
async def update_review(review_id: str, data: dict,
                         current_user: dict = Depends(require_role(["admin", "teacher"]))):
    """Admin/teacher processes a review."""
    doc = reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu phúc khảo")

    update_fields = {}
    for field in ["status", "result"]:
        if field in data:
            update_fields[field] = data[field]
            
    # Auto-populate new_score when resolved
    if update_fields.get("status") in ["resolved", "rejected"]:
        grade = grades_collection.find_one({"_id": ObjectId(doc["grade_id"])})
        if grade:
            update_fields["new_score"] = str(grade.get("final_score_10", ""))
            
    update_fields["updated_at"] = datetime.utcnow()

    reviews_collection.update_one({"_id": ObjectId(review_id)}, {"$set": update_fields})
    updated = reviews_collection.find_one({"_id": ObjectId(review_id)})
    return serialize(updated)



