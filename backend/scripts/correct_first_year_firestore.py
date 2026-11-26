"""
Database correction for First-Year Timetables & Sections.
Sets department_id to None for First-Year records in Firestore (mini-project-24d7b),
ensuring that First-Year mixed batches have no artificial engineering department.
"""

import sys
import os

sys.path.insert(0, os.path.abspath("backend"))
from app.core.firebase import firebase_manager

firebase_manager.initialize()
db = firebase_manager.get_db()
print(f"Connected to Firestore project: {db.project}")

# 1. Update First-Year Master Timetable: tt_2026_odd_phy_sem1_a
tt_ref = db.collection("timetables").document("tt_2026_odd_phy_sem1_a")
tt_doc = tt_ref.get()
if tt_doc.exists:
    current_data = tt_doc.to_dict()
    print(f"Current tt_2026_odd_phy_sem1_a department_id: {current_data.get('department_id')}")
    tt_ref.update({"department_id": None})
    print("Updated tt_2026_odd_phy_sem1_a: department_id set to None.")
else:
    print("tt_2026_odd_phy_sem1_a not found.")

# 2. Update First-Year Sections
fy_sections = [
    "sec_2026_phy_sem1_a",
    "sec_2026_phy_sem1_b",
    "sec_2026_chem_sem1_c",
    "sec_2026_chem_sem1_d",
]

for sec_id in fy_sections:
    sec_ref = db.collection("sections").document(sec_id)
    sec_doc = sec_ref.get()
    if sec_doc.exists:
        sdata = sec_doc.to_dict()
        print(f"Updating {sec_id}: previous department_id was '{sdata.get('department_id')}'")
        sec_ref.update({"department_id": None, "student_year": "First Year"})
        print(f"  [✓] {sec_id} updated: department_id is now None, student_year='First Year'.")

# 3. Verify updates
verified_tt = tt_ref.get().to_dict()
print(f"\nVerification: tt_2026_odd_phy_sem1_a department_id = {verified_tt.get('department_id')}")
for sec_id in fy_sections:
    vsec = db.collection("sections").document(sec_id).get().to_dict()
    print(f"Verification: {sec_id} department_id = {vsec.get('department_id')}, student_year = {vsec.get('student_year')}")

print("\nDatabase First-Year correction complete!")
