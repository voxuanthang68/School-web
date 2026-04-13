from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import enrollments_collection, users_collection, subjects_collection, semesters_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_enrollment(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    # Verify student
    student = users_collection.find_one({"_id": ObjectId(data["student_id"]), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

    # Verify subject
    subject = subjects_collection.find_one({"_id": ObjectId(data["subject_id"])})
    if not subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")

    # Verify semester is open
    semester = semesters_collection.find_one({"_id": ObjectId(data["semester_id"])})
    if not semester:
        raise HTTPException(status_code=404, detail="Không tìm thấy học kỳ")
    if semester.get("status") != "open":
        raise HTTPException(status_code=400, detail="Học kỳ đã khóa, không thể đăng ký")

    # Check duplicate
    existing = enrollments_collection.find_one({
        "student_id": data["student_id"],
        "subject_id": data["subject_id"],
        "semester_id": data["semester_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Sinh viên đã đăng ký môn này trong học kỳ")

    enrollment = {
        "student_id": data["student_id"],
        "subject_id": data["subject_id"],
        "semester_id": data["semester_id"],
    }
    result = enrollments_collection.insert_one(enrollment)
    created = enrollments_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_enrollments(current_user: dict = Depends(get_current_active_user)):
    query = {}
    if current_user["role"] == "student":
        query = {"student_id": current_user["id"]}

    enrollments = []
    for doc in enrollments_collection.find(query):
        e = serialize(doc)
        student = users_collection.find_one({"_id": ObjectId(e["student_id"])})
        subject = subjects_collection.find_one({"_id": ObjectId(e["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(e["semester_id"])})

        e["student_name"] = student.get("name", "") if student else ""
        e["student_code"] = student.get("user_code", "") if student else ""
        e["subject_name"] = subject.get("name", "") if subject else ""
        e["subject_code"] = subject.get("code", "") if subject else ""
        e["semester_name"] = semester.get("name", "") if semester else ""
        e["semester_year"] = semester.get("year", "") if semester else ""

        enrollments.append(e)
    return enrollments


@router.delete("/{enrollment_id}")
async def delete_enrollment(enrollment_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = enrollments_collection.delete_one({"_id": ObjectId(enrollment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy đăng ký")
    return {"message": "Đã xóa đăng ký"}
