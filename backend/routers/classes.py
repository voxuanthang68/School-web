from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import (
    classes_collection, subjects_collection, users_collection,
    semesters_collection, enrollments_collection, grades_collection,
    reviews_collection
)
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/classes", tags=["classes"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/")
async def create_class(data: dict, current_user: dict = Depends(require_role(["admin"]))):
    subject = subjects_collection.find_one({"_id": ObjectId(data["subject_id"])})
    if not subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")

    semester = semesters_collection.find_one({"_id": ObjectId(data["semester_id"])})
    if not semester:
        raise HTTPException(status_code=404, detail="Không tìm thấy học kỳ")

    teacher = users_collection.find_one({"_id": ObjectId(data["teacher_id"]), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Không tìm thấy giáo viên")

    cls = {
        "name": data["name"],
        "subject_id": data["subject_id"],
        "semester_id": data["semester_id"],
        "teacher_id": data["teacher_id"],
        "status": data.get("status", "open"),  # open / closed
        "student_requests": [],  # [{student_id, status: pending/approved/rejected}]
        "approved_students": [],  # list of student_ids
        "room": data.get("room", ""),
        "schedule": data.get("schedule", ""),
    }
    result = classes_collection.insert_one(cls)
    created = classes_collection.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.get("/")
async def get_classes(current_user: dict = Depends(get_current_active_user)):
    query = {}
    if current_user["role"] == "teacher":
        query = {"teacher_id": current_user["id"]}
    elif current_user["role"] == "student":
        query = {"approved_students": current_user["id"]}

    classes = []
    for doc in classes_collection.find(query):
        cls = serialize(doc)
        # Enrich
        subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(cls["semester_id"])})
        teacher = users_collection.find_one({"_id": ObjectId(cls["teacher_id"])})

        cls["subject_name"] = subject.get("name", "") if subject else ""
        cls["subject_code"] = subject.get("code", "") if subject else ""
        cls["semester_name"] = semester.get("name", "") if semester else ""
        cls["semester_year"] = semester.get("year", "") if semester else ""
        cls["semester_status"] = semester.get("status", "") if semester else ""
        cls["teacher_name"] = teacher.get("name", "") if teacher else ""
        cls["teacher_code"] = teacher.get("user_code", "") if teacher else ""
        cls["student_count"] = len(cls.get("approved_students", []))

        classes.append(cls)
    return classes


@router.get("/student-all")
async def get_all_classes_for_student(current_user: dict = Depends(require_role(["student"]))):
    """Get ALL classes with enrollment status for the current student."""
    all_classes = list(classes_collection.find())
    result = []

    for doc in all_classes:
        cls = serialize(doc)
        subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(cls["semester_id"])})
        teacher = users_collection.find_one({"_id": ObjectId(cls["teacher_id"])})

        # Determine student's enrollment status
        student_id = current_user["id"]
        enrollment_status = "none"  # none / pending / approved

        if student_id in cls.get("approved_students", []):
            enrollment_status = "approved"
        else:
            for req in cls.get("student_requests", []):
                if req["student_id"] == student_id:
                    enrollment_status = req.get("status", "pending")
                    break

        pending_count = len([r for r in cls.get("student_requests", []) if r.get("status") == "pending"])
        approved_count = len(cls.get("approved_students", []))

        result.append({
            "id": cls["id"],
            "name": cls.get("name", ""),
            "subject_name": subject.get("name", "") if subject else "",
            "subject_code": subject.get("code", "") if subject else "",
            "semester_name": semester.get("name", "") if semester else "",
            "semester_year": semester.get("year", "") if semester else "",
            "teacher_name": teacher.get("name", "") if teacher else "",
            "status": cls.get("status", "open"),
            "enrollment_status": enrollment_status,
            "pending_count": pending_count,
            "approved_count": approved_count,
        })

    return result


@router.get("/{class_id}")
async def get_class(class_id: str, current_user: dict = Depends(get_current_active_user)):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    cls = serialize(doc)
    subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
    semester = semesters_collection.find_one({"_id": ObjectId(cls["semester_id"])})
    teacher = users_collection.find_one({"_id": ObjectId(cls["teacher_id"])})

    cls["subject_name"] = subject.get("name", "") if subject else ""
    cls["subject_code"] = subject.get("code", "") if subject else ""
    cls["semester_name"] = semester.get("name", "") if semester else ""
    cls["semester_year"] = semester.get("year", "") if semester else ""
    cls["teacher_name"] = teacher.get("name", "") if teacher else ""

    # Enrich approved students
    enriched_students = []
    for sid in cls.get("approved_students", []):
        student = users_collection.find_one({"_id": ObjectId(sid)})
        if student:
            enriched_students.append({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "user_code": student.get("user_code", ""),
                "email": student.get("email", ""),
            })
    cls["approved_students_info"] = enriched_students

    # Enrich pending requests
    enriched_requests = []
    for req in cls.get("student_requests", []):
        student = users_collection.find_one({"_id": ObjectId(req["student_id"])})
        if student:
            enriched_requests.append({
                "student_id": req["student_id"],
                "status": req.get("status", "pending"),
                "name": student.get("name", ""),
                "user_code": student.get("user_code", ""),
                "email": student.get("email", ""),
            })
    cls["student_requests_info"] = enriched_requests

    return cls


