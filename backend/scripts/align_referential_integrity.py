"""
Aligns foreign key references in allotments, timetableSlots, labBatches,
workloadRecords, and facultyPreferences to the exact real faculty and subject documents.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.firebase import firebase_manager

firebase_manager.initialize()
db = firebase_manager.get_db()

print("Updating allotments with exact faculty and subject IDs...")
allotments = [
    {
        "id": "alt_2026_odd_aids_3a_sub01",
        "academic_year": "2026-2027",
        "semester": 3,
        "department_id": "dept_aids",
        "subject_id": "sub_25macc311",
        "subject_code": "25MACC311",
        "subject_name": "Probability, Distributions and Statistics",
        "faculty_id": "fac_dept_math_dr_lolita_priya_castelino",
        "faculty_name": "Dr Lolita Priya Castelino",
        "section": "A",
        "weekly_hours_allocated": 4,
        "allocated_hours": 4,
        "is_practical": False,
        "total_students": 60,
        "batch_count": 1,
        "is_locked": False,
    },
    {
        "id": "alt_2026_odd_aids_3a_sub02",
        "academic_year": "2026-2027",
        "semester": 3,
        "department_id": "dept_aids",
        "subject_id": "sub_25cscc350",
        "subject_code": "25CSCC350",
        "subject_name": "Data Structure and Applications",
        "faculty_id": "fac_dept_aids_dr_deepika_b_v",
        "faculty_name": "Dr. Deepika B V",
        "section": "A",
        "weekly_hours_allocated": 4,
        "allocated_hours": 4,
        "is_practical": False,
        "total_students": 60,
        "batch_count": 1,
        "is_locked": False,
    },
    {
        "id": "alt_2026_odd_aids_3a_sub03",
        "academic_year": "2026-2027",
        "semester": 3,
        "department_id": "dept_aids",
        "subject_id": "sub_25csip320",
        "subject_code": "25CSIP320",
        "subject_name": "Object Oriented Programming with Java",
        "faculty_id": "fac_dept_aids_dr_tejaswini_h",
        "faculty_name": "Dr. Tejaswini H",
        "section": "A",
        "weekly_hours_allocated": 5,
        "allocated_hours": 5,
        "is_practical": True,
        "total_students": 60,
        "batch_count": 2,
        "batches": [
            {"batch_id": "B1", "student_count": 30, "faculty_id": "fac_dept_aids_dr_tejaswini_h", "lab_id": "lab_ai_data_analytic_lab"},
            {"batch_id": "B2", "student_count": 30, "faculty_id": "fac_dept_aids_mrs_sthuthi_bhat", "lab_id": "lab_core_computing_lab"},
        ],
        "practical_duration_slots": 2,
        "is_locked": False,
    },
    {
        "id": "alt_2026_odd_aids_3a_sub04",
        "academic_year": "2026-2027",
        "semester": 3,
        "department_id": "dept_aids",
        "subject_id": "sub_25cscl360",
        "subject_code": "25CSCL360",
        "subject_name": "Data Structure Laboratory",
        "faculty_id": "fac_dept_aids_dr_shrivathsa_t_v",
        "faculty_name": "Dr. Shrivathsa T V",
        "section": "A",
        "weekly_hours_allocated": 2,
        "allocated_hours": 2,
        "is_practical": True,
        "total_students": 60,
        "batch_count": 2,
        "batches": [
            {"batch_id": "B1", "student_count": 30, "faculty_id": "fac_dept_aids_dr_shrivathsa_t_v", "lab_id": "lab_ai_data_analytic_lab"},
            {"batch_id": "B2", "student_count": 30, "faculty_id": "fac_dept_aids_ms_shalaka", "lab_id": "lab_core_computing_lab"},
        ],
        "practical_duration_slots": 2,
        "is_locked": False,
    },
    {
        "id": "alt_2026_odd_phy_1a_sub01",
        "academic_year": "2026-2027",
        "semester": 1,
        "department_id": "dept_physics",
        "subject_id": "sub_25adae464",
        "subject_code": "25ADAE464",
        "subject_name": "Basic Applied Physics",
        "faculty_id": "fac_dept_physics_dr_ravindra_h_j",
        "faculty_name": "Dr. Ravindra H J",
        "section": "A",
        "weekly_hours_allocated": 4,
        "allocated_hours": 4,
        "is_practical": False,
        "total_students": 60,
        "batch_count": 1,
        "is_locked": True,
    },
    {
        "id": "alt_2026_odd_chem_1c_sub01",
        "academic_year": "2026-2027",
        "semester": 1,
        "department_id": "dept_chemistry",
        "subject_id": "sub_25adbs560",
        "subject_code": "25ADBS560",
        "subject_name": "Basic Applied Chemistry",
        "faculty_id": "fac_dept_chemistry_dr_subbulakshmi_n_karanth",
        "faculty_name": "Dr. Subbulakshmi N Karanth",
        "section": "C",
        "weekly_hours_allocated": 4,
        "allocated_hours": 4,
        "is_practical": False,
        "total_students": 60,
        "batch_count": 1,
        "is_locked": True,
    },
]

for alt in allotments:
    db.collection("allotments").document(alt["id"]).set(alt, merge=True)
print(f"[✓] {len(allotments)} allotments updated with verified IDs.")

print("Updating timetableSlots with exact faculty and subject IDs...")
slots = [
    {
        "id": "slot_aids3a_mon_p1",
        "timetable_id": "tt_2026_odd_aids_sem3_a",
        "day": "Monday",
        "period": 1,
        "start_time": "09:00",
        "end_time": "10:00",
        "subject_id": "sub_25cscc350",
        "subject_code": "25CSCC350",
        "subject_name": "Data Structure and Applications",
        "faculty_id": "fac_dept_aids_dr_deepika_b_v",
        "faculty_name": "Dr. Deepika B V",
        "room_id": "room_ab04",
        "room_name": "Lecture Hall AB04",
        "section": "A",
        "department_id": "dept_aids",
        "is_locked": False,
    },
    {
        "id": "slot_aids3a_mon_p2",
        "timetable_id": "tt_2026_odd_aids_sem3_a",
        "day": "Monday",
        "period": 2,
        "start_time": "10:00",
        "end_time": "11:00",
        "subject_id": "sub_25macc311",
        "subject_code": "25MACC311",
        "subject_name": "Probability, Distributions and Statistics",
        "faculty_id": "fac_dept_math_dr_lolita_priya_castelino",
        "faculty_name": "Dr Lolita Priya Castelino",
        "room_id": "room_ab04",
        "room_name": "Lecture Hall AB04",
        "section": "A",
        "department_id": "dept_aids",
        "is_locked": False,
    },
    {
        "id": "slot_aids3a_wed_p4",
        "timetable_id": "tt_2026_odd_aids_sem3_a",
        "day": "Wednesday",
        "period": 4,
        "start_time": "12:00",
        "end_time": "13:00",
        "subject_id": "sub_25adoe74x",
        "subject_code": "25ADOE74X",
        "subject_name": "Open Elective Course-1",
        "faculty_id": "fac_dept_mech_dr_sudarshan_rao_k",
        "faculty_name": "Dr. Sudarshan Rao K (Dean)",
        "room_id": "room_ab04",
        "room_name": "Lecture Hall AB04",
        "section": "A",
        "department_id": "dept_aids",
        "is_locked": True,
        "locked_by": "Dr. Sudarshan Rao K (Dean Academics)",
        "lock_reason": "Institutional Open Elective pool locked by Dean",
    },
    {
        "id": "slot_aids3a_thu_p1_p2_lab_b1",
        "timetable_id": "tt_2026_odd_aids_sem3_a",
        "day": "Thursday",
        "period": 1,
        "start_time": "09:00",
        "end_time": "11:00",
        "subject_id": "sub_25cscl360",
        "subject_code": "25CSCL360",
        "subject_name": "Data Structure Laboratory (Batch B1)",
        "faculty_id": "fac_dept_aids_dr_shrivathsa_t_v",
        "faculty_name": "Dr. Shrivathsa T V",
        "room_id": "lab_ai_data_analytic_lab",
        "room_name": "AI & Data Analytic Lab",
        "batch_id": "B1",
        "section": "A",
        "department_id": "dept_aids",
        "is_practical": True,
        "is_locked": False,
    },
    {
        "id": "slot_aids3a_thu_p1_p2_lab_b2",
        "timetable_id": "tt_2026_odd_aids_sem3_a",
        "day": "Thursday",
        "period": 1,
        "start_time": "09:00",
        "end_time": "11:00",
        "subject_id": "sub_25cscl360",
        "subject_code": "25CSCL360",
        "subject_name": "Data Structure Laboratory (Batch B2)",
        "faculty_id": "fac_dept_aids_ms_shalaka",
        "faculty_name": "Ms. Shalaka",
        "room_id": "lab_core_computing_lab",
        "room_name": "Core Computing Lab",
        "batch_id": "B2",
        "section": "A",
        "department_id": "dept_aids",
        "is_practical": True,
        "is_locked": False,
    },
]

for s in slots:
    db.collection("timetableSlots").document(s["id"]).set(s, merge=True)
print(f"[✓] {len(slots)} timetableSlots updated with verified IDs.")

print("Updating labBatches...")
batches = [
    {
        "id": "batch_2026_aids_3a_dsa_b1",
        "department_id": "dept_aids",
        "semester": 3,
        "section": "A",
        "batch_name": "B1",
        "student_count": 30,
        "subject_id": "sub_25cscl360",
        "lab_id": "lab_ai_data_analytic_lab",
        "faculty_id": "fac_dept_aids_dr_shrivathsa_t_v",
    },
    {
        "id": "batch_2026_aids_3a_dsa_b2",
        "department_id": "dept_aids",
        "semester": 3,
        "section": "A",
        "batch_name": "B2",
        "student_count": 30,
        "subject_id": "sub_25cscl360",
        "lab_id": "lab_core_computing_lab",
        "faculty_id": "fac_dept_aids_ms_shalaka",
    },
    {
        "id": "batch_2026_phy_1a_lab_b1",
        "department_id": "dept_physics",
        "semester": 1,
        "section": "A",
        "batch_name": "B1",
        "student_count": 30,
        "subject_id": "sub_25adae464",
        "lab_id": "lab_physics_lab",
        "faculty_id": "fac_dept_physics_dr_ravindra_h_j",
    },
    {
        "id": "batch_2026_phy_1a_lab_b2",
        "department_id": "dept_physics",
        "semester": 1,
        "section": "A",
        "batch_name": "B2",
        "student_count": 30,
        "subject_id": "sub_25adae464",
        "lab_id": "lab_physics_lab",
        "faculty_id": "fac_dept_physics_dr_ravindra_h_j",
    },
]

for b in batches:
    db.collection("labBatches").document(b["id"]).set(b, merge=True)
print(f"[✓] {len(batches)} labBatches updated with verified IDs.")

print("Updating workloadRecords...")
workloads = [
    {
        "id": "wl_2026_odd_fac_aids_deepika",
        "academic_year": "2026-2027",
        "semester_type": "ODD",
        "faculty_id": "fac_dept_aids_dr_deepika_b_v",
        "faculty_name": "Dr. Deepika B V",
        "department_id": "dept_aids",
        "total_theory_hours": 4.0,
        "total_lab_hours": 0.0,
        "total_hours": 4.0,
        "max_allowed_hours": 16,
        "is_overloaded": False,
        "allotment_ids": ["alt_2026_odd_aids_3a_sub02"],
    },
    {
        "id": "wl_2026_odd_fac_math_lolita",
        "academic_year": "2026-2027",
        "semester_type": "ODD",
        "faculty_id": "fac_dept_math_dr_lolita_priya_castelino",
        "faculty_name": "Dr Lolita Priya Castelino",
        "department_id": "dept_math",
        "total_theory_hours": 4.0,
        "total_lab_hours": 0.0,
        "total_hours": 4.0,
        "max_allowed_hours": 16,
        "is_overloaded": False,
        "allotment_ids": ["alt_2026_odd_aids_3a_sub01"],
    },
    {
        "id": "wl_2026_odd_fac_physics_ravindra",
        "academic_year": "2026-2027",
        "semester_type": "ODD",
        "faculty_id": "fac_dept_physics_dr_ravindra_h_j",
        "faculty_name": "Dr. Ravindra H J",
        "department_id": "dept_physics",
        "total_theory_hours": 4.0,
        "total_lab_hours": 0.0,
        "total_hours": 4.0,
        "max_allowed_hours": 16,
        "is_overloaded": False,
        "allotment_ids": ["alt_2026_odd_phy_1a_sub01"],
    },
]

for w in workloads:
    db.collection("workloadRecords").document(w["id"]).set(w, merge=True)
print(f"[✓] {len(workloads)} workloadRecords updated with verified IDs.")

print("Updating facultyPreferences...")
prefs = [
    {
        "id": "pref_2026-2027_3_fac_aids_deepika",
        "faculty_id": "fac_dept_aids_dr_deepika_b_v",
        "faculty_name": "Dr. Deepika B V",
        "department_id": "dept_aids",
        "academic_year": "2026-2027",
        "semester": 3,
        "preferences": [
            {"preference_rank": 1, "subject_id": "sub_25cscc350", "subject_code": "25CSCC350", "subject_name": "Data Structure and Applications", "notes": "Specialization core"},
            {"preference_rank": 2, "subject_id": "sub_25csip320", "subject_code": "25CSIP320", "subject_name": "Object Oriented Programming with Java", "notes": "Secondary teaching area"},
            {"preference_rank": 3, "subject_id": "sub_25adip420", "subject_code": "25ADIP420", "subject_name": "Design and Analysis of Algorithms", "notes": "Elective preference"},
        ],
        "status": "FINALIZED",
        "hod_comments": "Allocated Priority 1 based on teaching seniority.",
        "finalized_by": "Dr. Tejaswini H (HOD AIDS)",
    },
    {
        "id": "pref_2026-2027_3_fac_math_lolita",
        "faculty_id": "fac_dept_math_dr_lolita_priya_castelino",
        "faculty_name": "Dr Lolita Priya Castelino",
        "department_id": "dept_math",
        "academic_year": "2026-2027",
        "semester": 3,
        "preferences": [
            {"preference_rank": 1, "subject_id": "sub_25macc311", "subject_code": "25MACC311", "subject_name": "Probability, Distributions and Statistics", "notes": "Primary course"},
        ],
        "status": "FINALIZED",
        "hod_comments": "Assigned to AIDS 3rd Semester as per inter-departmental allocation.",
        "finalized_by": "Dr. Tejaswini H (HOD AIDS)",
    },
]

for p in prefs:
    db.collection("facultyPreferences").document(p["id"]).set(p, merge=True)
print(f"[✓] {len(prefs)} facultyPreferences updated with verified IDs.")

print("\nAll foreign key references successfully aligned!")
