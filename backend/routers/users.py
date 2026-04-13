from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from bson import ObjectId
from datetime import timedelta
import jwt

from database import users_collection
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM
)

router = APIRouter(prefix="/users", tags=["users"])


def serialize_user(user):
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password", None)
    return user


@router.post("/register")
async def register(data: dict):
    existing = users_collection.find_one({"email": data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")

    user_dict = {
        "email": data["email"],
        "password": get_password_hash(data["password"]),
        "name": data.get("name", ""),
        "role": data.get("role", "student"),
        "user_code": data.get("user_code", ""),
        "gender": data.get("gender", ""),
        "address": data.get("address", ""),
        "department": data.get("department", ""),
        "class_name": data.get("class_name", ""),
        "cohort": data.get("cohort", ""),
    }
    result = users_collection.insert_one(user_dict)
    created = users_collection.find_one({"_id": result.inserted_id})
    return serialize_user(created)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "id": str(user["_id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    return serialize_user(current_user)


@router.get("/")
async def read_users(current_user: dict = Depends(require_role(["admin"]))):
    users = []
    for u in users_collection.find():
        users.append(serialize_user(u))
    return users


@router.get("/by-role/{role}")
async def read_users_by_role(role: str, current_user: dict = Depends(require_role(["admin", "teacher"]))):
    users = []
    for u in users_collection.find({"role": role}):
        users.append(serialize_user(u))
    return users


@router.post("/create")
async def create_user(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    existing = users_collection.find_one({"email": data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")

    user_dict = {
        "email": data["email"],
        "password": get_password_hash(data.get("password", "123456")),
        "name": data.get("name", ""),
        "role": data.get("role", "student"),
        "user_code": data.get("user_code", ""),
        "gender": data.get("gender", ""),
        "address": data.get("address", ""),
        "department": data.get("department", ""),
        "class_name": data.get("class_name", ""),
        "cohort": data.get("cohort", ""),
    }
    result = users_collection.insert_one(user_dict)
    created = users_collection.find_one({"_id": result.inserted_id})
    return serialize_user(created)


@router.put("/{user_id}")
async def update_user(user_id: str, data: dict, current_user: dict = Depends(require_role(["admin"]))):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    update_fields = {}
    for field in ["name", "email", "role", "user_code", "gender", "address", "department", "class_name", "cohort"]:
        if field in data:
            update_fields[field] = data[field]

    if "password" in data and data["password"]:
        update_fields["password"] = get_password_hash(data["password"])

    if update_fields:
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})

    updated = users_collection.find_one({"_id": ObjectId(user_id)})
    return serialize_user(updated)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return {"message": "Đã xóa người dùng"}


@router.get("/stats")
async def get_system_stats(current_user: dict = Depends(require_role(["admin"]))):
    from database import subjects_collection, classes_collection, semesters_collection, reviews_collection
    users_list = list(users_collection.find())
    open_semesters = semesters_collection.count_documents({"status": "open"})
    open_classes = classes_collection.count_documents({"status": "open"})
    pending_reviews = reviews_collection.count_documents({"status": "pending"})
    processing_reviews = reviews_collection.count_documents({"status": "processing"})

    return {
        "users": len(users_list),
        "teachers": len([u for u in users_list if u.get("role") == "teacher"]),
        "students": len([u for u in users_list if u.get("role") == "student"]),
        "admins": len([u for u in users_list if u.get("role") == "admin"]),
        "subjects": subjects_collection.count_documents({}),
        "classes": classes_collection.count_documents({}),
        "semesters": semesters_collection.count_documents({}),
        "open_semesters": open_semesters,
        "open_classes": open_classes,
        "pending_reviews": pending_reviews,
        "processing_reviews": processing_reviews,
    }
