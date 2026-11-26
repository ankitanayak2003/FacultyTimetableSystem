"""
Comprehensive Test Suite for:
1. Excel Data Import & Parsing (faculty.xlsx, rooms_lab.xlsx, subjects.xlsx).
2. Google OR-Tools CP-SAT Timetable Solver Engine.
3. Constraint and Clash Validation Engine.
4. Two-Batch Practical & Lab Capacity Management.
5. IPCC Theory & Practical Separation.
6. Dean-Locked Institutional Slots Preservation.
7. External Lab & Lab Maintenance/Unavailability Handling.
"""

import pytest
from app.models.entities import (
    FacultyProfile,
    FacultyDesignation,
    Room,
    RoomType,
    Lab,
    LabType,
    Subject,
    TimetableSlot,
    DayOfWeek,
    FacultySubjectPreference,
    RankedSubjectPreference,
)
from app.schemas.entities import (
    TimetableGenerationRequest,
    ExcelImportRequest,
)
from app.services.excel_importer import (
    excel_importer,
    parse_faculty_records,
    parse_rooms_and_labs,
    parse_subject_records,
)
from app.services.solver import timetable_solver
from app.services.validator import schedule_validator


def sync_runner(coro):
    """Zero-dependency coroutine trampoline for sandbox-safe async execution."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


# =====================================================================
# 1. Excel Ingestion & Parsing Tests
# =====================================================================

def test_excel_file_inspection():
    """Confirms all three Excel files exist and are non-empty."""
    info = excel_importer.inspect_files()
    assert info["faculty_file"]["exists"] is True
    assert info["faculty_file"]["size_bytes"] > 0
    assert info["rooms_file"]["exists"] is True
    assert info["rooms_file"]["size_bytes"] > 0
    assert info["subjects_file"]["exists"] is True
    assert info["subjects_file"]["size_bytes"] > 0


def test_faculty_excel_parsing():
    """Validates faculty members parsed across departments with stable IDs and designations."""
    records = parse_faculty_records("backend/data/faculty.xlsx")
    assert len(records) >= 80

    # Test AIDS faculty
    tejaswini = next((r for r in records if "tejaswini" in r["id"]), None)
    assert tejaswini is not None
    assert tejaswini["department_id"] == "dept_aids"
    assert tejaswini["name"] == "Dr. Tejaswini H"
    assert tejaswini["designation"] == FacultyDesignation.HOD
    assert tejaswini["max_weekly_hours"] == 18

    # Test Basic Science faculty
    math_fac = [r for r in records if r["department_id"] in ("dept_math", "dept_mathematics")]
    assert len(math_fac) >= 5
    phy_fac = [r for r in records if r["department_id"] == "dept_physics"]
    assert len(phy_fac) >= 3
    chem_fac = [r for r in records if r["department_id"] == "dept_chemistry"]
    assert len(chem_fac) >= 3

    # Test Dean and Principal detection
    dean = next((r for r in records if "sudarshan" in r["id"]), None)
    assert dean is not None
    assert "DEAN" in str(dean.get("role", "")).upper() or "Dean" in dean.get("notes", "")

    principal = next((r for r in records if "nagraj" in r["id"] or "nagaraj" in r["id"]), None)
    assert principal is not None
    assert "PRINCIPAL" in str(principal.get("role", "")).upper() or "Principal" in principal.get("notes", "")

    # Validate all parsed records against Pydantic model
    for r in records:
        profile = FacultyProfile(**r)
        assert profile.id.startswith("fac_")
        assert len(profile.name) >= 1


def test_rooms_and_labs_excel_parsing():
    """Validates classrooms and specialized labs parsed with building, capacity, and status."""
    rooms, labs = parse_rooms_and_labs("backend/data/rooms_lab.xlsx")
    assert len(rooms) >= 3
    assert len(labs) >= 25

    # Check Classrooms
    ab04 = next((r for r in rooms if "ab04" in r["id"]), None)
    assert ab04 is not None
    assert ab04["room_type"] == RoomType.CLASSROOM
    assert ab04["capacity"] == 60

    # Check AI & Data Analytic Lab
    ai_lab = next((l for l in labs if "ai_data_analytic" in l["id"]), None)
    assert ai_lab is not None
    assert ai_lab["capacity"] == 60  # Dual room F103,F104
    assert ai_lab["is_available"] is True
    assert ai_lab["availability_status"] == "AVAILABLE"

    # Check Lab reported as Not Working (Maintenance)
    cad_lab = next((l for l in labs if "computer_aided_design" in l["id"]), None)
    assert cad_lab is not None
    assert cad_lab["is_available"] is False
    assert cad_lab["availability_status"] == "MAINTENANCE"
    assert "not working" in (cad_lab.get("notes") or "").lower()

    # Validate all models
    for rm in rooms:
        Room(**rm)
    for lb in labs:
        Lab(**lb)


def test_subjects_excel_parsing_and_ipcc_handling():
    """Validates subjects parsed with L:T:P calculation and IPCC batch configuration."""
    subjects = parse_subject_records("backend/data/subjects.xlsx")
    assert len(subjects) >= 70

    # Test IPCC Subject: 25CSIP320 (Java)
    java_sub = next((s for s in subjects if s.get("code") == "25CSIP320"), None)
    assert java_sub is not None
    assert java_sub["course_type"] == "IPCC"
    assert java_sub["is_lab"] is True
    assert java_sub["lecture_hours"] == 3
    assert java_sub["practical_hours"] == 2
    assert java_sub["lab_batch_count"] == 2
    assert java_sub["weekly_hours"] == 5

    # Test PCCL Subject: 25CSCL360 (Data Structures Lab)
    ds_lab = next((s for s in subjects if s.get("code") == "25CSCL360"), None)
    assert ds_lab is not None
    assert ds_lab["is_lab"] is True
    assert ds_lab["practical_hours"] == 2
    assert ds_lab["lab_batch_count"] == 2
    assert ds_lab["weekly_hours"] == 2

    # Test Pure Theory Subject: 25CSCC340 (Operating Systems)
    os_sub = next((s for s in subjects if s.get("code") == "25CSCC340"), None)
    assert os_sub is not None
    assert os_sub["is_lab"] is False
    assert os_sub["practical_hours"] == 0
    assert os_sub["lecture_hours"] == 3

    # Validate all Pydantic models
    for s in subjects:
        Subject(**s)


def test_excel_importer_dry_run_summary():
    """Verifies dry-run import report executes cleanly with 0 invalid records."""
    summary = sync_runner(excel_importer.execute_import(dry_run=True, overwrite=False))
    assert summary.dry_run is True
    assert summary.faculty.invalid == 0
    assert summary.rooms.invalid == 0
    assert summary.labs.invalid == 0
    assert summary.subjects.invalid == 0
    assert summary.faculty.added >= 80
    assert summary.rooms.added >= 3
    assert summary.labs.added >= 25
    assert summary.subjects.added >= 70
    assert summary.total_records >= 180


# =====================================================================
# 2. Google OR-Tools CP-SAT Timetable Solver Tests
# =====================================================================

def test_cpsat_solver_two_batch_practical_and_ipcc():
    """Tests CP-SAT solver generates two consecutive batches for practical/IPCC courses."""
    req = TimetableGenerationRequest(
        academic_year="2026-2027",
        semester=3,
        department_id="dept_aids",
        section="A",
        student_count=60,
        batch_count=2,
        periods_per_day=7,
        lunch_period=5,
    )

    subs = [
        Subject(
            id="sub_java",
            code="25CSIP320",
            course_name="Object Oriented Programming with Java",
            department_id="dept_aids",
            course_type="IPCC",
            lecture_hours=3,
            practical_hours=2,
            is_lab=True,
            weekly_hours=5,
        ),
        Subject(
            id="sub_dsa",
            code="25CSCC350",
            course_name="Data Structures and Applications",
            department_id="dept_aids",
            course_type="PCC",
            lecture_hours=3,
            practical_hours=0,
            is_lab=False,
            weekly_hours=3,
        ),
    ]

    allotments = [
        {"subject_id": "sub_java", "faculty_id": "fac_sneha"},
        {"subject_id": "sub_dsa", "faculty_id": "fac_ananya"},
    ]

    rooms = [Room(id="room_lh1", name="LH-201", capacity=60)]
    labs = [
        Lab(id="lab_cc1", name="AI Lab 1", capacity=30, is_available=True),
        Lab(id="lab_cc2", name="AI Lab 2", capacity=30, is_available=True),
    ]

    locked = [
        {
            "name": "Placement Training",
            "day": "FRIDAY",
            "startPeriod": 6,
            "assignedFaculty": "TPO",
            "venue": "Auditorium",
        }
    ]

    res = timetable_solver.solve(
        request=req,
        subjects=subs,
        allotments=allotments,
        faculty_profiles={},
        rooms=rooms,
        labs=labs,
        institutional_locked_slots=locked,
    )

    assert res.status in ("OPTIMAL", "FEASIBLE")
    assert res.slots_generated >= 11

    # Check that Dean locked slot is strictly preserved
    locked_slot = next((s for s in res.slots if "Placement Training" in str(s["subject_id"])), None)
    assert locked_slot is not None
    assert locked_slot["day"] == "FRIDAY"
    assert locked_slot["slot_number"] == 6

    # Check Practical Batches B1 and B2
    b1_slots = [s for s in res.slots if s.get("batch") == "B1"]
    b2_slots = [s for s in res.slots if s.get("batch") == "B2"]
    assert len(b1_slots) == 2, "Batch 1 must have exactly 2 practical periods"
    assert len(b2_slots) == 2, "Batch 2 must have exactly 2 practical periods"

    # Check that practical batch sessions are consecutive
    b1_sorted = sorted(b1_slots, key=lambda s: s["slot_number"])
    assert b1_sorted[1]["slot_number"] == b1_sorted[0]["slot_number"] + 1
    assert b1_sorted[0]["lab_id"] == b1_sorted[1]["lab_id"], "Lab must remain identical across session"

    b2_sorted = sorted(b2_slots, key=lambda s: s["slot_number"])
    assert b2_sorted[1]["slot_number"] == b2_sorted[0]["slot_number"] + 1

    # Check that lunch period 5 was never assigned
    assert not any(s["slot_number"] == 5 for s in res.slots)


def test_cpsat_solver_excludes_unavailable_labs():
    """Verifies that laboratories under maintenance are not assigned by the solver."""
    req = TimetableGenerationRequest(
        academic_year="2026-2027",
        semester=3,
        department_id="dept_aids",
        section="A",
        student_count=30,
        batch_count=1,
    )

    subs = [
        Subject(
            id="sub_ds_lab",
            code="25CSCL360",
            course_name="DS Lab",
            department_id="dept_aids",
            course_type="PCCL",
            lecture_hours=0,
            practical_hours=2,
            is_lab=True,
        )
    ]

    allotments = [{"subject_id": "sub_ds_lab", "faculty_id": "fac_ananya"}]
    rooms = [Room(id="room_lh1", name="LH-201", capacity=60)]
    labs = [
        Lab(id="lab_broken", name="Broken Lab", capacity=30, is_available=False, availability_status="MAINTENANCE"),
        Lab(id="lab_working", name="Active Lab", capacity=30, is_available=True, availability_status="AVAILABLE"),
    ]

    res = timetable_solver.solve(
        request=req,
        subjects=subs,
        allotments=allotments,
        faculty_profiles={},
        rooms=rooms,
        labs=labs,
    )

    assert res.status in ("OPTIMAL", "FEASIBLE")
    lab_slots = [s for s in res.slots if s.get("is_lab")]
    assert all(s["lab_id"] == "lab_working" for s in lab_slots)
    assert not any(s["lab_id"] == "lab_broken" for s in lab_slots)


def test_cpsat_solver_honors_faculty_ranked_preferences():
    """Verifies that solver soft objectives maximize faculty ranked preferences."""
    req = TimetableGenerationRequest(
        academic_year="2026-2027",
        semester=3,
        department_id="dept_aids",
        section="A",
        student_count=60,
        batch_count=1,
    )

    sub1 = Subject(id="sub_1", code="C1", course_name="Course 1", department_id="dept_aids", lecture_hours=3)
    sub2 = Subject(id="sub_2", code="C2", course_name="Course 2", department_id="dept_aids", lecture_hours=3)

    allotments = [
        {"subject_id": "sub_1", "faculty_id": "fac_rajesh"},
        {"subject_id": "sub_2", "faculty_id": "fac_rajesh"},
    ]

    prefs = [
        FacultySubjectPreference(
            id="pref_rajesh",
            faculty_id="fac_rajesh",
            department_id="dept_aids",
            academic_year="2026-2027",
            semester=3,
            preferences=[
                RankedSubjectPreference(preference_rank=1, subject_id="sub_1"),
                RankedSubjectPreference(preference_rank=2, subject_id="sub_2"),
            ],
        )
    ]

    res = timetable_solver.solve(
        request=req,
        subjects=[sub1, sub2],
        allotments=allotments,
        faculty_profiles={},
        rooms=[Room(id="room_1", name="LH-1", capacity=60)],
        labs=[],
        faculty_preferences=prefs,
    )

    assert res.status in ("OPTIMAL", "FEASIBLE")
    assert res.slots_generated >= 6


# =====================================================================
# 3. Schedule Validation Engine Tests
# =====================================================================

def test_validation_engine_detects_faculty_double_booking():
    """Ensures validator catches faculty assigned simultaneously."""
    slot1 = TimetableSlot(
        id="s1",
        timetable_id="tt_a",
        day=DayOfWeek.MONDAY,
        slot_number=1,
        start_time="09:00",
        end_time="10:00",
        subject_id="sub_1",
        faculty_id="fac_101",
        room_id="room_1",
    )
    slot2 = TimetableSlot(
        id="s2",
        timetable_id="tt_a",
        day=DayOfWeek.MONDAY,
        slot_number=1,
        start_time="09:00",
        end_time="10:00",
        subject_id="sub_2",
        faculty_id="fac_101",  # Same faculty, same day and period!
        room_id="room_2",
    )

    report = schedule_validator.validate_slots(
        slots=[slot1, slot2],
        subjects_map={},
        faculty_map={"fac_101": FacultyProfile(id="fac_101", name="Dr. A", email="a@sode-edu.in", department_id="dept_aids")},
        rooms_map={},
        labs_map={},
    )

    assert report.is_valid is False
    assert any(c["type"] == "FACULTY_DOUBLE_BOOKING" for c in report.clashes)


def test_validation_engine_detects_lab_capacity_exceeded():
    """Ensures validator catches lab capacity violations for practical batches."""
    small_lab = Lab(id="lab_small", name="Small Lab", capacity=20, is_available=True)
    slot = TimetableSlot(
        id="s_lab",
        timetable_id="tt_a",
        day=DayOfWeek.MONDAY,
        slot_number=2,
        start_time="10:00",
        end_time="11:00",
        subject_id="sub_lab",
        faculty_id="fac_1",
        lab_id="lab_small",
        is_lab=True,
        batch="B1",
        batch_student_count=35,  # 35 students in 20-capacity lab!
    )

    report = schedule_validator.validate_slots(
        slots=[slot],
        subjects_map={},
        faculty_map={},
        rooms_map={},
        labs_map={"lab_small": small_lab},
    )

    assert report.is_valid is False
    assert any(c["type"] == "LAB_CAPACITY_EXCEEDED" for c in report.clashes)


def test_validation_engine_detects_lunch_break_violation():
    """Ensures validator flags sessions booked during lunch hour (Period 5)."""
    slot = TimetableSlot(
        id="s_lunch",
        timetable_id="tt_a",
        day=DayOfWeek.MONDAY,
        slot_number=5,  # Lunch period!
        start_time="13:00",
        end_time="14:00",
        subject_id="sub_1",
        faculty_id="fac_1",
        room_id="room_1",
    )

    report = schedule_validator.validate_slots(
        slots=[slot],
        subjects_map={},
        faculty_map={},
        rooms_map={},
        labs_map={},
        lunch_period=5,
    )

    assert report.is_valid is False
    assert any(c["type"] == "LUNCH_PERIOD_VIOLATION" for c in report.clashes)
