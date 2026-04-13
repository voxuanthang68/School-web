from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import grade_types_collection, subjects_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/grade-types", tags=["grade-types"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_or_add_grade_type(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    """
    Add a grade type item to a subject.
    data: { subject_id, name, weight }
    """
    subject = subjects_collection.find_one({"_id": ObjectId(data["subject_id"])})
    if not subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")

    existing = grade_types_collection.find_one({"subject_id": data["subject_id"]})

    item = {"name": data["name"], "weight": float(data["weight"])}

    if existing:
        # Add new item to existing config
        items = existing.get("items", [])
        items.append(item)
        grade_types_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"items": items}}
        )
        updated = grade_types_collection.find_one({"_id": existing["_id"]})
        return serialize(updated)
    else:
        # Create new config
        config = {
            "subject_id": data["subject_id"],
            "items": [item]
        }
        result = grade_types_collection.insert_one(config)
        created = grade_types_collection.find_one({"_id": result.inserted_id})
        return serialize(created)


@router.get("/")
async def get_all_grade_types(current_user: dict = Depends(get_current_active_user)):
    configs = []
    for doc in grade_types_collection.find():
        config = serialize(doc)
        # Attach subject info
        subject = subjects_collection.find_one({"_id": ObjectId(config["subject_id"])})
        if subject:
            config["subject_name"] = subject.get("name", "")
            config["subject_code"] = subject.get("code", "")
        configs.append(config)
    return configs


@router.get("/{subject_id}")
async def get_grade_types_by_subject(subject_id: str, current_user: dict = Depends(get_current_active_user)):
    doc = grade_types_collection.find_one({"subject_id": subject_id})
    if not doc:
        return {"subject_id": subject_id, "items": []}
    config = serialize(doc)
    subject = subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if subject:
        config["subject_name"] = subject.get("name", "")
        config["subject_code"] = subject.get("code", "")
    return config


@router.put("/{config_id}/item/{item_index}")
async def update_grade_type_item(config_id: str, item_index: int, data: dict,
                                  current_user: dict = Depends(require_role(["admin"]))):
    doc = grade_types_collection.find_one({"_id": ObjectId(config_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình")

    items = doc.get("items", [])
    if item_index < 0 or item_index >= len(items):
        raise HTTPException(status_code=400, detail="Chỉ số không hợp lệ")

    if "name" in data:
        items[item_index]["name"] = data["name"]
    if "weight" in data:
        items[item_index]["weight"] = float(data["weight"])

    grade_types_collection.update_one(
        {"_id": ObjectId(config_id)},
        {"$set": {"items": items}}
    )
    updated = grade_types_collection.find_one({"_id": ObjectId(config_id)})
    return serialize(updated)


@router.delete("/{config_id}/item/{item_index}")
async def delete_grade_type_item(config_id: str, item_index: int,
                                  current_user: dict = Depends(require_role(["admin"]))):
    doc = grade_types_collection.find_one({"_id": ObjectId(config_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình")

    items = doc.get("items", [])
    if item_index < 0 or item_index >= len(items):
        raise HTTPException(status_code=400, detail="Chỉ số không hợp lệ")

    items.pop(item_index)

    if len(items) == 0:
        grade_types_collection.delete_one({"_id": ObjectId(config_id)})
        return {"message": "Đã xóa toàn bộ cấu hình đầu điểm"}

    grade_types_collection.update_one(
        {"_id": ObjectId(config_id)},
        {"$set": {"items": items}}
    )
    updated = grade_types_collection.find_one({"_id": ObjectId(config_id)})
    return serialize(updated)
