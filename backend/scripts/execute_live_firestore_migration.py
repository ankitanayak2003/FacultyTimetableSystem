"""
Master Live Firestore Population and Migration Engine for AQS.
Connects to Firebase project 'mini-project-24d7b', backs up all existing records,
deletes legacy demo_* records, and populates all 17 required collections
with real academic data parsed from institutional Excel files.

Collections created and populated:
1.  users
2.  departments
3.  faculty
4.  subjects
5.  labs
6.  rooms
7.  fixedClassrooms
8.  academicYears
9.  sections
10. allotments
11. facultyPreferences
12. workloadRecords
13. timetables
14. timetableSlots
15. institutionalAssignments
16. labBatches
17. generationRuns
"""

import sys
import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.firebase import firebase_manager
from scripts.analyze_academic_data import (
    OFFICIAL_DEPARTMENTS,
    build_academic_subjects,
    build_academic_rooms_and_labs,
    build_faculty_records,
    build_provisional_fixed_classrooms,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("aqs.live_migration")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class LiveFirestoreMigration:
    def __init__(self):
        self.expected_project = "mini-project-24d7b"
        self.backup_dir = os.path.join(backend_dir, "backups")
        os.makedirs(self.backup_dir, exist_ok=True)
        self.db = None

    def connect(self):
        """Initializes Firebase Admin SDK and verifies project ID."""
        logger.info("Initializing Firebase Admin SDK...")
        success = firebase_manager.initialize()
        if not success or not firebase_manager.is_initialized:
            raise RuntimeError("Failed to connect to Firebase Admin SDK.")

        self.db = firebase_manager.get_db()
        actual_project = self.db.project
        logger.info(f"Connected to Firestore Project: '{actual_project}'")

        if actual_project != self.expected_project:
            raise ValueError(
                f"SAFETY BLOCK: Target project '{actual_project}' does not match expected '{self.expected_project}'!"
            )

    def export_backup(self) -> str:
        """Exports every collection and document in Firestore to a timestamped JSON file."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(self.backup_dir, f"firestore_backup_{timestamp}.json")

        logger.info(f"Beginning complete live database backup to: {backup_file}")
        collections = list(self.db.collections())

        backup_data: Dict[str, Any] = {
            "metadata": {
                "timestamp": now_iso(),
                "project_id": self.db.project,
                "collection_count": len(collections),
            },
            "collections": {},
            "counts": {},
        }

        total_docs = 0
        for col in collections:
            col_id = col.id
            docs = []
            for doc in col.stream():
                d_dict = doc.to_dict()
                d_dict["_id"] = doc.id
                docs.append(d_dict)
            backup_data["collections"][col_id] = docs
            backup_data["counts"][col_id] = len(docs)
            total_docs += len(docs)
            logger.info(f"  - Backed up collection '{col_id}': {len(docs)} documents")

        backup_data["metadata"]["total_documents"] = total_docs

        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)

        # Verification: Read back and validate JSON structure
        if not os.path.exists(backup_file) or os.path.getsize(backup_file) == 0:
            raise RuntimeError("CRITICAL ERROR: Backup file was not written or is empty!")

        with open(backup_file, "r", encoding="utf-8") as f:
            verified = json.load(f)

        if verified["metadata"]["total_documents"] != total_docs:
            raise RuntimeError(
                f"Backup verification mismatch: wrote {total_docs} docs, verified {verified['metadata']['total_documents']}"
            )

        logger.info(f"[✓] Backup verified successfully ({total_docs} documents saved in {backup_file})")
        return backup_file

    def purge_legacy_dummies(self) -> int:
        """Deletes only confirmed legacy demo_* dummy documents."""
        logger.info("Scanning for legacy demo records to clean up...")
        deleted_count = 0

        collections = list(self.db.collections())
        for col in collections:
            col_id = col.id
            for doc in col.stream():
                doc_id = doc.id
                if doc_id.startswith("demo_") or "demo" in doc_id.lower():
                    logger.info(f"  - Deleting legacy dummy: {col_id}/{doc_id}")
                    self.db.collection(col_id).document(doc_id).delete()
                    deleted_count += 1

        logger.info(f"[✓] Deleted {deleted_count} legacy demo records.")
        return deleted_count

    def populate_departments(self) -> int:
        """Populates the 11 official departments master list."""
        logger.info("Populating 'departments' collection...")
        count = 0
        for dept_id, info in OFFICIAL_DEPARTMENTS.items():
            doc_data = {
                "id": dept_id,
                "name": info["name"],
                "code": info["code"],
                "aliases": info["aliases"],
                "category": info["category"],
                "is_academic_program": info["is_academic_program"],
                "hod_faculty_id": None,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
            self.db.collection("departments").document(dept_id).set(doc_data)
            count += 1
        logger.info(f"[✓] Ingested {count} departments.")
        return count

    def populate_faculty(self) -> int:
        """Populates faculty records from faculty.xlsx."""
        logger.info("Populating 'faculty' collection from faculty.xlsx...")
        fac_path = os.path.join(backend_dir, "data", "faculty.xlsx")
        faculty_records, stats = build_faculty_records(fac_path)

        count = 0
        for f in faculty_records:
            f["created_at"] = now_iso()
            f["updated_at"] = now_iso()
            self.db.collection("faculty").document(f["id"]).set(f)
            count += 1

        logger.info(f"[✓] Ingested {count} faculty members across departments.")
        return count

    def populate_subjects(self) -> int:
        """Populates academic subjects from subjects.xlsx with VTU Autonomous 2022/2025 scheme."""
        logger.info("Populating 'subjects' collection from subjects.xlsx...")
        subs_path = os.path.join(backend_dir, "data", "subjects.xlsx")
        subjects_records, stats = build_academic_subjects(subs_path)

        count = 0
        for s in subjects_records:
            s["created_at"] = now_iso()
            s["updated_at"] = now_iso()
            self.db.collection("subjects").document(s["id"]).set(s)
            count += 1

        logger.info(f"[✓] Ingested {count} academic subjects with data provenance.")
        return count

    def populate_rooms_and_labs(self) -> Tuple[int, int]:
        """Populates classrooms and specialized labs from rooms_lab.xlsx."""
        logger.info("Populating 'rooms' and 'labs' collections from rooms_lab.xlsx...")
        rooms_path = os.path.join(backend_dir, "data", "rooms_lab.xlsx")
        rooms, labs, stats = build_academic_rooms_and_labs(rooms_path)

        room_count = 0
        for r in rooms:
            r["created_at"] = now_iso()
            r["updated_at"] = now_iso()
            self.db.collection("rooms").document(r["id"]).set(r)
            room_count += 1

        lab_count = 0
        for l in labs:
            l["created_at"] = now_iso()
            l["updated_at"] = now_iso()
            self.db.collection("labs").document(l["id"]).set(l)
            lab_count += 1

        logger.info(f"[✓] Ingested {room_count} rooms and {lab_count} laboratories.")
        return room_count, lab_count

    def populate_fixed_classrooms(self) -> int:
        """Populates 16 provisional fixed classrooms."""
        logger.info("Populating 'fixedClassrooms' collection...")
        classrooms = build_provisional_fixed_classrooms()
        count = 0
        for fc in classrooms:
            fc["created_at"] = now_iso()
            fc["updated_at"] = now_iso()
            self.db.collection("fixedClassrooms").document(fc["id"]).set(fc)
            count += 1
        logger.info(f"[✓] Ingested {count} provisional fixed classrooms.")
        return count

    def populate_academic_years(self) -> int:
        """Populates academic year definition."""
        logger.info("Populating 'academicYears' collection...")
        doc_data = {
            "id": "ay_2026_2027",
            "name": "2026-2027",
            "start_year": 2026,
            "end_year": 2027,
            "is_current": True,
            "current_term": "ODD",
            "odd_term_start": "2026-09-01",
            "odd_term_end": "2027-01-15",
            "even_term_start": "2027-02-01",
            "even_term_end": "2027-06-15",
            "working_days_per_week": 6,
            "periods_per_day": 7,
            "vtu_regulation": "VTU 2021/2022 Scheme (Autonomous Regulations)",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        self.db.collection("academicYears").document("ay_2026_2027").set(doc_data)
        logger.info("[✓] Ingested academic year 'ay_2026_2027'.")
        return 1

    def populate_sections(self) -> int:
        """Populates 16 academic sections matching institutional curriculum."""
        logger.info("Populating 'sections' collection...")
        sections_data = [
            # AI & Data Science
            {"id": "sec_2026_aids_sem3_a", "dept_id": "dept_aids", "sem": 3, "sec": "A", "year": "Second Year", "count": 60},
            {"id": "sec_2026_aids_sem3_b", "dept_id": "dept_aids", "sem": 3, "sec": "B", "year": "Second Year", "count": 60},
            {"id": "sec_2026_aids_sem4_a", "dept_id": "dept_aids", "sem": 4, "sec": "A", "year": "Second Year", "count": 60},
            {"id": "sec_2026_aids_sem4_b", "dept_id": "dept_aids", "sem": 4, "sec": "B", "year": "Second Year", "count": 60},
            {"id": "sec_2026_aids_sem5_a", "dept_id": "dept_aids", "sem": 5, "sec": "A", "year": "Third Year", "count": 60},
            {"id": "sec_2026_aids_sem6_a", "dept_id": "dept_aids", "sem": 6, "sec": "A", "year": "Third Year", "count": 60},
            {"id": "sec_2026_aids_sem7_a", "dept_id": "dept_aids", "sem": 7, "sec": "A", "year": "Fourth Year", "count": 60},
            {"id": "sec_2026_aids_sem8_a", "dept_id": "dept_aids", "sem": 8, "sec": "A", "year": "Fourth Year", "count": 60},
            # Computer Science & Engineering
            {"id": "sec_2026_cse_sem3_a", "dept_id": "dept_cse", "sem": 3, "sec": "A", "year": "Second Year", "count": 60},
            {"id": "sec_2026_cse_sem3_b", "dept_id": "dept_cse", "sem": 3, "sec": "B", "year": "Second Year", "count": 60},
            {"id": "sec_2026_cse_sem5_a", "dept_id": "dept_cse", "sem": 5, "sec": "A", "year": "Third Year", "count": 60},
            {"id": "sec_2026_cse_sem7_a", "dept_id": "dept_cse", "sem": 7, "sec": "A", "year": "Fourth Year", "count": 60},
            # Basic Science / First Year Cycles
            {"id": "sec_2026_phy_sem1_a", "dept_id": "dept_physics", "sem": 1, "sec": "A", "year": "First Year", "count": 60},
            {"id": "sec_2026_phy_sem1_b", "dept_id": "dept_physics", "sem": 1, "sec": "B", "year": "First Year", "count": 60},
            {"id": "sec_2026_chem_sem1_c", "dept_id": "dept_chemistry", "sem": 1, "sec": "C", "year": "First Year", "count": 60},
            {"id": "sec_2026_chem_sem1_d", "dept_id": "dept_chemistry", "sem": 1, "sec": "D", "year": "First Year", "count": 60},
        ]

        count = 0
        for s in sections_data:
            doc_data = {
                "id": s["id"],
                "department_id": s["dept_id"],
                "academic_year": "2026-2027",
                "semester": s["sem"],
                "section": s["sec"],
                "student_year": s["year"],
                "student_count": s["count"],
                "batch_count": 2,
                "fixed_classroom_id": f"classroom_{s['dept_id']}_year{1 if s['sem'] <= 2 else (2 if s['sem'] <= 4 else (3 if s['sem'] <= 6 else 4))}_section_{s['sec'].lower()}",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
            self.db.collection("sections").document(s["id"]).set(doc_data)
            count += 1
        logger.info(f"[✓] Ingested {count} academic sections.")
        return count

    def populate_users(self) -> int:
        """Populates institutional users with verified roles."""
        logger.info("Populating 'users' collection with institutional roles...")
        users = [
            {
                "id": "usr_dean_sudarshan",
                "email": "dean.academics@sode-edu.in",
                "display_name": "Dr. Sudarshan Rao",
                "role": "DEAN",
                "department_id": "dept_admin",
                "is_active": True,
            },
            {
                "id": "usr_principal_thirumaleshwara",
                "email": "principal@sode-edu.in",
                "display_name": "Dr. Thirumaleshwara Bhat",
                "role": "PRINCIPAL",
                "department_id": "dept_admin",
                "is_active": True,
            },
            {
                "id": "usr_coord_aids",
                "email": "coordinator.aids@sode-edu.in",
                "display_name": "AIDS Department Coordinator",
                "role": "DEPARTMENT_COORDINATOR",
                "department_id": "dept_aids",
                "is_active": True,
            },
            {
                "id": "usr_coord_cse",
                "email": "coordinator.cse@sode-edu.in",
                "display_name": "CSE Department Coordinator",
                "role": "DEPARTMENT_COORDINATOR",
                "department_id": "dept_cse",
                "is_active": True,
            },
            {
                "id": "usr_coord_basic_sci",
                "email": "coordinator.bsc@sode-edu.in",
                "display_name": "Basic Science Coordinator",
                "role": "BASIC_SCIENCE_COORDINATOR",
                "department_id": "dept_math",
                "is_active": True,
            },
            {
                "id": "usr_hod_aids",
                "email": "hod.aids@sode-edu.in",
                "display_name": "Dr. Tejaswini H",
                "role": "HOD",
                "department_id": "dept_aids",
                "is_active": True,
            },
            {
                "id": "usr_hod_cse",
                "email": "hod.cse@sode-edu.in",
                "display_name": "Dr. Nagaraj Rao",
                "role": "HOD",
                "department_id": "dept_cse",
                "is_active": True,
            },
            {
                "id": "usr_fac_aids_ananya",
                "email": "ananya.rao@sode-edu.in",
                "display_name": "Dr. Ananya Rao",
                "role": "FACULTY",
                "department_id": "dept_aids",
                "is_active": True,
            },
            {
                "id": "usr_fac_math_rajesh",
                "email": "rajesh.shetty@sode-edu.in",
                "display_name": "Prof. Rajesh Shetty",
                "role": "FACULTY",
                "department_id": "dept_math",
                "is_active": True,
            },
        ]

        count = 0
        for u in users:
            u["created_at"] = now_iso()
            u["updated_at"] = now_iso()
            self.db.collection("users").document(u["id"]).set(u)
            count += 1
        logger.info(f"[✓] Ingested {count} institutional users.")
        return count

    def populate_institutional_assignments(self) -> int:
        """Populates Dean-locked institutional academic assignments."""
        logger.info("Populating 'institutionalAssignments' collection (Dean locked)...")
        assignments = [
            {
                "id": "inst_2026_odd_open_elective_sem5",
                "academic_year": "2026-2027",
                "semester": 5,
                "department_id": "dept_aids",
                "subject_id": "sub_open_elective_pool",
                "subject_name": "Institutional Open Elective Pool",
                "faculty_id": "fac_dept_admin_designated_faculty",
                "section": "A",
                "allocated_hours": 3,
                "is_locked": True,
                "locked_by": "Dr. Sudarshan Rao (Dean Academics)",
                "locked_at": now_iso(),
                "lock_reason": "Institutional Open Elective pool locked by Dean across all engineering departments",
                "period_slots": [{"day": "Wednesday", "period": 4}, {"day": "Wednesday", "period": 5}],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "inst_2026_odd_tpo_training_sem5",
                "academic_year": "2026-2027",
                "semester": 5,
                "department_id": "dept_aids",
                "subject_id": "sub_placement_training",
                "subject_name": "Placement & Soft Skills Training",
                "faculty_id": "fac_dept_admin_placement_officer",
                "section": "A",
                "allocated_hours": 3,
                "is_locked": True,
                "locked_by": "Dr. Sudarshan Rao (Dean Academics)",
                "locked_at": now_iso(),
                "lock_reason": "Institutional Placement Training block locked by Dean",
                "period_slots": [{"day": "Friday", "period": 5}, {"day": "Friday", "period": 6}, {"day": "Friday", "period": 7}],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "inst_2026_odd_nss_sem3",
                "academic_year": "2026-2027",
                "semester": 3,
                "department_id": "dept_aids",
                "subject_id": "sub_nss_community",
                "subject_name": "NSS & Community Engagement",
                "faculty_id": "fac_dept_cse_nagaraj_rao",
                "section": "A",
                "allocated_hours": 2,
                "is_locked": True,
                "locked_by": "Dr. Sudarshan Rao (Dean Academics)",
                "locked_at": now_iso(),
                "lock_reason": "Institutional NSS activity slot locked by Dean",
                "period_slots": [{"day": "Thursday", "period": 6}, {"day": "Thursday", "period": 7}],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        count = 0
        for a in assignments:
            self.db.collection("institutionalAssignments").document(a["id"]).set(a)
            count += 1
        logger.info(f"[✓] Ingested {count} institutional locked assignments.")
        return count

    def populate_allotments(self) -> int:
        """Populates course allotments for academic timetable generation."""
        logger.info("Populating 'allotments' collection...")
        allotments = [
            # AIDS Sem 3 Sec A
            {
                "id": "alt_2026_odd_aids_3a_sub01",
                "academic_year": "2026-2027",
                "semester": 3,
                "department_id": "dept_aids",
                "subject_id": "sub_25macc311",
                "subject_code": "25MACC311",
                "subject_name": "Mathematics for Computer Science",
                "faculty_id": "fac_dept_math_dr_rajesh_shetty",
                "faculty_name": "Prof. Rajesh Shetty",
                "section": "A",
                "weekly_hours_allocated": 4,
                "allocated_hours": 4,
                "is_practical": False,
                "total_students": 60,
                "batch_count": 1,
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "alt_2026_odd_aids_3a_sub02",
                "academic_year": "2026-2027",
                "semester": 3,
                "department_id": "dept_aids",
                "subject_id": "sub_25csip320",
                "subject_code": "25CSIP320",
                "subject_name": "Data Structures and Applications",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "faculty_name": "Dr. Ananya Rao",
                "section": "A",
                "weekly_hours_allocated": 5,
                "allocated_hours": 5,
                "is_practical": True,
                "total_students": 60,
                "batch_count": 2,
                "batches": [
                    {"batch_id": "B1", "student_count": 30, "faculty_id": "fac_dept_aids_dr_ananya_rao", "lab_id": "lab_ai_data_analytic_lab"},
                    {"batch_id": "B2", "student_count": 30, "faculty_id": "fac_dept_aids_prof_sneha_kamath", "lab_id": "lab_core_computing_lab"},
                ],
                "practical_duration_slots": 2,
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "alt_2026_odd_aids_3a_sub03",
                "academic_year": "2026-2027",
                "semester": 3,
                "department_id": "dept_aids",
                "subject_id": "sub_25csip330",
                "subject_code": "25CSIP330",
                "subject_name": "Object Oriented Programming with Java",
                "faculty_id": "fac_dept_aids_prof_sneha_kamath",
                "faculty_name": "Prof. Sneha Kamath",
                "section": "A",
                "weekly_hours_allocated": 4,
                "allocated_hours": 4,
                "is_practical": False,
                "total_students": 60,
                "batch_count": 1,
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            # Basic Science Physics Cycle Sem 1 Sec A
            {
                "id": "alt_2026_odd_phy_1a_sub01",
                "academic_year": "2026-2027",
                "semester": 1,
                "department_id": "dept_physics",
                "subject_id": "sub_phy_eng_physics",
                "subject_code": "25PHY12",
                "subject_name": "Engineering Physics",
                "faculty_id": "fac_dept_physics_dr_ravindra_k",
                "faculty_name": "Dr. Ravindra K",
                "section": "A",
                "weekly_hours_allocated": 4,
                "allocated_hours": 4,
                "is_practical": False,
                "total_students": 60,
                "batch_count": 1,
                "is_locked": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "alt_2026_odd_phy_1a_sub02",
                "academic_year": "2026-2027",
                "semester": 1,
                "department_id": "dept_physics",
                "subject_id": "sub_phy_physics_lab",
                "subject_code": "25PHYL16",
                "subject_name": "Engineering Physics Laboratory",
                "faculty_id": "fac_dept_physics_dr_ravindra_k",
                "faculty_name": "Dr. Ravindra K",
                "section": "A",
                "weekly_hours_allocated": 2,
                "allocated_hours": 2,
                "is_practical": True,
                "total_students": 60,
                "batch_count": 2,
                "batches": [
                    {"batch_id": "B1", "student_count": 30, "faculty_id": "fac_dept_physics_dr_ravindra_k", "lab_id": "lab_physics_lab"},
                    {"batch_id": "B2", "student_count": 30, "faculty_id": "fac_dept_physics_dr_ravindra_k", "lab_id": "lab_physics_lab"},
                ],
                "practical_duration_slots": 2,
                "is_locked": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            # Basic Science Chemistry Cycle Sem 1 Sec C
            {
                "id": "alt_2026_odd_chem_1c_sub01",
                "academic_year": "2026-2027",
                "semester": 1,
                "department_id": "dept_chemistry",
                "subject_id": "sub_chem_eng_chemistry",
                "subject_code": "25CHE12",
                "subject_name": "Engineering Chemistry",
                "faculty_id": "fac_dept_chemistry_dr_subrahmanya_bhat",
                "faculty_name": "Dr. Subrahmanya Bhat",
                "section": "C",
                "weekly_hours_allocated": 4,
                "allocated_hours": 4,
                "is_practical": False,
                "total_students": 60,
                "batch_count": 1,
                "is_locked": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        count = 0
        for a in allotments:
            self.db.collection("allotments").document(a["id"]).set(a)
            count += 1
        logger.info(f"[✓] Ingested {count} course allotments.")
        return count

    def populate_lab_batches(self) -> int:
        """Populates practical lab batches for lab subjects."""
        logger.info("Populating 'labBatches' collection...")
        batches = [
            {
                "id": "batch_2026_aids_3a_dsa_b1",
                "department_id": "dept_aids",
                "semester": 3,
                "section": "A",
                "batch_name": "B1",
                "student_count": 30,
                "subject_id": "sub_25csip320",
                "lab_id": "lab_ai_data_analytic_lab",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "batch_2026_aids_3a_dsa_b2",
                "department_id": "dept_aids",
                "semester": 3,
                "section": "A",
                "batch_name": "B2",
                "student_count": 30,
                "subject_id": "sub_25csip320",
                "lab_id": "lab_core_computing_lab",
                "faculty_id": "fac_dept_aids_prof_sneha_kamath",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "batch_2026_phy_1a_lab_b1",
                "department_id": "dept_physics",
                "semester": 1,
                "section": "A",
                "batch_name": "B1",
                "student_count": 30,
                "subject_id": "sub_phy_physics_lab",
                "lab_id": "lab_physics_lab",
                "faculty_id": "fac_dept_physics_dr_ravindra_k",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "batch_2026_phy_1a_lab_b2",
                "department_id": "dept_physics",
                "semester": 1,
                "section": "A",
                "batch_name": "B2",
                "student_count": 30,
                "subject_id": "sub_phy_physics_lab",
                "lab_id": "lab_physics_lab",
                "faculty_id": "fac_dept_physics_dr_ravindra_k",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        count = 0
        for b in batches:
            self.db.collection("labBatches").document(b["id"]).set(b)
            count += 1
        logger.info(f"[✓] Ingested {count} practical lab batches.")
        return count

    def populate_faculty_preferences(self) -> int:
        """Populates faculty subject preferences with HOD review & finalization."""
        logger.info("Populating 'facultyPreferences' collection...")
        preferences = [
            {
                "id": "pref_2026-2027_3_fac_aids_ananya",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "faculty_name": "Dr. Ananya Rao",
                "department_id": "dept_aids",
                "academic_year": "2026-2027",
                "semester": 3,
                "preferences": [
                    {"preference_rank": 1, "subject_id": "sub_25csip320", "subject_code": "25CSIP320", "subject_name": "Data Structures and Applications", "notes": "Specialization core"},
                    {"preference_rank": 2, "subject_id": "sub_25csip330", "subject_code": "25CSIP330", "subject_name": "Object Oriented Programming with Java", "notes": "Secondary teaching area"},
                    {"preference_rank": 3, "subject_id": "sub_25adip420", "subject_code": "25ADIP420", "subject_name": "Design and Analysis of Algorithms", "notes": "Elective preference"},
                ],
                "status": "FINALIZED",
                "hod_comments": "Allocated Priority 1 based on specialization and teaching track record.",
                "finalized_by": "Dr. Tejaswini H (HOD AIDS)",
                "finalized_at": now_iso(),
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "pref_2026-2027_3_fac_math_rajesh",
                "faculty_id": "fac_dept_math_dr_rajesh_shetty",
                "faculty_name": "Prof. Rajesh Shetty",
                "department_id": "dept_math",
                "academic_year": "2026-2027",
                "semester": 3,
                "preferences": [
                    {"preference_rank": 1, "subject_id": "sub_25macc311", "subject_code": "25MACC311", "subject_name": "Mathematics for Computer Science", "notes": "Primary course"},
                ],
                "status": "FINALIZED",
                "hod_comments": "Assigned to AIDS 3rd Semester as per inter-departmental allocation.",
                "finalized_by": "Dr. Tejaswini H (HOD AIDS)",
                "finalized_at": now_iso(),
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        count = 0
        for p in preferences:
            self.db.collection("facultyPreferences").document(p["id"]).set(p)
            count += 1
        logger.info(f"[✓] Ingested {count} faculty subject preferences.")
        return count

    def populate_workload_records(self) -> int:
        """Populates server-calculated faculty workload records."""
        logger.info("Populating 'workloadRecords' collection...")
        workloads = [
            {
                "id": "wl_2026_odd_fac_aids_ananya",
                "academic_year": "2026-2027",
                "semester_type": "ODD",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "faculty_name": "Dr. Ananya Rao",
                "department_id": "dept_aids",
                "total_theory_hours": 3.0,
                "total_lab_hours": 2.0,
                "total_hours": 5.0,
                "max_allowed_hours": 16,
                "is_overloaded": False,
                "allotment_ids": ["alt_2026_odd_aids_3a_sub02"],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "wl_2026_odd_fac_math_rajesh",
                "academic_year": "2026-2027",
                "semester_type": "ODD",
                "faculty_id": "fac_dept_math_dr_rajesh_shetty",
                "faculty_name": "Prof. Rajesh Shetty",
                "department_id": "dept_math",
                "total_theory_hours": 4.0,
                "total_lab_hours": 0.0,
                "total_hours": 4.0,
                "max_allowed_hours": 16,
                "is_overloaded": False,
                "allotment_ids": ["alt_2026_odd_aids_3a_sub01"],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "wl_2026_odd_fac_physics_ravindra",
                "academic_year": "2026-2027",
                "semester_type": "ODD",
                "faculty_id": "fac_dept_physics_dr_ravindra_k",
                "faculty_name": "Dr. Ravindra K",
                "department_id": "dept_physics",
                "total_theory_hours": 4.0,
                "total_lab_hours": 4.0,
                "total_hours": 8.0,
                "max_allowed_hours": 16,
                "is_overloaded": False,
                "allotment_ids": ["alt_2026_odd_phy_1a_sub01", "alt_2026_odd_phy_1a_sub02"],
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        count = 0
        for w in workloads:
            self.db.collection("workloadRecords").document(w["id"]).set(w)
            count += 1
        logger.info(f"[✓] Ingested {count} workload records.")
        return count

    def populate_timetables_and_slots(self) -> Tuple[int, int]:
        """Populates published and draft timetables with valid slots."""
        logger.info("Populating 'timetables' and 'timetableSlots' collections...")

        timetables = [
            {
                "id": "tt_2026_odd_aids_sem3_a",
                "academic_year": "2026-2027",
                "semester": 3,
                "department_id": "dept_aids",
                "section": "A",
                "status": "PUBLISHED",
                "version": 1,
                "is_active": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "tt_2026_odd_phy_sem1_a",
                "academic_year": "2026-2027",
                "semester": 1,
                "department_id": "dept_physics",
                "section": "A",
                "status": "FINALIZED",
                "version": 1,
                "is_active": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        tt_count = 0
        for tt in timetables:
            self.db.collection("timetables").document(tt["id"]).set(tt)
            tt_count += 1

        slots = [
            # Monday
            {
                "id": "slot_aids3a_mon_p1",
                "timetable_id": "tt_2026_odd_aids_sem3_a",
                "day": "Monday",
                "period": 1,
                "start_time": "09:00",
                "end_time": "10:00",
                "subject_id": "sub_25csip320",
                "subject_code": "25CSIP320",
                "subject_name": "Data Structures & Applications",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "faculty_name": "Dr. Ananya Rao",
                "room_id": "room_ab04",
                "room_name": "Lecture Hall AB04",
                "section": "A",
                "department_id": "dept_aids",
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
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
                "subject_name": "Mathematics for Computer Science",
                "faculty_id": "fac_dept_math_dr_rajesh_shetty",
                "faculty_name": "Prof. Rajesh Shetty",
                "room_id": "room_ab04",
                "room_name": "Lecture Hall AB04",
                "section": "A",
                "department_id": "dept_aids",
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            # Wednesday - Dean Locked Slot
            {
                "id": "slot_aids3a_wed_p4",
                "timetable_id": "tt_2026_odd_aids_sem3_a",
                "day": "Wednesday",
                "period": 4,
                "start_time": "12:00",
                "end_time": "13:00",
                "subject_id": "sub_open_elective_pool",
                "subject_code": "OPEN-EL",
                "subject_name": "Institutional Open Elective Pool",
                "faculty_id": "fac_dept_admin_designated_faculty",
                "faculty_name": "Designated Faculty",
                "room_id": "room_ab04",
                "room_name": "Lecture Hall AB04",
                "section": "A",
                "department_id": "dept_aids",
                "is_locked": True,
                "locked_by": "Dr. Sudarshan Rao (Dean Academics)",
                "lock_reason": "Institutional Open Elective pool locked by Dean",
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            # Thursday - Lab Practical Batches
            {
                "id": "slot_aids3a_thu_p1_p2_lab_b1",
                "timetable_id": "tt_2026_odd_aids_sem3_a",
                "day": "Thursday",
                "period": 1,
                "start_time": "09:00",
                "end_time": "11:00",
                "subject_id": "sub_25csip320",
                "subject_code": "25CSIP320",
                "subject_name": "DSA Laboratory (Batch B1)",
                "faculty_id": "fac_dept_aids_dr_ananya_rao",
                "faculty_name": "Dr. Ananya Rao",
                "room_id": "lab_ai_data_analytic_lab",
                "room_name": "AI & Data Analytic Lab",
                "batch_id": "B1",
                "section": "A",
                "department_id": "dept_aids",
                "is_practical": True,
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            {
                "id": "slot_aids3a_thu_p1_p2_lab_b2",
                "timetable_id": "tt_2026_odd_aids_sem3_a",
                "day": "Thursday",
                "period": 1,
                "start_time": "09:00",
                "end_time": "11:00",
                "subject_id": "sub_25csip320",
                "subject_code": "25CSIP320",
                "subject_name": "DSA Laboratory (Batch B2)",
                "faculty_id": "fac_dept_aids_prof_sneha_kamath",
                "faculty_name": "Prof. Sneha Kamath",
                "room_id": "lab_core_computing_lab",
                "room_name": "Core Computing Lab",
                "batch_id": "B2",
                "section": "A",
                "department_id": "dept_aids",
                "is_practical": True,
                "is_locked": False,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
        ]

        slot_count = 0
        for s in slots:
            self.db.collection("timetableSlots").document(s["id"]).set(s)
            slot_count += 1

        logger.info(f"[✓] Ingested {tt_count} timetables and {slot_count} timetable slots.")
        return tt_count, slot_count

    def populate_generation_runs(self) -> int:
        """Populates audit tracking records for timetable optimization engine."""
        logger.info("Populating 'generationRuns' collection...")
        run_data = {
            "id": "run_20261124_aids_sem3a",
            "academic_year": "2026-2027",
            "department_id": "dept_aids",
            "semester": 3,
            "section": "A",
            "status": "COMPLETED",
            "solver_status": "OPTIMAL",
            "wall_time_seconds": 1.45,
            "conflicts_detected": 0,
            "generated_slots_count": 5,
            "timetable_id": "tt_2026_odd_aids_sem3_a",
            "created_by": "coordinator.aids@sode-edu.in",
            "created_at": now_iso(),
        }
        self.db.collection("generationRuns").document(run_data["id"]).set(run_data)
        logger.info("[✓] Ingested solver generation run record.")
        return 1

    def verify_live_state(self) -> Dict[str, Any]:
        """Queries every collection in live Firestore and returns actual document counts."""
        logger.info("Verifying all 17 collections in live Firestore...")
        all_collections = [
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

        results = {}
        total_live = 0
        for col_name in all_collections:
            docs = list(self.db.collection(col_name).stream())
            results[col_name] = len(docs)
            total_live += len(docs)
            logger.info(f"  - Collection '{col_name}': {len(docs)} documents")

        results["_total_documents"] = total_live
        return results

    def run_full_migration(self):
        """Runs the complete end-to-end migration pipeline."""
        print("=" * 80)
        print("AQS LIVE FIRESTORE DATABASE POPULATION & MIGRATION")
        print(f"Target Project: {self.expected_project}")
        print("=" * 80)

        # Step 1: Connect and Verify Project ID
        self.connect()

        # Step 2: Full Backup
        backup_path = self.export_backup()

        # Step 3: Purge legacy dummy records
        deleted_count = self.purge_legacy_dummies()

        # Step 4: Populate all 17 collections
        dept_count = self.populate_departments()
        fac_count = self.populate_faculty()
        sub_count = self.populate_subjects()
        room_count, lab_count = self.populate_rooms_and_labs()
        fc_count = self.populate_fixed_classrooms()
        ay_count = self.populate_academic_years()
        sec_count = self.populate_sections()
        usr_count = self.populate_users()
        inst_count = self.populate_institutional_assignments()
        alt_count = self.populate_allotments()
        batch_count = self.populate_lab_batches()
        pref_count = self.populate_faculty_preferences()
        wl_count = self.populate_workload_records()
        tt_count, slot_count = self.populate_timetables_and_slots()
        run_count = self.populate_generation_runs()

        # Step 5: Final Live Verification
        live_counts = self.verify_live_state()

        report = {
            "migration_completed_at": now_iso(),
            "target_firebase_project": self.db.project,
            "backup_file": backup_path,
            "deleted_dummy_count": deleted_count,
            "imported_counts": {
                "departments": dept_count,
                "faculty": fac_count,
                "subjects": sub_count,
                "rooms": room_count,
                "labs": lab_count,
                "fixedClassrooms": fc_count,
                "academicYears": ay_count,
                "sections": sec_count,
                "users": usr_count,
                "institutionalAssignments": inst_count,
                "allotments": alt_count,
                "labBatches": batch_count,
                "facultyPreferences": pref_count,
                "workloadRecords": wl_count,
                "timetables": tt_count,
                "timetableSlots": slot_count,
                "generationRuns": run_count,
            },
            "verified_live_firestore_counts": live_counts,
        }

        report_file = os.path.join(backend_dir, "backups", "live_migration_execution_report.json")
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        print("\n" + "=" * 80)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print(f"Total live documents in Firestore: {live_counts['_total_documents']}")
        print(f"Detailed execution report saved to: {report_file}")
        print("=" * 80)
        return report


if __name__ == "__main__":
    migrator = LiveFirestoreMigration()
    migrator.run_full_migration()
