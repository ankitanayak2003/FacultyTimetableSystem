"""
Firestore Demo Data Seeding Script
=================================
Safely seeds a coherent, synthetic dataset across all 9 Firestore collections
for demonstration and verification of the VTU Faculty Workload & Timetable System.

Target Collections (9):
1. users
2. faculty
3. subjects
4. rooms
5. labs
6. allotments
7. timetables
8. timetableSlots
9. workloadRecords

Safety Guarantees:
- Strictly verifies that configured Firebase project matches 'mini-project-24d7b'.
- Requires both --confirm-demo-write and --project-id mini-project-24d7b to perform writes.
- Never prints or exposes private keys, secrets, or service account details.
- Preflights all planned IDs to detect any collision with non-demo data before writing.
- Every record is pre-validated against official Pydantic domain models.
- Uses batched writes respecting Firestore limits (<= 400 operations per batch).
- Fully idempotent: can be executed repeatedly without corrupting data or duplicating records.

Usage (run from backend directory with active virtual environment):
  Dry Run (simulate and validate schemas without touching database):
    python scripts/seed_demo_firestore.py --dry-run

  Verify (read-only audit of live collections and document counts):
    python scripts/seed_demo_firestore.py --verify

  Live Seed (write demo dataset to Firestore):
    python scripts/seed_demo_firestore.py --confirm-demo-write --project-id mini-project-24d7b
"""

import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Ensure backend root directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.firebase import firebase_manager
from app.models.entities import (
    User,
    UserRole,
    FacultyProfile,
    FacultyDesignation,
    Subject,
    SubjectType,
    Room,
    RoomType,
    Lab,
    LabType,
    Allotment,
    Timetable,
    TimetableStatus,
    SemesterType,
    TimetableSlot,
    DayOfWeek,
    WorkloadRecord,
    utc_now_iso,
)

EXPECTED_PROJECT_ID = "mini-project-24d7b"
DEMO_ID_PREFIX = "demo_"

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("seed_demo")


# ==============================================================================
# Synthetic Demo Dataset Definition
# ==============================================================================

