import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.firebase import firebase_manager

firebase_manager.initialize()
db = firebase_manager.get_db()

db.collection("allotments").document("alt_2026_odd_phy_1a_sub02").set({
    "id": "alt_2026_odd_phy_1a_sub02",
    "academic_year": "2026-2027",
    "semester": 1,
    "department_id": "dept_physics",
    "subject_id": "sub_25adae464",
    "subject_code": "25ADAE464",
    "subject_name": "Basic Applied Physics Laboratory",
    "faculty_id": "fac_dept_physics_dr_ravindra_h_j",
    "faculty_name": "Dr. Ravindra H J",
    "section": "A",
    "weekly_hours_allocated": 2,
    "allocated_hours": 2,
    "is_practical": True,
    "total_students": 60,
    "batch_count": 2,
    "is_locked": True,
}, merge=True)
print("[✓] alt_2026_odd_phy_1a_sub02 updated.")