@router.put("/{class_id}")
async def update_class(class_id: str, data: dict, current_user: dict = Depends(require_role(["admin"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    update_fields = {}
    for field in ["name", "subject_id", "semester_id", "teacher_id", "status", "room", "schedule"]:
        if field in data:
            update_fields[field] = data[field]

    if update_fields:
        classes_collection.update_one({"_id": ObjectId(class_id)}, {"$set": update_fields})

    updated = classes_collection.find_one({"_id": ObjectId(class_id)})
    return serialize(updated)


@router.put("/{class_id}/status")
async def toggle_class_status(class_id: str, data: dict,
                               current_user: dict = Depends(require_role(["admin", "teacher"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if current_user["role"] == "teacher" and doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    new_status = data.get("status", "open")
    classes_collection.update_one({"_id": ObjectId(class_id)}, {"$set": {"status": new_status}})
    return {"message": f"Đã chuyển trạng thái lớp sang {new_status}"}


@router.post("/{class_id}/request")
async def request_enrollment(class_id: str, current_user: dict = Depends(require_role(["student"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if doc.get("status") != "open":
        raise HTTPException(status_code=400, detail="Lớp đã đóng đăng ký")

    # Check if already requested or approved
    requests = doc.get("student_requests", [])
    already_requested = False
    for req in requests:
        if req["student_id"] == current_user["id"]:
            if req.get("status") == "pending":
                raise HTTPException(status_code=400, detail="Bạn đã gửi yêu cầu đăng ký")
            elif req.get("status") == "rejected":
                req["status"] = "pending"
                already_requested = True
                break

    if current_user["id"] in doc.get("approved_students", []):
        raise HTTPException(status_code=400, detail="Bạn đã được duyệt vào lớp")

    if already_requested:
        classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": {"student_requests": requests}}
        )
    else:
        classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {"$push": {"student_requests": {"student_id": current_user["id"], "status": "pending"}}}
        )
    return {"message": "Đã gửi yêu cầu đăng ký lớp"}


@router.put("/{class_id}/approve/{student_id}")
async def approve_student(class_id: str, student_id: str,
                           current_user: dict = Depends(require_role(["admin", "teacher"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if current_user["role"] == "teacher" and doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    # Update request status
    requests = doc.get("student_requests", [])
    for req in requests:
        if req["student_id"] == student_id:
            req["status"] = "approved"

    # Add to approved students
    approved = doc.get("approved_students", [])
    if student_id not in approved:
        approved.append(student_id)

    classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": {"student_requests": requests, "approved_students": approved}}
    )

    # Auto-create enrollment
    subject_id = doc.get("subject_id")
    semester_id = doc.get("semester_id")
    existing_enrollment = enrollments_collection.find_one({
        "student_id": student_id,
        "subject_id": subject_id,
        "semester_id": semester_id
    })
    if not existing_enrollment:
        enrollments_collection.insert_one({
            "student_id": student_id,
            "subject_id": subject_id,
            "semester_id": semester_id,
        })

    return {"message": "Đã duyệt sinh viên vào lớp"}


@router.put("/{class_id}/reject/{student_id}")
async def reject_student(class_id: str, student_id: str,
                          current_user: dict = Depends(require_role(["admin", "teacher"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    requests = doc.get("student_requests", [])
    for req in requests:
        if req["student_id"] == student_id:
            req["status"] = "rejected"

    classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": {"student_requests": requests}}
    )
    return {"message": "Đã từ chối yêu cầu đăng ký"}


@router.post("/{class_id}/add-student")
async def add_student_manual(class_id: str, data: dict,
                              current_user: dict = Depends(require_role(["admin", "teacher"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    student_id = data["student_id"]
    student = users_collection.find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

    if current_user["role"] == "teacher" and doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    approved = doc.get("approved_students", [])
    if student_id not in approved:
        approved.append(student_id)
        classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": {"approved_students": approved}}
        )

    # Auto-create enrollment
    subject_id = doc.get("subject_id")
    semester_id = doc.get("semester_id")
    existing_enrollment = enrollments_collection.find_one({
        "student_id": student_id,
        "subject_id": subject_id,
        "semester_id": semester_id
    })
    if not existing_enrollment:
        enrollments_collection.insert_one({
            "student_id": student_id,
            "subject_id": subject_id,
            "semester_id": semester_id,
        })

    return {"message": "Đã thêm sinh viên vào lớp"}


@router.delete("/{class_id}/remove-student/{student_id}")
async def remove_student(class_id: str, student_id: str,
                          current_user: dict = Depends(require_role(["admin", "teacher"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if current_user["role"] == "teacher" and doc.get("teacher_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    approved = doc.get("approved_students", [])
    if student_id in approved:
        approved.remove(student_id)
        classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": {"approved_students": approved}}
        )

    # Note: we are not deleting the enrollment automatically here in case they enroll elsewhere
    return {"message": "Đã xóa sinh viên khỏi lớp"}


@router.delete("/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(require_role(["admin"]))):
    doc = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    # Xóa tất cả điểm liên quan đến lớp này
    grades_collection.delete_many({"class_id": class_id})

    # Xóa tất cả yêu cầu phúc khảo liên quan đến lớp này
    reviews_collection.delete_many({"class_id": class_id})

    # Xóa tất cả enrollment liên quan
    subject_id = doc.get("subject_id")
    semester_id = doc.get("semester_id")
    for student_id in doc.get("approved_students", []):
        enrollments_collection.delete_many({
            "student_id": student_id,
            "subject_id": subject_id,
            "semester_id": semester_id,
        })

    # Cuối cùng xóa lớp
    classes_collection.delete_one({"_id": ObjectId(class_id)})
    return {"message": "Đã xóa lớp học và toàn bộ dữ liệu liên quan"}
