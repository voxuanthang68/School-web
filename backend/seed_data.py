"""
Seed data script for Student Grading System.
Run: python seed_data.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database import (
    users_collection, semesters_collection, subjects_collection,
    grade_types_collection, letter_grades_collection,
    teaching_assignments_collection, enrollments_collection,
    classes_collection, grades_collection, review_config_collection,
    db
)
from auth import get_password_hash

def clear_all():
    """Clear all collections."""
    for name in db.list_collection_names():
        db[name].drop()
    print("✓ Cleared all collections")

def seed():
    clear_all()

    # ── 1. Admin ──
    admin = users_collection.insert_one({
        "email": "admin@example.com",
        "password": get_password_hash("123456"),
        "name": "Admin",
        "role": "admin",
        "user_code": "ADMIN",
        "gender": "",
        "address": "",
        "department": "",
        "class_name": "",
        "cohort": "",
    })
    print(f"✓ Admin created: admin@example.com / 123456")

    # ── 2. Teachers (10) ──
    teacher_names = [
        ("Nguyễn Hoàng Kha", "CNTT"),
        ("Trần Thị B", "CNTT"),
        ("Lê Văn C", "CNTT"),
        ("Phạm Thị D", "CNTT"),
        ("Hoàng Văn E", "Toán-Tin"),
        ("Đỗ Thị F", "Toán-Tin"),
        ("Bùi Văn G", "Mạng máy tính"),
        ("Võ Thị H", "Khoa học dữ liệu"),
        ("Phan Văn I", "CNTT"),
        ("Đặng Thị K", "CNTT"),
    ]
    teacher_ids = []
    for i, (name, dept) in enumerate(teacher_names, 1):
        code = f"GV{i:02d}"
        t = users_collection.insert_one({
            "email": f"gv{i:02d}@example.com",
            "password": get_password_hash("123456"),
            "name": name,
            "role": "teacher",
            "user_code": code,
            "gender": "Nam" if i % 2 == 1 else "Nữ",
            "address": "",
            "department": dept,
            "class_name": "",
            "cohort": "",
        })
        teacher_ids.append(str(t.inserted_id))
    print(f"✓ {len(teacher_ids)} teachers created")

    # ── 3. Students (50) ──
    student_ids = []
    for i in range(1, 51):
        code = f"SV{i:03d}"
        class_name = "CNTT01" if i <= 5 else ("CNTT02" if i <= 10 else f"CNTT{(i // 10) + 1:02d}")
        s = users_collection.insert_one({
            "email": f"sv{i:03d}@example.com",
            "password": get_password_hash("123456"),
            "name": f"Sinh viên {i:03d}",
            "role": "student",
            "user_code": code,
            "gender": "Nam" if i % 2 == 1 else "Nữ",
            "address": f"Địa chỉ {i}",
            "department": "CNTT",
            "class_name": class_name,
            "cohort": "K45",
        })
        student_ids.append(str(s.inserted_id))
    print(f"✓ {len(student_ids)} students created")

    # ── 4. Semesters ──
    sem1 = semesters_collection.insert_one({"name": "HK1", "year": 2024, "status": "locked"})
    sem2 = semesters_collection.insert_one({"name": "HK2", "year": 2024, "status": "open"})
    sem3 = semesters_collection.insert_one({"name": "HK1", "year": 2025, "status": "open"})
    print("✓ 3 semesters created")

    # ── 5. Subjects ──
    subjects_data = [
        ("CT101", "Lập trình C", 3, "CNTT"),
        ("DA01", "Đồ án 01", 3, "CNTT"),
        ("DB301", "Cơ sở dữ liệu", 3, "CNTT"),
        ("ML401", "Nhập môn Machine Learning", 3, "KH Dữ liệu"),
        ("NET202", "Mạng máy tính", 3, "Mạng"),
        ("WEB201", "Phát triển Web", 3, "CNTT"),
    ]
    subject_ids_map = {}
    for code, name, credits, dept in subjects_data:
        s = subjects_collection.insert_one({
            "code": code, "name": name, "credits": credits,
            "department": dept, "status": "active"
        })
        subject_ids_map[code] = str(s.inserted_id)
    print(f"✓ {len(subjects_data)} subjects created")

    # ── 6. Grade Types (per subject) ──
    grade_configs = {
        "CT101": [
            {"name": "Chuyên cần", "weight": 10},
            {"name": "Giữa kỳ", "weight": 30},
            {"name": "Cuối kỳ", "weight": 60},
        ],
        "DA01": [
            {"name": "Chuyên cần", "weight": 10},
            {"name": "Báo cáo", "weight": 30},
            {"name": "Cuối kỳ", "weight": 60},
        ],
        "DB301": [
            {"name": "Chuyên cần", "weight": 10},
            {"name": "Bài tập", "weight": 30},
            {"name": "Cuối kỳ", "weight": 60},
        ],
        "ML401": [
            {"name": "Chuyên cần", "weight": 10},
            {"name": "Dự án", "weight": 30},
            {"name": "Cuối kỳ", "weight": 60},
        ],
        "NET202": [
            {"name": "Chuyên cần", "weight": 10},
            {"name": "Giữa kỳ", "weight": 30},
            {"name": "Cuối kỳ", "weight": 60},
        ],
        "WEB201": [
            {"name": "Chuyên cần", "weight": 20},
            {"name": "Thực hành", "weight": 30},
            {"name": "Cuối kỳ", "weight": 50},
        ],
    }
    for code, items in grade_configs.items():
        grade_types_collection.insert_one({
            "subject_id": subject_ids_map[code],
            "items": items
        })
    print("✓ Grade type configs created for all subjects")

    # ── 7. Letter Grades ──
    letter_grades_collection.insert_one({
        "scale": [
            {"letter": "A", "min_score": 8.5, "max_score": 10.0, "gpa_4": 4.0},
            {"letter": "B+", "min_score": 8.0, "max_score": 8.49, "gpa_4": 3.5},
            {"letter": "B", "min_score": 7.0, "max_score": 7.99, "gpa_4": 3.0},
            {"letter": "C+", "min_score": 6.5, "max_score": 6.99, "gpa_4": 2.5},
            {"letter": "C", "min_score": 5.5, "max_score": 6.49, "gpa_4": 2.0},
            {"letter": "D+", "min_score": 5.0, "max_score": 5.49, "gpa_4": 1.5},
            {"letter": "D", "min_score": 4.0, "max_score": 4.99, "gpa_4": 1.0},
            {"letter": "F", "min_score": 0.0, "max_score": 3.99, "gpa_4": 0.0},
        ]
    })
    print("✓ Letter grade scale created")

    # ── 8. Teaching Assignments ──
    assignments = [
        (0, "CT101", sem1.inserted_id),   # GV01 - Lập trình C - HK1/2024
        (1, "WEB201", sem1.inserted_id),   # GV02 - Phát triển Web - HK1/2024
        (0, "DB301", sem2.inserted_id),    # GV01 - CSDL - HK2/2024
        (0, "NET202", sem2.inserted_id),   # GV01 - Mạng - HK2/2024
        (0, "WEB201", sem2.inserted_id),   # GV01 - Web - HK2/2024
        (3, "NET202", sem2.inserted_id),   # GV04 - Mạng - HK2/2024
        (4, "ML401", sem2.inserted_id),    # GV05 - ML - HK2/2024
        (6, "DB301", sem3.inserted_id),    # GV07 - CSDL - HK1/2025
    ]
    for ti, subj_code, sem_id in assignments:
        teaching_assignments_collection.insert_one({
            "teacher_id": teacher_ids[ti],
            "subject_id": subject_ids_map[subj_code],
            "semester_id": str(sem_id),
        })
    print(f"✓ {len(assignments)} teaching assignments created")

    # ── 9. Classes ──
    classes_data = [
        ("CT101-01", "CT101", sem1.inserted_id, 0, student_ids[:10]),
        ("WEB201-01", "WEB201", sem1.inserted_id, 1, student_ids[10:20]),
        ("DB301-01", "DB301", sem2.inserted_id, 0, student_ids[:8]),
        ("NET202-01", "NET202", sem2.inserted_id, 0, student_ids[5:15]),
        ("ML401-01", "ML401", sem2.inserted_id, 4, student_ids[15:25]),
    ]
    class_ids = []
    for name, subj_code, sem_id, ti, studs in classes_data:
        c = classes_collection.insert_one({
            "name": name,
            "subject_id": subject_ids_map[subj_code],
            "semester_id": str(sem_id),
            "teacher_id": teacher_ids[ti],
            "status": "open",
            "student_requests": [],
            "approved_students": studs,
            "room": "C.201",
            "schedule": "Thứ 2 (7:00 - 11:30)",
        })
        class_ids.append(str(c.inserted_id))
    print(f"✓ {len(classes_data)} classes created")

    # ── 10. Review Config ──
    review_config_collection.insert_one({
        "enabled": True,
        "deadline_days": 7,
        "description": "Phúc khảo được mở trong vòng 7 ngày sau khi điểm được duyệt."
    })
    print("✓ Review config created")

    # ── 11. Create indexes ──
    users_collection.create_index("email", unique=True)
    print("✓ Indexes created")

    print("\n════════════════════════════════════")
    print("  Seed data completed successfully!")
    print("════════════════════════════════════")
    print("  Login credentials:")
    print("  Admin:   admin@example.com / 123456")
    print("  Teacher: gv01@example.com / 123456")
    print("  Student: sv001@example.com / 123456")
    print("════════════════════════════════════")


if __name__ == "__main__":
    seed()
