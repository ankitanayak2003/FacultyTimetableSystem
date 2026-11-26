"""
Comprehensive Read-Only Firestore Verification Script.
Checks:
1. Exact document counts across all 17 collections.
2. Referential integrity across collections.
3. ID uniqueness and duplicate detection.
4. Identification of inferred/provisional records.
"""

import sys
import os
import json
from typing import Dict, List, Any, Set

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.firebase import firebase_manager


def run_verification():
    print("=" * 80)
    print("AQS LIVE FIRESTORE INTEGRITY VERIFICATION (READ-ONLY)")
    print("=" * 80)

    if not firebase_manager.initialize():
        print("[-] Error: Could not connect to Firebase.")
        return

    db = firebase_manager.get_db()
    print(f"[✓] Connected to Project: {db.project}")

    collections = [
        "users",
        "departments",
        "faculty",
        "subjects",
        "labs",
        "rooms",
        "fixedClassrooms",
        "academicYears",
        "sections",
        "allotments",
        "facultyPreferences",
        "workloadRecords",
        "timetables",
        "timetableSlots",
        "institutionalAssignments",
        "labBatches",
        "generationRuns",
    ]

    docs_by_col: Dict[str, Dict[str, Dict[str, Any]]] = {}
    counts: Dict[str, int] = {}
    total_docs = 0

    print("\n--- 1. DOCUMENT COUNTS ACROSS ALL 17 COLLECTIONS ---")
    for col_name in collections:
        docs_by_col[col_name] = {}
        for doc in db.collection(col_name).stream():
            d = doc.to_dict()
            d["_id"] = doc.id
            docs_by_col[col_name][doc.id] = d
        count = len(docs_by_col[col_name])
        counts[col_name] = count
        total_docs += count
        print(f"  {col_name:<26}: {count:3d} docs")

    print(f"\n  TOTAL LIVE DOCUMENTS       : {total_docs:3d} docs")

    # 2. Check for duplicate IDs or duplicate codes/names
    print("\n--- 2. ID UNIQUENESS & DUPLICATE CHECKS ---")
    dept_ids = set(docs_by_col["departments"].keys())
    fac_ids = set(docs_by_col["faculty"].keys())
    sub_ids = set(docs_by_col["subjects"].keys())
    lab_ids = set(docs_by_col["labs"].keys())
    room_ids = set(docs_by_col["rooms"].keys())

    # Check duplicate subject codes
    sub_codes: Dict[str, List[str]] = {}
    for s_id, s in docs_by_col["subjects"].items():
        code = s.get("code")
        if code:
            sub_codes.setdefault(code, []).append(s_id)
    dup_codes = {c: ids for c, ids in sub_codes.items() if len(ids) > 1}
    print(f"  Subject codes unique: {'YES (0 duplicates)' if not dup_codes else f'NO ({len(dup_codes)} duplicates)'}")
    if dup_codes:
        for c, ids in dup_codes.items():
            print(f"    - Code {c}: {ids}")

    # Check duplicate faculty emails
    fac_emails: Dict[str, List[str]] = {}
    for f_id, f in docs_by_col["faculty"].items():
        email = f.get("email")
        if email:
            fac_emails.setdefault(email, []).append(f_id)
    dup_emails = {e: ids for e, ids in fac_emails.items() if len(ids) > 1 and not e.endswith("@placeholder.sode-edu.in")}
    print(f"  Faculty official emails unique: {'YES (0 duplicates)' if not dup_emails else f'NO ({len(dup_emails)} duplicates)'}")

    # 3. Referential Integrity Check
    print("\n--- 3. REFERENTIAL INTEGRITY CHECKS ---")
    ref_errors = []

    # Faculty -> Department
    for f_id, f in docs_by_col["faculty"].items():
        d_id = f.get("department_id")
        if d_id not in dept_ids and d_id != "dept_general":
            ref_errors.append(f"Faculty '{f_id}' references unknown department '{d_id}'")

    # Subject -> Department
    for s_id, s in docs_by_col["subjects"].items():
        d_id = s.get("department_id")
        if d_id not in dept_ids and d_id != "dept_general":
            ref_errors.append(f"Subject '{s_id}' references unknown department '{d_id}'")

    # Lab -> Department
    for l_id, l in docs_by_col["labs"].items():
        d_id = l.get("department_id")
        if d_id not in dept_ids and d_id != "dept_general":
            ref_errors.append(f"Lab '{l_id}' references unknown department '{d_id}'")

    # Sections -> Department
    for sec_id, sec in docs_by_col["sections"].items():
        d_id = sec.get("department_id")
        if d_id not in dept_ids:
            ref_errors.append(f"Section '{sec_id}' references unknown department '{d_id}'")

    # FixedClassrooms -> Department
    for fc_id, fc in docs_by_col["fixedClassrooms"].items():
        d_id = fc.get("department_id")
        if d_id not in dept_ids:
            ref_errors.append(f"FixedClassroom '{fc_id}' references unknown department '{d_id}'")

    # Allotments -> Faculty & Subject & Department
    for alt_id, alt in docs_by_col["allotments"].items():
        d_id = alt.get("department_id")
        f_id = alt.get("faculty_id")
        s_id = alt.get("subject_id")
        if d_id not in dept_ids:
            ref_errors.append(f"Allotment '{alt_id}' references unknown department '{d_id}'")
        if f_id not in fac_ids:
            ref_errors.append(f"Allotment '{alt_id}' references unknown faculty '{f_id}'")
        if s_id not in sub_ids:
            ref_errors.append(f"Allotment '{alt_id}' references unknown subject '{s_id}'")

    # TimetableSlots -> Timetable, Subject, Faculty
    tt_ids = set(docs_by_col["timetables"].keys())
    for slot_id, slot in docs_by_col["timetableSlots"].items():
        t_id = slot.get("timetable_id")
        f_id = slot.get("faculty_id")
        s_id = slot.get("subject_id")
        if t_id not in tt_ids:
            ref_errors.append(f"TimetableSlot '{slot_id}' references unknown timetable '{t_id}'")
        if f_id not in fac_ids and not f_id.startswith("fac_dept_admin"):
            ref_errors.append(f"TimetableSlot '{slot_id}' references unknown faculty '{f_id}'")
        if s_id not in sub_ids and s_id != "sub_open_elective_pool":
            ref_errors.append(f"TimetableSlot '{slot_id}' references unknown subject '{s_id}'")

    if not ref_errors:
        print("  [✓] All foreign keys and cross-collection references are 100% VALID!")
    else:
        print(f"  [-] Found {len(ref_errors)} reference issues:")
        for err in ref_errors:
            print(f"      - {err}")

    # 4. Inferred and Provisional Values Identification
    print("\n--- 4. INFERRED & PROVISIONAL ACADEMIC VALUES AUDIT ---")
    inferred_subjects = []
    for s_id, s in docs_by_col["subjects"].items():
        if s.get("verification_status") == "INFERRED" or "inferred" in str(s.get("verification_notes", "")).lower():
            inferred_subjects.append({
                "id": s_id,
                "code": s.get("code"),
                "name": s.get("course_name"),
                "notes": s.get("verification_notes"),
            })

    inferred_labs = []
    for l_id, l in docs_by_col["labs"].items():
        if l.get("verification_status") == "INFERRED" or l.get("availability_status") == "UNVERIFIED":
            inferred_labs.append({
                "id": l_id,
                "name": l.get("name"),
                "capacity": l.get("capacity"),
                "availability": l.get("availability_status"),
                "notes": l.get("verification_notes"),
            })

    provisional_classrooms = []
    for fc_id, fc in docs_by_col["fixedClassrooms"].items():
        if fc.get("is_provisional"):
            provisional_classrooms.append({
                "id": fc_id,
                "dept": fc.get("department_id"),
                "section": f"Sem {fc.get('semester')} Sec {fc.get('section')}",
                "classroom_id": fc.get("classroom_id"),
                "name": fc.get("classroom_name"),
            })

    print(f"  Subjects with inferred attributes : {len(inferred_subjects)} (L:T:P inferred via VTU Scheme formulas)")
    print(f"  Labs with inferred capacity/status: {len(inferred_labs)} (Standard 30/60 VTU norms; status 'UNVERIFIED' pending schedule)")
    print(f"  Provisional Fixed Classrooms      : {len(provisional_classrooms)} (All marked is_provisional=True)")

    # Save verification JSON
    report = {
        "project_id": db.project,
        "counts": counts,
        "total_documents": total_docs,
        "duplicate_check": {
            "duplicate_subject_codes": dup_codes,
            "duplicate_faculty_emails": dup_emails,
        },
        "referential_integrity": {
            "valid": len(ref_errors) == 0,
            "error_count": len(ref_errors),
            "errors": ref_errors,
        },
        "inferred_and_provisional": {
            "inferred_subjects_count": len(inferred_subjects),
            "inferred_labs_count": len(inferred_labs),
            "provisional_classrooms_count": len(provisional_classrooms),
            "provisional_classrooms": provisional_classrooms,
        },
    }

    out_path = os.path.join(backend_dir, "backups", "live_verification_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n[✓] Detailed integrity verification written to: {out_path}")


if __name__ == "__main__":
    run_verification()
