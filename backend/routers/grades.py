from fastapi import APIRouter, Depends, HTTPException, Response
from bson import ObjectId
from datetime import datetime

from database import (
    grades_collection, classes_collection, users_collection,
    grade_types_collection, letter_grades_collection,
    subjects_collection, semesters_collection
)
from auth import require_role, get_current_active_user

router = APIRouter(prefix="/grades", tags=["grades"])


def serialize(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


def get_letter_grade_scale():
    """Get the current letter grade scale."""
    doc = letter_grades_collection.find_one({})
    if doc:
        return doc.get("scale", [])
    return []


def compute_final_score(scores: dict, grade_type_items: list):
    """
    Compute weighted final score on a 10-point scale.
    scores: { "Chuyên cần": 8.0, "Giữa kỳ": 7.5, "Cuối kỳ": 6.0 }
    grade_type_items: [{"name": "Chuyên cần", "weight": 10}, ...]
    """
    if not grade_type_items:
        return 0.0

    total = 0.0
    total_weight = 0.0
    for item in grade_type_items:
        name = item["name"]
        weight = item["weight"]
        score = scores.get(name)
        if score is not None:
            total += float(score) * (weight / 100.0)
            total_weight += weight

    return round(total, 2)


def score_to_letter(score_10, scale):
    """Convert a 10-point score to letter grade + GPA 4.0."""
    for entry in sorted(scale, key=lambda x: -x["min_score"]):
        if score_10 >= entry["min_score"]:
            return {
                "letter": entry["letter"],
                "gpa_4": entry["gpa_4"],
            }
    return {"letter": "F", "gpa_4": 0.0}


def is_pass(score_10):
    """Pass if score >= 4.0"""
    return score_10 >= 4.0


@router.put("/class/{class_id}")
async def upsert_class_grades(class_id: str, data: dict,
                                current_user: dict = Depends(require_role(["teacher"]))):
    """
    Teacher enters/updates grades for all students in a class.
    data: { grades: [{ student_id, scores: { "Chuyên cần": 8.0, ... } }] }
    """
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if cls["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    # Check if grades are approved - cannot edit
    existing_grades = list(grades_collection.find({"class_id": class_id}))
    for g in existing_grades:
        if g.get("status") == "approved":
            raise HTTPException(status_code=400, detail="Bảng điểm đã được duyệt, không thể sửa")

    # Get grade type config for this subject
    subject_id = cls.get("subject_id")
    grade_config = grade_types_collection.find_one({"subject_id": subject_id})
    grade_items = grade_config.get("items", []) if grade_config else []

    # Get letter grade scale
    scale = get_letter_grade_scale()

    grades_list = data.get("grades", [])
    results = []

    for entry in grades_list:
        student_id = entry["student_id"]

        # Verify student is in class
        if student_id not in cls.get("approved_students", []):
            continue

        scores = entry.get("scores", {})

        # Compute final score
        final_10 = compute_final_score(scores, grade_items)
        letter_info = score_to_letter(final_10, scale) if scale else {"letter": "N/A", "gpa_4": 0.0}

        grade_doc = {
            "student_id": student_id,
            "class_id": class_id,
            "scores": scores,
            "final_score_10": final_10,
            "final_score_4": letter_info["gpa_4"],
            "letter_grade": letter_info["letter"],
            "is_pass": is_pass(final_10),
            "status": "draft",
            "updated_at": datetime.utcnow(),
        }

        result = grades_collection.find_one_and_update(
            {"class_id": class_id, "student_id": student_id},
            {"$set": grade_doc},
            upsert=True,
            return_document=True
        )
        results.append(serialize(result))

    return {"message": f"Đã lưu điểm cho {len(results)} sinh viên", "grades": results}


@router.post("/class/{class_id}/submit")
async def submit_grades(class_id: str, current_user: dict = Depends(require_role(["teacher"]))):
    """Teacher submits grades for approval → status becomes 'submitted'"""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if cls["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không phải giáo viên của lớp này")

    # Check all students have grades
    grades_count = grades_collection.count_documents({"class_id": class_id})
    if grades_count == 0:
        raise HTTPException(status_code=400, detail="Chưa có điểm nào để nộp")

    grades_collection.update_many(
        {"class_id": class_id, "status": "draft"},
        {"$set": {"status": "submitted", "submitted_at": datetime.utcnow()}}
    )
    return {"message": "Đã nộp bảng điểm chờ duyệt"}


@router.post("/class/{class_id}/approve")
async def approve_grades(class_id: str, current_user: dict = Depends(require_role(["admin"]))):
    """Admin approves submitted grades → status becomes 'approved'"""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    result = grades_collection.update_many(
        {"class_id": class_id, "status": "submitted"},
        {"$set": {"status": "approved", "approved_at": datetime.utcnow()}}
    )
    return {"message": f"Đã duyệt bảng điểm ({result.modified_count} mục)"}


@router.post("/class/{class_id}/reject")
async def reject_grades(class_id: str, current_user: dict = Depends(require_role(["admin"]))):
    """Admin rejects/reopens grades → status becomes 'draft'"""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    grades_collection.update_many(
        {"class_id": class_id},
        {"$set": {"status": "draft"}}
    )
    return {"message": "Đã mở lại bảng điểm để chỉnh sửa"}


@router.get("/class/{class_id}")
async def get_class_grades(class_id: str, current_user: dict = Depends(require_role(["admin", "teacher"]))):
    """Get all grades for a class, enriched with student info."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    # Get grade type config
    subject_id = cls.get("subject_id")
    grade_config = grade_types_collection.find_one({"subject_id": subject_id})
    grade_items = grade_config.get("items", []) if grade_config else []

    grades = []
    for doc in grades_collection.find({"class_id": class_id}):
        g = serialize(doc)
        student = users_collection.find_one({"_id": ObjectId(g["student_id"])})
        if student:
            g["student_name"] = student.get("name", "")
            g["student_code"] = student.get("user_code", "")
        grades.append(g)

    # Get status (use first grade status)
    status = grades[0]["status"] if grades else "draft"

    return {
        "class_id": class_id,
        "grade_items": grade_items,
        "grades": grades,
        "status": status,
        "subject_id": subject_id,
    }


@router.get("/my")
async def get_my_grades(
    semester_id: str = None,
    current_user: dict = Depends(require_role(["student"]))
):
    """Student views their personal grades, optionally filtered by semester."""
    # Get all classes student is enrolled in
    query = {"approved_students": current_user["id"]}
    if semester_id:
        query["semester_id"] = semester_id

    student_classes = list(classes_collection.find(query))

    results = []
    for cls in student_classes:
        class_id = str(cls["_id"])
        subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(cls["semester_id"])})

        # Get grade for this student in this class
        grade = grades_collection.find_one({"class_id": class_id, "student_id": current_user["id"]})

        # Get grade config
        grade_config = grade_types_collection.find_one({"subject_id": cls["subject_id"]})
        grade_items = grade_config.get("items", []) if grade_config else []

        entry = {
            "class_id": class_id,
            "class_name": cls.get("name", ""),
            "subject_name": subject.get("name", "") if subject else "",
            "subject_code": subject.get("code", "") if subject else "",
            "credits": subject.get("credits", 3) if subject else 3,
            "semester_name": semester.get("name", "") if semester else "",
            "semester_year": semester.get("year", "") if semester else "",
            "semester_id": cls.get("semester_id", ""),
            "grade_items": grade_items,
            "scores": {},
            "final_score_10": None,
            "final_score_4": None,
            "letter_grade": None,
            "is_pass": None,
            "status": "N/A",
        }

        if grade:
            g = serialize(grade)
            entry["scores"] = g.get("scores", {})
            entry["final_score_10"] = g.get("final_score_10")
            entry["final_score_4"] = g.get("final_score_4")
            entry["letter_grade"] = g.get("letter_grade")
            entry["is_pass"] = g.get("is_pass")
            entry["status"] = g.get("status", "draft")

        results.append(entry)

    return results


@router.get("/all-for-approval")
async def get_all_grades_for_approval(current_user: dict = Depends(require_role(["admin"]))):
    """Admin: get a summary of all classes with their grade statuses."""
    classes = list(classes_collection.find())
    result = []

    for cls in classes:
        class_id = str(cls["_id"])
        subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
        semester = semesters_collection.find_one({"_id": ObjectId(cls["semester_id"])})
        teacher = users_collection.find_one({"_id": ObjectId(cls["teacher_id"])})

        grades = list(grades_collection.find({"class_id": class_id}))
        statuses = [g.get("status", "draft") for g in grades]

        # Determine overall status
        if not grades:
            overall_status = "no_grades"
        elif all(s == "approved" for s in statuses):
            overall_status = "approved"
        elif all(s == "submitted" for s in statuses):
            overall_status = "submitted"
        elif any(s == "submitted" for s in statuses):
            overall_status = "submitted"
        else:
            overall_status = "draft"

        result.append({
            "class_id": class_id,
            "class_name": cls.get("name", ""),
            "subject_name": subject.get("name", "") if subject else "",
            "subject_code": subject.get("code", "") if subject else "",
            "semester_name": semester.get("name", "") if semester else "",
            "semester_year": semester.get("year", "") if semester else "",
            "teacher_name": teacher.get("name", "") if teacher else "",
            "teacher_code": teacher.get("user_code", "") if teacher else "",
            "student_count": len(cls.get("approved_students", [])),
            "grades_count": len(grades),
            "status": overall_status,
        })

    return result


@router.get("/export/{fmt}/{class_id}")
async def export_grades(fmt: str, class_id: str,
                         current_user: dict = Depends(require_role(["admin", "teacher"]))):
    """Export class grades as CSV or Excel."""
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    grades = list(grades_collection.find({"class_id": class_id}))
    subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
    grade_config = grade_types_collection.find_one({"subject_id": cls["subject_id"]})
    grade_items = grade_config.get("items", []) if grade_config else []

    # Build data
    import io
    if fmt == "csv":
        output = io.StringIO()
        headers = ["Mã SV", "Họ tên"]
        for item in grade_items:
            headers.append(f"{item['name']} ({item['weight']}%)")
        headers.extend(["Điểm cuối (Thang 10)", "Thang 4", "Điểm chữ", "Kết quả"])
        output.write(",".join(headers) + "\n")

        for g in grades:
            student = users_collection.find_one({"_id": ObjectId(g["student_id"])})
            row = [
                student.get("user_code", "") if student else "",
                student.get("name", "") if student else "",
            ]
            scores = g.get("scores", {})
            for item in grade_items:
                row.append(str(scores.get(item["name"], "")))
            row.append(str(g.get("final_score_10", "")))
            row.append(str(g.get("final_score_4", "")))
            row.append(g.get("letter_grade", ""))
            row.append("Đậu" if g.get("is_pass") else "Rớt")
            output.write(",".join(row) + "\n")

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=grades_{class_id}.csv"}
        )

    elif fmt == "xlsx":
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Bảng điểm"

        headers = ["Mã SV", "Họ tên"]
        for item in grade_items:
            headers.append(f"{item['name']} ({item['weight']}%)")
        headers.extend(["Điểm cuối (Thang 10)", "Thang 4", "Điểm chữ", "Kết quả"])
        ws.append(headers)

        for g in grades:
            student = users_collection.find_one({"_id": ObjectId(g["student_id"])})
            row = [
                student.get("user_code", "") if student else "",
                student.get("name", "") if student else "",
            ]
            scores = g.get("scores", {})
            for item in grade_items:
                row.append(scores.get(item["name"], ""))
            row.append(g.get("final_score_10", ""))
            row.append(g.get("final_score_4", ""))
            row.append(g.get("letter_grade", ""))
            row.append("Đậu" if g.get("is_pass") else "Rớt")
            ws.append(row)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return Response(
            content=output.read(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=grades_{class_id}.xlsx"}
        )

    raise HTTPException(status_code=400, detail="Định dạng không hợp lệ (csv hoặc xlsx)")
