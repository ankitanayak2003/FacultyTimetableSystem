"""
Unit tests for domain model validation.
Tests constraints, value ranges, enum validity, and VTU academic rules.
"""

import pytest
from pydantic import ValidationError
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
)


def test_user_model_valid():
    user = User(
        id="usr_coord_01",
        email="coordinator@vtu.college.edu",
        display_name="Dr. Suresh Rao",
        role=UserRole.DEPARTMENT_COORDINATOR,
        department_id="dept_cse",
    )
    assert user.id == "usr_coord_01"
    assert user.role == UserRole.DEPARTMENT_COORDINATOR
    assert user.created_at is not None


def test_user_model_invalid_email_and_role():
    with pytest.raises(ValidationError):
        User(id="usr_02", email="not-an-email", display_name="Test User")

    with pytest.raises(ValidationError):
        User(id="usr_03", email="user@college.edu", display_name="Test", role="SUPER_COORDINATOR")


def test_faculty_profile_valid():
    fac = FacultyProfile(
        id="fac_cse_01",
        name="Dr. Ananya Sharma",
        email="ananya.cse@college.edu",
        department_id="dept_cse",
        designation=FacultyDesignation.ASSOCIATE_PROFESSOR,
        max_weekly_hours=16,
        min_weekly_hours=12,
        specializations=["Algorithms", "Machine Learning"],
    )
    assert fac.max_weekly_hours == 16
    assert fac.is_active is True


def test_faculty_profile_min_hours_cannot_exceed_max():
    with pytest.raises(ValidationError) as exc_info:
        FacultyProfile(
            id="fac_cse_02",
            name="Dr. Rajesh",
            email="rajesh@college.edu",
            department_id="dept_cse",
            designation=FacultyDesignation.ASSISTANT_PROFESSOR,
            max_weekly_hours=14,
            min_weekly_hours=18,  # Invalid: min > max
        )
    assert "cannot exceed max_weekly_hours" in str(exc_info.value)


def test_subject_model_validation():
    sub = Subject(
        id="21CS51",
        code="21CS51",
        title="Management and Entrepreneurship",
        department_id="dept_cse",
        semester=5,
        credits=3,
        subject_type=SubjectType.THEORY,
        weekly_hours=4,
    )
    assert sub.semester == 5
    assert sub.credits == 3

    # Semester out of range (1-8)
    with pytest.raises(ValidationError):
        Subject(
            id="bad_sub",
            code="BAD",
            title="Bad",
            department_id="cse",
            semester=9,
            credits=3,
            weekly_hours=3,
        )


def test_room_and_lab_model_validation():
    room = Room(id="room_lh201", name="Lecture Hall 201", capacity=70)
    assert room.room_type == RoomType.CLASSROOM
    assert room.capacity == 70

    lab = Lab(
        id="lab_cse_01",
        name="Advanced Computing Lab",
        lab_type=LabType.COMPUTER_LAB,
        capacity=35,
        workstations_count=35,
        department_id="dept_cse",
    )
    assert lab.workstations_count == 35

    # Invalid negative capacity
    with pytest.raises(ValidationError):
        Room(id="bad_room", name="Bad Room", capacity=0)


def test_allotment_model_validation():
    alt = Allotment(
        id="alt_2026_odd_21cs51_a",
        academic_year="2026-2027",
        semester=5,
        department_id="dept_cse",
        subject_id="21CS51",
        faculty_id="fac_cse_01",
        section="A",
        weekly_hours_allocated=4,
    )
    assert alt.academic_year == "2026-2027"

    # Invalid academic year format
    with pytest.raises(ValidationError):
        Allotment(
            id="alt_bad",
            academic_year="26-27",
            semester=5,
            department_id="dept_cse",
            subject_id="21CS51",
            faculty_id="fac_cse_01",
            section="A",
            weekly_hours_allocated=4,
        )


def test_timetable_and_slot_validation():
    tt = Timetable(
        id="tt_2026_odd_cse_5a",
        academic_year="2026-2027",
        semester_type=SemesterType.ODD,
        department_id="dept_cse",
        semester=5,
        section="A",
    )
    assert tt.status == TimetableStatus.DRAFT

    slot = TimetableSlot(
        id="slot_01",
        timetable_id="tt_2026_odd_cse_5a",
        day=DayOfWeek.MONDAY,
        slot_number=1,
        start_time="09:00",
        end_time="10:00",
        subject_id="21CS51",
        faculty_id="fac_cse_01",
        room_id="room_lh201",
    )
    assert slot.slot_number == 1

    # Invalid time format
    with pytest.raises(ValidationError):
        TimetableSlot(
            id="bad_slot",
            timetable_id="tt_2026_odd_cse_5a",
            day=DayOfWeek.MONDAY,
            slot_number=1,
            start_time="9am",
            end_time="10am",
            subject_id="21CS51",
            faculty_id="fac_cse_01",
            room_id="room_lh201",
        )


def test_workload_record_validation():
    wl = WorkloadRecord(
        id="wl_2026_odd_fac01",
        academic_year="2026-2027",
        semester_type=SemesterType.ODD,
        faculty_id="fac_cse_01",
        department_id="dept_cse",
        total_theory_hours=12.0,
        total_lab_hours=4.0,
        total_hours=16.0,
        max_allowed_hours=16,
        is_overloaded=False,
        allotment_ids=["alt_01", "alt_02"],
    )
    assert wl.total_hours == 16.0
    assert wl.is_overloaded is False