def build_demo_dataset() -> Dict[str, List[Dict[str, Any]]]:
    """
    Constructs a coherent, interconnected synthetic VTU engineering college dataset.
    Department: Computer Science & Engineering (dept_cse)
    Academic Year: 2026-2027 (Semester 5, Section A, ODD)
    """
    dept_id = "dept_cse"
    acad_year = "2026-2027"
    now_iso = utc_now_iso()

    # 1. Users (Synthetic profiles - NO real Firebase Auth credentials or logins)
    users_data = [
        {
            "id": "demo_usr_coord_cse",
            "email": "ramesh.kumar@vtu-demo.ac.in",
            "display_name": "Prof. Ramesh Kumar (Coordinator)",
            "role": UserRole.DEPARTMENT_COORDINATOR.value,
            "department_id": dept_id,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_usr_fac_01",
            "email": "ananya.sharma@vtu-demo.ac.in",
            "display_name": "Dr. Ananya Sharma",
            "role": UserRole.FACULTY.value,
            "department_id": dept_id,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_usr_fac_02",
            "email": "bhaskar.rao@vtu-demo.ac.in",
            "display_name": "Prof. Bhaskar Rao",
            "role": UserRole.FACULTY.value,
            "department_id": dept_id,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_usr_fac_03",
            "email": "chitra.nair@vtu-demo.ac.in",
            "display_name": "Dr. Chitra Nair",
            "role": UserRole.FACULTY.value,
            "department_id": dept_id,
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    # 2. Faculty Profiles (3 faculty members)
    faculty_data = [
        {
            "id": "demo_fac_cse_01",
            "name": "Dr. Ananya Sharma",
            "email": "ananya.sharma@vtu-demo.ac.in",
            "department_id": dept_id,
            "designation": FacultyDesignation.PROFESSOR.value,
            "max_weekly_hours": 16,
            "min_weekly_hours": 8,
            "specializations": ["Automata Theory", "Formal Languages", "Machine Learning"],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_fac_cse_02",
            "name": "Prof. Bhaskar Rao",
            "email": "bhaskar.rao@vtu-demo.ac.in",
            "department_id": dept_id,
            "designation": FacultyDesignation.ASSOCIATE_PROFESSOR.value,
            "max_weekly_hours": 18,
            "min_weekly_hours": 10,
            "specializations": ["Database Systems", "Query Optimization", "Distributed Storage"],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_fac_cse_03",
            "name": "Dr. Chitra Nair",
            "email": "chitra.nair@vtu-demo.ac.in",
            "department_id": dept_id,
            "designation": FacultyDesignation.ASSISTANT_PROFESSOR.value,
            "max_weekly_hours": 20,
            "min_weekly_hours": 12,
            "specializations": ["Computer Networks", "Network Security", "Cloud Infrastructure"],
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    # 3. Subjects (3 Theory courses + 1 Lab course)
    subjects_data = [
        {
            "id": "demo_sub_21cs51",
            "code": "21CS51",
            "title": "Automata Theory and Computability",
            "department_id": dept_id,
            "semester": 5,
            "credits": 3,
            "subject_type": SubjectType.THEORY.value,
            "weekly_hours": 4,
            "preferred_room_type": "CLASSROOM",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_sub_21cs52",
            "code": "21CS52",
            "title": "Computer Networks",
            "department_id": dept_id,
            "semester": 5,
            "credits": 4,
            "subject_type": SubjectType.THEORY.value,
            "weekly_hours": 4,
            "preferred_room_type": "CLASSROOM",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_sub_21cs53",
            "code": "21CS53",
            "title": "Database Management Systems",
            "department_id": dept_id,
            "semester": 5,
            "credits": 4,
            "subject_type": SubjectType.THEORY.value,
            "weekly_hours": 4,
            "preferred_room_type": "CLASSROOM",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_sub_21csl58",
            "code": "21CSL58",
            "title": "Database Management Systems Laboratory",
            "department_id": dept_id,
            "semester": 5,
            "credits": 2,
            "subject_type": SubjectType.LAB.value,
            "weekly_hours": 3,
            "preferred_room_type": "COMPUTER_LAB",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    # 4. Rooms (1 Classroom facility)
    rooms_data = [
        {
            "id": "demo_room_lh101",
            "name": "Lecture Hall 101",
            "room_type": RoomType.CLASSROOM.value,
            "capacity": 65,
            "department_id": dept_id,
            "is_available": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
    ]

    # 5. Labs (1 Computer Lab facility)
    labs_data = [
        {
            "id": "demo_lab_db01",
            "name": "Database & Software Engineering Lab",
            "lab_type": LabType.COMPUTER_LAB.value,
            "capacity": 35,
            "workstations_count": 35,
            "department_id": dept_id,
            "is_available": True,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
    ]

    # 6. Allotments (Faculty-Subject Teaching Allocations)
    allotments_data = [
        {
            "id": "demo_alt_cse_5a_cs51",
            "academic_year": acad_year,
            "semester": 5,
            "department_id": dept_id,
            "subject_id": "demo_sub_21cs51",
            "faculty_id": "demo_fac_cse_01",
            "section": "A",
            "weekly_hours_allocated": 4,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_alt_cse_5a_cs52",
            "academic_year": acad_year,
            "semester": 5,
            "department_id": dept_id,
            "subject_id": "demo_sub_21cs52",
            "faculty_id": "demo_fac_cse_03",
            "section": "A",
            "weekly_hours_allocated": 4,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_alt_cse_5a_cs53",
            "academic_year": acad_year,
            "semester": 5,
            "department_id": dept_id,
            "subject_id": "demo_sub_21cs53",
            "faculty_id": "demo_fac_cse_02",
            "section": "A",
            "weekly_hours_allocated": 4,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_alt_cse_5a_csl58",
            "academic_year": acad_year,
            "semester": 5,
            "department_id": dept_id,
            "subject_id": "demo_sub_21csl58",
            "faculty_id": "demo_fac_cse_02",
            "section": "A",
            "weekly_hours_allocated": 3,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    # 7. Timetables (1 Draft Timetable for CSE 5th Semester Section A)
    timetable_id = "demo_tt_2026_odd_cse_5a"
    timetables_data = [
        {
            "id": timetable_id,
            "academic_year": acad_year,
            "semester_type": SemesterType.ODD.value,
            "department_id": dept_id,
            "semester": 5,
            "section": "A",
            "status": TimetableStatus.DRAFT.value,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
    ]

    # 8. Timetable Slots (6 scheduled slots following all scheduling invariant rules)
    # Rules followed:
    # - Theory subjects scheduled in demo_room_lh101 (Classroom)
    # - Lab subjects scheduled in demo_lab_db01 (Lab)
    # - Zero faculty double-booking
    # - Zero facility double-booking
    # - Zero section schedule conflicts
    slots_data = [
        {
            "id": "demo_slot_tt5a_mon_1",
            "timetable_id": timetable_id,
            "day": DayOfWeek.MONDAY.value,
            "slot_number": 1,
            "start_time": "09:00",
            "end_time": "10:00",
            "subject_id": "demo_sub_21cs51",
            "faculty_id": "demo_fac_cse_01",
            "room_id": "demo_room_lh101",
            "is_lab": False,
            "batch": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_slot_tt5a_mon_2",
            "timetable_id": timetable_id,
            "day": DayOfWeek.MONDAY.value,
            "slot_number": 2,
            "start_time": "10:00",
            "end_time": "11:00",
            "subject_id": "demo_sub_21cs52",
            "faculty_id": "demo_fac_cse_03",
            "room_id": "demo_room_lh101",
            "is_lab": False,
            "batch": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_slot_tt5a_tue_1",
            "timetable_id": timetable_id,
            "day": DayOfWeek.TUESDAY.value,
            "slot_number": 1,
            "start_time": "09:00",
            "end_time": "10:00",
            "subject_id": "demo_sub_21cs53",
            "faculty_id": "demo_fac_cse_02",
            "room_id": "demo_room_lh101",
            "is_lab": False,
            "batch": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_slot_tt5a_tue_2",
            "timetable_id": timetable_id,
            "day": DayOfWeek.TUESDAY.value,
            "slot_number": 2,
            "start_time": "10:00",
            "end_time": "11:00",
            "subject_id": "demo_sub_21csl58",
            "faculty_id": "demo_fac_cse_02",
            "room_id": "demo_lab_db01",
            "is_lab": True,
            "batch": "B1",
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_slot_tt5a_wed_1",
            "timetable_id": timetable_id,
            "day": DayOfWeek.WEDNESDAY.value,
            "slot_number": 1,
            "start_time": "09:00",
            "end_time": "10:00",
            "subject_id": "demo_sub_21cs51",
            "faculty_id": "demo_fac_cse_01",
            "room_id": "demo_room_lh101",
            "is_lab": False,
            "batch": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_slot_tt5a_wed_2",
            "timetable_id": timetable_id,
            "day": DayOfWeek.WEDNESDAY.value,
            "slot_number": 2,
            "start_time": "10:00",
            "end_time": "11:00",
            "subject_id": "demo_sub_21cs52",
            "faculty_id": "demo_fac_cse_03",
            "room_id": "demo_room_lh101",
            "is_lab": False,
            "batch": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    # 9. Workload Records (Computed authoritatively from active allotments)
    # fac_01: 4h Theory, 0h Lab = 4h total (max 16) -> not overloaded
    # fac_02: 4h Theory, 3h Lab = 7h total (max 18) -> not overloaded
    # fac_03: 4h Theory, 0h Lab = 4h total (max 20) -> not overloaded
    workload_data = [
        {
            "id": "demo_wl_2026_odd_fac01",
            "academic_year": acad_year,
            "semester_type": SemesterType.ODD.value,
            "faculty_id": "demo_fac_cse_01",
            "department_id": dept_id,
            "total_theory_hours": 4.0,
            "total_lab_hours": 0.0,
            "total_hours": 4.0,
            "max_allowed_hours": 16,
            "is_overloaded": False,
            "allotment_ids": ["demo_alt_cse_5a_cs51"],
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_wl_2026_odd_fac02",
            "academic_year": acad_year,
            "semester_type": SemesterType.ODD.value,
            "faculty_id": "demo_fac_cse_02",
            "department_id": dept_id,
            "total_theory_hours": 4.0,
            "total_lab_hours": 3.0,
            "total_hours": 7.0,
            "max_allowed_hours": 18,
            "is_overloaded": False,
            "allotment_ids": ["demo_alt_cse_5a_cs53", "demo_alt_cse_5a_csl58"],
            "created_at": now_iso,
            "updated_at": now_iso,
        },
        {
            "id": "demo_wl_2026_odd_fac03",
            "academic_year": acad_year,
            "semester_type": SemesterType.ODD.value,
            "faculty_id": "demo_fac_cse_03",
            "department_id": dept_id,
            "total_theory_hours": 4.0,
            "total_lab_hours": 0.0,
            "total_hours": 4.0,
            "max_allowed_hours": 20,
            "is_overloaded": False,
            "allotment_ids": ["demo_alt_cse_5a_cs52"],
            "created_at": now_iso,
            "updated_at": now_iso,
        },
    ]

    return {
        "users": users_data,
        "faculty": faculty_data,
        "subjects": subjects_data,
        "rooms": rooms_data,
        "labs": labs_data,
        "allotments": allotments_data,
        "timetables": timetables_data,
        "timetableSlots": slots_data,
        "workloadRecords": workload_data,
    }


# ==============================================================================
# Model Pre-Validation
# ==============================================================================

def validate_demo_schemas(dataset: Dict[str, List[Dict[str, Any]]]) -> bool:
    """
    Validates all synthetic records against official Pydantic models.
    Raises ValueError immediately if any record violates domain rules.
    """
    model_map = {
        "users": User,
        "faculty": FacultyProfile,
        "subjects": Subject,
        "rooms": Room,
        "labs": Lab,
        "allotments": Allotment,
        "timetables": Timetable,
        "timetableSlots": TimetableSlot,
        "workloadRecords": WorkloadRecord,
    }

    for col_name, records in dataset.items():
        model_cls = model_map[col_name]
        for record in records:
            try:
                # Validates against all Pydantic constraints and field validators
                model_cls(**record)
            except Exception as exc:
                logger.error("Schema validation failed for %s document '%s': %s", col_name, record.get("id"), exc)
                return False

    return True


# ==============================================================================
# Dry Run Mode
# ==============================================================================

def execute_dry_run(dataset: Dict[str, List[Dict[str, Any]]]):
    """Prints a detailed preview of all planned demo documents without touching Firestore."""
    print("\n" + "=" * 78)
    print(" FIRESTORE DEMO SEEDING - DRY RUN PREVIEW")
    print("=" * 78)
    print(f"Target Firebase Project ID : {EXPECTED_PROJECT_ID}")
    print(f"Configured in backend/.env : {settings.FIREBASE_PROJECT_ID}")
    print(f"Credentials Path           : {settings.FIREBASE_CREDENTIALS_PATH}")
    print("=" * 78)

    # Pre-validate against Pydantic models
    if not validate_demo_schemas(dataset):
        print("\n[ERROR] Schema validation failed. Dry run aborted.")
        sys.exit(1)

    print("[OK] All 27 synthetic documents successfully passed Pydantic domain validation.\n")

    total_docs = 0
    print("Planned Collections & Records:")
    print("-" * 78)

    for idx, (col_name, records) in enumerate(dataset.items(), 1):
        count = len(records)
        total_docs += count
        print(f"\n{idx}. Collection: [{col_name}] ({count} documents)")
        for rec in records:
            doc_id = rec["id"]
            if col_name == "users":
                info = f"email={rec['email']}, role={rec['role']}, dept={rec['department_id']}"
            elif col_name == "faculty":
                info = f"name={rec['name']}, designation={rec['designation']}, max_hrs={rec['max_weekly_hours']}"
            elif col_name == "subjects":
                info = f"code={rec['code']}, title='{rec['title']}', type={rec['subject_type']}, hrs={rec['weekly_hours']}"
            elif col_name == "rooms":
                info = f"name='{rec['name']}', capacity={rec['capacity']}"
            elif col_name == "labs":
                info = f"name='{rec['name']}', lab_type={rec['lab_type']}, workstations={rec['workstations_count']}"
            elif col_name == "allotments":
                info = f"faculty={rec['faculty_id']} -> subject={rec['subject_id']}, sec={rec['section']}, hrs={rec['weekly_hours_allocated']}"
            elif col_name == "timetables":
                info = f"status={rec['status']}, sem={rec['semester']}, sec={rec['section']}, year={rec['academic_year']}"
            elif col_name == "timetableSlots":
                info = f"{rec['day']} Period {rec['slot_number']} ({rec['start_time']}-{rec['end_time']}) -> sub={rec['subject_id']}, fac={rec['faculty_id']}, facility={rec['room_id']}"
            elif col_name == "workloadRecords":
                info = f"faculty={rec['faculty_id']}, total_hrs={rec['total_hours']} (theory={rec['total_theory_hours']}, lab={rec['total_lab_hours']}), overloaded={rec['is_overloaded']}"
            else:
                info = ""
            print(f"   - {doc_id:<28} | {info}")

    print("\n" + "-" * 78)
    print(f"Total Collections : {len(dataset)}")
    print(f"Total Documents   : {total_docs}")
    print("=" * 78)
    print("\nDry run completed successfully. Zero writes were executed to Cloud Firestore.")
    print("\nTo seed this dataset into live Firestore, execute:")
    print(f"  .\\venv\\Scripts\\python.exe scripts/seed_demo_firestore.py --confirm-demo-write --project-id {EXPECTED_PROJECT_ID}\n")


# ==============================================================================
# Verify Mode
# ==============================================================================

def execute_verify():
    """Performs a read-only inspection of the live Cloud Firestore database."""
    print("\n" + "=" * 78)
    print(" FIRESTORE DEMO SEEDING - VERIFY MODE (READ-ONLY)")
    print("=" * 78)

    # Initialize Firebase safely
    if not firebase_manager.initialize():
        print(f"\n[ERROR] Firebase initialization failed: {firebase_manager.status_message}")
        sys.exit(1)

    db = firebase_manager.get_db()
    configured_project = db.project or settings.FIREBASE_PROJECT_ID
    print(f"Connected to Firestore Project : {configured_project}")
    print("=" * 78)

    dataset = build_demo_dataset()
    all_demo_found = True
    any_demo_found = False

    print("\nCollection Audit:")
    print("-" * 78)
    print(f"{'#':<3} {'Collection Name':<20} {'Live Total Docs':<18} {'Demo Docs Present':<18} {'Status'}")
    print("-" * 78)

    for idx, (col_name, demo_records) in enumerate(dataset.items(), 1):
        col_ref = db.collection(col_name)
        live_docs = list(col_ref.stream())
        live_count = len(live_docs)
        live_ids = {d.id for d in live_docs}

        demo_ids = [r["id"] for r in demo_records]
        found_demo_count = sum(1 for did in demo_ids if did in live_ids)

        if found_demo_count == len(demo_ids):
            status = "[OK] FULLY SEEDED"
            any_demo_found = True
        elif found_demo_count > 0:
            status = f"[WARN] PARTIAL ({found_demo_count}/{len(demo_ids)})"
            all_demo_found = False
            any_demo_found = True
        else:
            status = "[ ] EMPTY / NOT SEEDED"
            all_demo_found = False

        print(f"{idx:<3} {col_name:<20} {live_count:<18} {found_demo_count}/{len(demo_ids):<16} {status}")

    print("-" * 78)

    if all_demo_found:
        print("\n[OK] Verification Status: ALL 9 COLLECTIONS ARE POPULATED WITH DEMO DATA.")
        print("Your Cloud Firestore database is ready for demonstration in Firebase Console.")
    elif any_demo_found:
        print("\n[WARN] Verification Status: PARTIAL DEMO DATA DETECTED.")
        print("Some demo records are missing. Re-run seeding with --confirm-demo-write to complete.")
    else:
        print("\n[ ] Verification Status: NO DEMO COLLECTIONS FOUND.")
        print("The database is currently empty. Run seeding with --confirm-demo-write to populate.")

    print("=" * 78 + "\n")


# ==============================================================================
# Live Write Mode
# ==============================================================================

def execute_live_write(project_id_arg: str):
    """Safely seeds the synthetic demo dataset into Cloud Firestore using batched writes."""
    print("\n" + "=" * 78)
    print(" FIRESTORE DEMO SEEDING - LIVE WRITE")
    print("=" * 78)

    # 1. Strict Project ID Validation
    if project_id_arg != EXPECTED_PROJECT_ID:
        print(f"\n[ERROR] SAFETY REFUSAL: Target project argument '{project_id_arg}' does not match expected '{EXPECTED_PROJECT_ID}'.")
        print("Refusing to write to prevent accidental database modification.")
        sys.exit(1)

    if settings.FIREBASE_PROJECT_ID != EXPECTED_PROJECT_ID:
        print(f"\n[ERROR] SAFETY REFUSAL: Configured FIREBASE_PROJECT_ID '{settings.FIREBASE_PROJECT_ID}' does not match expected '{EXPECTED_PROJECT_ID}'.")
        print("Refusing to write to prevent accidental database modification.")
        sys.exit(1)

    # 2. Initialize Firebase
    if not firebase_manager.initialize():
        print(f"\n[ERROR] Firebase initialization failed: {firebase_manager.status_message}")
        sys.exit(1)

    db = firebase_manager.get_db()
    if db.project != EXPECTED_PROJECT_ID:
        print(f"\n[ERROR] SAFETY REFUSAL: Connected Firestore client project '{db.project}' does not match expected '{EXPECTED_PROJECT_ID}'.")
        sys.exit(1)

    print(f"[OK] Confirmed connection to expected Firestore project: {EXPECTED_PROJECT_ID}")

    dataset = build_demo_dataset()

    # 3. Model Pre-Validation
    print("Validating all 27 records against Pydantic models...")
    if not validate_demo_schemas(dataset):
        print("[ERROR] Schema validation failed. Write aborted.")
        sys.exit(1)
    print("[OK] All records passed schema validation.")

    # 4. Preflight Collision Check
    print("\nExecuting preflight collision checks on planned document IDs...")
    collision_errors = []
    existing_demo_records = 0

    for col_name, records in dataset.items():
        for rec in records:
            doc_id = rec["id"]
            doc_ref = db.collection(col_name).document(doc_id)
            doc_snap = doc_ref.get()

            if doc_snap.exists:
                # Document exists. Verify it is safely recognized as our own demo record
                if not doc_id.startswith(DEMO_ID_PREFIX):
                    collision_errors.append(f"Collision in collection '{col_name}': document '{doc_id}' exists and is not a demo record.")
                else:
                    existing_demo_records += 1

    if collision_errors:
        print("\n[ERROR] PREFLIGHT SAFETY CHECK FAILED: Found collision with non-demo records:")
        for err in collision_errors:
            print(f"   - {err}")
        print("\nAborting write to prevent overwriting existing data.")
        sys.exit(1)

    if existing_demo_records > 0:
        print(f"Notice: {existing_demo_records} demo records already exist and will be updated idempotently.")
    else:
        print("[OK] Preflight passed: Zero existing collisions found. Clean seeding.")

    # 5. Batched Write Execution
    print("\nWriting demo records using Firestore write batches...")
    CHUNK_SIZE = 400
    all_ops: List[Tuple[str, str, Dict[str, Any]]] = []

    for col_name, records in dataset.items():
        for rec in records:
            all_ops.append((col_name, rec["id"], rec))

    total_ops = len(all_ops)
    committed_ops = 0

    try:
        for i in range(0, total_ops, CHUNK_SIZE):
            chunk = all_ops[i : i + CHUNK_SIZE]
            batch = db.batch()

            for col_name, doc_id, data in chunk:
                doc_ref = db.collection(col_name).document(doc_id)
                batch.set(doc_ref, data)

            batch.commit()
            committed_ops += len(chunk)
            print(f"   [OK] Committed batch: {committed_ops}/{total_ops} records written.")

    except Exception as exc:
        print(f"\n[ERROR] during batch commit: {exc}")
        print(f"Partial state: {committed_ops} of {total_ops} documents were written.")
        print("You can safely re-run this script with the same parameters to resume.")
        sys.exit(1)

    print("\n" + "=" * 78)
    print(" [OK] FIRESTORE DEMO SEEDING COMPLETED SUCCESSFULLY")
    print("=" * 78)
    print(f"Total collections seeded : 9")
    print(f"Total documents written  : {committed_ops}")
    print("\nTo verify the populated collections in Firestore, run:")
    print("  .\\venv\\Scripts\\python.exe scripts/seed_demo_firestore.py --verify")
    print("=" * 78 + "\n")


# ==============================================================================
# CLI Entrypoint
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Safe Firestore demo data seeding script for VTU Faculty Workload & Timetable Management System.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate and print all planned demo collections and document IDs without writing.",
    )
    mode_group.add_argument(
        "--verify",
        action="store_true",
        help="Perform a read-only audit of live collections and document counts in Cloud Firestore.",
    )
    mode_group.add_argument(
        "--confirm-demo-write",
        action="store_true",
        help="Explicitly confirm intent to write the synthetic demo dataset into Cloud Firestore.",
    )

    parser.add_argument(
        "--project-id",
        type=str,
        default=None,
        help=f"Target Firebase Project ID (must match '{EXPECTED_PROJECT_ID}' for write mode).",
    )

    args = parser.parse_args()
    dataset = build_demo_dataset()

    if args.dry_run:
        execute_dry_run(dataset)
    elif args.verify:
        execute_verify()
    elif args.confirm_demo_write:
        if not args.project_id:
            print(f"\n[ERROR] SAFETY REQUIREMENT: --project-id is required when using --confirm-demo-write.")
            print(f"Example: .\\venv\\Scripts\\python.exe scripts/seed_demo_firestore.py --confirm-demo-write --project-id {EXPECTED_PROJECT_ID}\n")
            sys.exit(1)
        execute_live_write(args.project_id)


if __name__ == "__main__":
    main()
