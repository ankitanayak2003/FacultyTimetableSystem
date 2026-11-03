"""
Entity definitions for the VTU Engineering College Timetable & Workload System.
These models describe documents stored in the 9 Firebase Cloud Firestore collections:
1. users
2. faculty
3. subjects
4. rooms
5. labs
6. allotments
7. timetables
8. timetableSlots
9. workloadRecords
"""

from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


def utc_now_iso() -> str:
    """Returns current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


# =====================================================================
# Domain Enumerations
# =====================================================================

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CHIEF_COORDINATOR = "CHIEF_COORDINATOR"
    HOD = "HOD"
    DEPARTMENT_COORDINATOR = "DEPARTMENT_COORDINATOR"
    FACULTY = "FACULTY"
    STUDENT_VIEWER = "STUDENT_VIEWER"


class FacultyDesignation(str, Enum):
    PROFESSOR = "Professor"
    ASSOCIATE_PROFESSOR = "Associate Professor"
    ASSISTANT_PROFESSOR = "Assistant Professor"
    HOD = "Head of Department"
    ADJUNCT_FACULTY = "Adjunct Faculty"


class SubjectType(str, Enum):
    THEORY = "THEORY"
    LAB = "LAB"
    PROJECT = "PROJECT"
    SEMINAR = "SEMINAR"


class RoomType(str, Enum):
    CLASSROOM = "CLASSROOM"
    SEMINAR_HALL = "SEMINAR_HALL"


class LabType(str, Enum):
    COMPUTER_LAB = "COMPUTER_LAB"
    HARDWARE_LAB = "HARDWARE_LAB"
    NETWORK_LAB = "NETWORK_LAB"
    IOT_LAB = "IOT_LAB"


class DayOfWeek(str, Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"


class TimetableStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class SemesterType(str, Enum):
    ODD = "ODD"
    EVEN = "EVEN"


# =====================================================================
# 1. Users Collection Model
# =====================================================================

class User(BaseModel):
    id: str = Field(description="Unique User ID / Firebase Auth UID")
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address")
    display_name: str = Field(min_length=2, max_length=100)
    role: UserRole = UserRole.STUDENT_VIEWER
    department_id: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 2. Faculty Collection Model
# =====================================================================

class FacultyProfile(BaseModel):
    id: str = Field(description="Unique Faculty Identifier, e.g. fac_cse_01")
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address")
    department_id: str = Field(min_length=2, max_length=50)
    designation: FacultyDesignation
    max_weekly_hours: int = Field(default=16, ge=4, le=32)
    min_weekly_hours: int = Field(default=12, ge=0, le=24)
    specializations: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @field_validator("min_weekly_hours")
    @classmethod
    def validate_min_hours(cls, v: int, info) -> int:
        max_h = info.data.get("max_weekly_hours", 16)
        if v > max_h:
            raise ValueError(f"min_weekly_hours ({v}) cannot exceed max_weekly_hours ({max_h})")
        return v


# =====================================================================
# 3. Subjects Collection Model
# =====================================================================

class Subject(BaseModel):
    id: str = Field(description="Course code as ID, e.g. 21CS51")
    code: str = Field(min_length=3, max_length=15, description="VTU Course Code")
    title: str = Field(min_length=2, max_length=150)
    department_id: str
    semester: int = Field(ge=1, le=8)
    credits: int = Field(ge=1, le=6)
    subject_type: SubjectType = SubjectType.THEORY
    weekly_hours: int = Field(ge=1, le=10)
    preferred_room_type: str = Field(default="CLASSROOM")
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 4. Rooms Collection Model
# =====================================================================

class Room(BaseModel):
    id: str = Field(description="e.g. room_lh301")
    name: str = Field(min_length=2, max_length=50)
    room_type: RoomType = RoomType.CLASSROOM
    capacity: int = Field(default=60, ge=10, le=300)
    department_id: Optional[str] = None
    is_available: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 5. Labs Collection Model
# =====================================================================

class Lab(BaseModel):
    id: str = Field(description="e.g. lab_cse_01")
    name: str = Field(min_length=2, max_length=50)
    lab_type: LabType = LabType.COMPUTER_LAB
    capacity: int = Field(default=30, ge=5, le=120)
    workstations_count: int = Field(default=30, ge=0, le=120)
    department_id: str
    is_available: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 6. Allotments Collection Model
# =====================================================================

class Allotment(BaseModel):
    id: str = Field(description="e.g. alt_2026_odd_21cs51_a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$", description="e.g. 2026-2027")
    semester: int = Field(ge=1, le=8)
    department_id: str
    subject_id: str = Field(description="References subjects.id")
    faculty_id: str = Field(description="References faculty.id")
    section: str = Field(min_length=1, max_length=5, description="e.g. A, B, C")
    weekly_hours_allocated: int = Field(ge=1, le=12)
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 7. Timetables Collection Model
# =====================================================================

class Timetable(BaseModel):
    id: str = Field(description="e.g. tt_2026_odd_cse_5a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: SemesterType = SemesterType.ODD
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    status: TimetableStatus = TimetableStatus.DRAFT
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 8. TimetableSlots Collection Model
# =====================================================================

class TimetableSlot(BaseModel):
    id: str = Field(description="e.g. slot_tt5a_mon_1")
    timetable_id: str = Field(description="References timetables.id")
    day: DayOfWeek
    slot_number: int = Field(ge=1, le=8, description="Period slot 1 to 8")
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 09:00")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 10:00")
    subject_id: str = Field(description="References subjects.id")
    faculty_id: str = Field(description="References faculty.id")
    room_id: str = Field(description="References rooms.id or labs.id")
    is_lab: bool = False
    batch: Optional[str] = Field(default=None, description="e.g. B1, B2 or None for whole class")
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 9. WorkloadRecords Collection Model
# =====================================================================

class WorkloadRecord(BaseModel):
    id: str = Field(description="e.g. wl_2026_odd_fac01")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: SemesterType = SemesterType.ODD
    faculty_id: str = Field(description="References faculty.id")
    department_id: str
    total_theory_hours: float = Field(ge=0.0)
    total_lab_hours: float = Field(ge=0.0)
    total_hours: float = Field(ge=0.0)
    max_allowed_hours: int = Field(ge=4, le=32)
    is_overloaded: bool = False
    allotment_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
