from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import subjects_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/subjects", tags=["subjects"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_subject(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    # Check duplicate code
    existing = subjects_collection.find_one({"code": data["code"]})
    if existing:
        raise HTTPException(status_code=400, detail="Mã môn học đã tồn tại")

    subject = {
        "code": data["code"],
        "name": data["name"],
        "credits": data.get("credits", 3),
        "department": data.get("department", ""),
        "status": data.get("status", "active"),  # active / inactive
    }
    result = subjects_collection.insert_one(subject)
    created = subjects_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_subjects(current_user: dict = Depends(get_current_active_user)):
    subjects = []
    for doc in subjects_collection.find().sort("code", 1):
        subjects.append(serialize(doc))
    return subjects


@router.put("/{subject_id}")
async def update_subject(subject_id: str, data: dict, current_user: dict = Depends(require_role(["admin"]))):
    doc = subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")

    update_fields = {}
    for field in ["code", "name", "credits", "department", "status"]:
        if field in data:
            update_fields[field] = data[field]

    if update_fields:
        subjects_collection.update_one({"_id": ObjectId(subject_id)}, {"$set": update_fields})

    updated = subjects_collection.find_one({"_id": ObjectId(subject_id)})
    return serialize(updated)


@router.delete("/{subject_id}")
async def delete_subject(subject_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = subjects_collection.delete_one({"_id": ObjectId(subject_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    return {"message": "Đã xóa môn học"}
