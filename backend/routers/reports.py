from fastapi import APIRouter, Depends
from bson import ObjectId

from database import (
    grades_collection, classes_collection, users_collection,
    subjects_collection, semesters_collection,
    letter_grades_collection, reviews_collection
)
from auth import require_role

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(require_role(["admin", "teacher"]))):
    """Dashboard overview stats."""
    total_students = users_collection.count_documents({"role": "student"})
    total_teachers = users_collection.count_documents({"role": "teacher"})
    total_subjects = subjects_collection.count_documents({})
    total_semesters = semesters_collection.count_documents({})
    total_classes = classes_collection.count_documents({})
    open_classes = classes_collection.count_documents({"status": "open"})
    open_semesters = semesters_collection.count_documents({"status": "open"})
    pending_reviews = reviews_collection.count_documents({"status": "pending"})
    processing_reviews = reviews_collection.count_documents({"status": "processing"})

    # Pass/Fail stats
    all_grades = list(grades_collection.find({"status": "approved"}))
    total_graded = len(all_grades)
    pass_count = len([g for g in all_grades if g.get("is_pass")])
    fail_count = total_graded - pass_count

    return {
        "students": total_students,
        "teachers": total_teachers,
        "subjects": total_subjects,
        "semesters": total_semesters,
        "classes": total_classes,
        "open_classes": open_classes,
        "open_semesters": open_semesters,
        "pending_reviews": pending_reviews,
        "processing_reviews": processing_reviews,
        "total_graded": total_graded,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "pass_rate": round(pass_count / total_graded * 100, 1) if total_graded > 0 else 0,
        "fail_rate": round(fail_count / total_graded * 100, 1) if total_graded > 0 else 0,
    }


@router.get("/grade-distribution")
async def get_grade_distribution(
    semester_id: str = None,
    class_id: str = None,
    current_user: dict = Depends(require_role(["admin", "teacher"]))
):
    """Get letter grade distribution (A, B+, B, C+, C, D+, D, F)."""
    query = {}
    if class_id:
        query["class_id"] = class_id
    elif semester_id:
        # Get classes in that semester
        classes = list(classes_collection.find({"semester_id": semester_id}))
        class_ids = [str(c["_id"]) for c in classes]
        query["class_id"] = {"$in": class_ids}

    if current_user["role"] == "teacher":
        teacher_classes = list(classes_collection.find({"teacher_id": current_user["id"]}))
        teacher_class_ids = [str(c["_id"]) for c in teacher_classes]
        if "class_id" in query and isinstance(query["class_id"], dict):
            query["class_id"]["$in"] = [cid for cid in query["class_id"]["$in"] if cid in teacher_class_ids]
        elif "class_id" not in query:
            query["class_id"] = {"$in": teacher_class_ids}

    grades = list(grades_collection.find(query))
    distribution = {"A": 0, "B+": 0, "B": 0, "C+": 0, "C": 0, "D+": 0, "D": 0, "F": 0}

    for g in grades:
        letter = g.get("letter_grade", "F")
        if letter in distribution:
            distribution[letter] += 1

    return distribution


@router.get("/top-gpa")
async def get_top_gpa(limit: int = 10, current_user: dict = Depends(require_role(["admin"]))):
    """Get top students by GPA."""
    # Aggregate grades by student
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {
            "_id": "$student_id",
            "avg_gpa_4": {"$avg": "$final_score_4"},
            "avg_score_10": {"$avg": "$final_score_10"},
            "total_subjects": {"$sum": 1}
        }},
        {"$sort": {"avg_gpa_4": -1}},
        {"$limit": limit}
    ]
    results = list(grades_collection.aggregate(pipeline))

    top_students = []
    for r in results:
        student = users_collection.find_one({"_id": ObjectId(r["_id"])})
        top_students.append({
            "student_id": r["_id"],
            "student_name": student.get("name", "") if student else "",
            "student_code": student.get("user_code", "") if student else "",
            "avg_gpa_4": round(r["avg_gpa_4"], 2),
            "avg_score_10": round(r["avg_score_10"], 2),
            "total_subjects": r["total_subjects"]
        })

    return top_students


@router.get("/student-scores/{class_id}")
async def get_student_scores_chart(class_id: str, current_user: dict = Depends(require_role(["admin", "teacher"]))):
    """Get all student scores for a specific class for chart display."""
    grades = list(grades_collection.find({"class_id": class_id}))
    result = []
    for g in grades:
        student = users_collection.find_one({"_id": ObjectId(g["student_id"])})
        result.append({
            "student_name": student.get("name", "") if student else "",
            "student_code": student.get("user_code", "") if student else "",
            "final_score_10": g.get("final_score_10", 0),
            "letter_grade": g.get("letter_grade", ""),
            "is_pass": g.get("is_pass", False),
        })
    return result
