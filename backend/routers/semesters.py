from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import semesters_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/semesters", tags=["semesters"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_semester(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    semester = {
        "name": data["name"],
        "year": data.get("year", 2024),
        "status": data.get("status", "open"),  # open / locked
    }
    result = semesters_collection.insert_one(semester)
    created = semesters_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_semesters(current_user: dict = Depends(get_current_active_user)):
    semesters = []
    for doc in semesters_collection.find().sort([("year", -1), ("name", 1)]):
        semesters.append(serialize(doc))
    return semesters


@router.put("/{semester_id}")
async def update_semester(semester_id: str, data: dict, current_user: dict = Depends(require_role(["admin"]))):
    doc = semesters_collection.find_one({"_id": ObjectId(semester_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy học kỳ")

    update_fields = {}
    for field in ["name", "year", "status"]:
        if field in data:
            update_fields[field] = data[field]

    if update_fields:
        semesters_collection.update_one({"_id": ObjectId(semester_id)}, {"$set": update_fields})

    updated = semesters_collection.find_one({"_id": ObjectId(semester_id)})
    return serialize(updated)


@router.delete("/{semester_id}")
async def delete_semester(semester_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = semesters_collection.delete_one({"_id": ObjectId(semester_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy học kỳ")
    return {"message": "Đã xóa học kỳ"}
