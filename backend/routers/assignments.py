from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import teaching_assignments_collection, users_collection, subjects_collection, semesters_collection
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/assignments", tags=["assignments"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_assignment(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    # Verify teacher
    teacher = users_collection.find_one({"_id": ObjectId(data["teacher_id"]), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Không tìm thấy giáo viên")

    # Verify subject
    subject = subjects_collection.find_one({"_id": ObjectId(data["subject_id"])})
    if not subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")

    # Verify semester
    semester = semesters_collection.find_one({"_id": ObjectId(data["semester_id"])})
    if not semester:
        raise HTTPException(status_code=404, detail="Không tìm thấy học kỳ")

    # Check duplicate
    existing = teaching_assignments_collection.find_one({
        "teacher_id": data["teacher_id"],
        "subject_id": data["subject_id"],
        "semester_id": data["semester_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Phân công này đã tồn tại")

    assignment = {
        "teacher_id": data["teacher_id"],
        "subject_id": data["subject_id"],
        "semester_id": data["semester_id"],
    }
    result = teaching_assignments_collection.insert_one(assignment)
    created = teaching_assignments_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_assignments(current_user: dict = Depends(get_current_active_user)):
    assignments = []
    query = {}
    if current_user["role"] == "teacher":
        query = {"teacher_id": current_user["id"]}

    for doc in teaching_assignments_collection.find(query):
        a = serialize(doc)
        # Enrich with names
        teacher = users_collection.find_one({"_id": ObjectId(a["teacher_id"])})
        subject = subjects_collection.find_one({"_id": ObjectId(a["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(a["semester_id"])})

        a["teacher_name"] = teacher.get("name", "") if teacher else ""
        a["teacher_code"] = teacher.get("user_code", "") if teacher else ""
        a["subject_name"] = subject.get("name", "") if subject else ""
        a["subject_code"] = subject.get("code", "") if subject else ""
        a["semester_name"] = semester.get("name", "") if semester else ""
        a["semester_year"] = semester.get("year", "") if semester else ""
        a["semester_status"] = semester.get("status", "") if semester else ""

        assignments.append(a)
    return assignments


@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = teaching_assignments_collection.delete_one({"_id": ObjectId(assignment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy phân công")
    return {"message": "Đã xóa phân công"}
