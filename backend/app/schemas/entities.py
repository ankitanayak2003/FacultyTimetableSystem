"""
Request and Response validation schemas for all 9 Firestore collections.
Provides separate Create, Update, and Response definitions.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.entities import (
    UserRole,
    FacultyDesignation,
    SubjectType,
    RoomType,
    LabType,
    DayOfWeek,
    TimetableStatus,
    SemesterType,
    EMAIL_REGEX,
)


# =====================================================================
# 1. User Schemas
# =====================================================================

class UserCreate(BaseModel):
    id: str = Field(min_length=3, max_length=128, description="User ID or Firebase Auth UID")
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address")
    display_name: str = Field(min_length=2, max_length=100)
    role: UserRole = UserRole.STUDENT_VIEWER
    department_id: Optional[str] = None
    is_active: bool = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    department_id: Optional[str] = None
    is_active: Optional[bool] = None


# =====================================================================
# 2. Faculty Schemas
# =====================================================================

class FacultyCreate(BaseModel):
    id: str = Field(min_length=3, max_length=50, description="e.g. fac_cse_01")
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address")
    department_id: str = Field(min_length=2, max_length=50)
    designation: FacultyDesignation
    max_weekly_hours: int = Field(default=16, ge=4, le=32)
    min_weekly_hours: int = Field(default=12, ge=0, le=24)
    specializations: List[str] = Field(default_factory=list)
    is_active: bool = True


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[str] = Field(default=None, pattern=EMAIL_REGEX)
    department_id: Optional[str] = None
    designation: Optional[FacultyDesignation] = None
    max_weekly_hours: Optional[int] = Field(default=None, ge=4, le=32)
    min_weekly_hours: Optional[int] = Field(default=None, ge=0, le=24)
    specializations: Optional[List[str]] = None
    is_active: Optional[bool] = None


# =====================================================================
# 3. Subject Schemas
# =====================================================================

class SubjectCreate(BaseModel):
    id: str = Field(min_length=3, max_length=20, description="e.g. 21CS51")
    code: str = Field(min_length=3, max_length=15)
    title: str = Field(min_length=2, max_length=150)
    department_id: str
    semester: int = Field(ge=1, le=8)
    credits: int = Field(ge=1, le=6)
    subject_type: SubjectType = SubjectType.THEORY
    weekly_hours: int = Field(ge=1, le=10)
    preferred_room_type: str = Field(default="CLASSROOM")


class SubjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    department_id: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=8)
    credits: Optional[int] = Field(default=None, ge=1, le=6)
    subject_type: Optional[SubjectType] = None
    weekly_hours: Optional[int] = Field(default=None, ge=1, le=10)
    preferred_room_type: Optional[str] = None


# =====================================================================
# 4. Room Schemas
# =====================================================================

class RoomCreate(BaseModel):
    id: str = Field(min_length=3, max_length=50, description="e.g. room_lh301")
    name: str = Field(min_length=2, max_length=50)
    room_type: RoomType = RoomType.CLASSROOM
    capacity: int = Field(default=60, ge=10, le=300)
    department_id: Optional[str] = None
    is_available: bool = True


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = Field(default=None, ge=10, le=300)
    department_id: Optional[str] = None
    is_available: Optional[bool] = None


# =====================================================================
# 5. Lab Schemas
# =====================================================================

class LabCreate(BaseModel):
    id: str = Field(min_length=3, max_length=50, description="e.g. lab_cse_01")
    name: str = Field(min_length=2, max_length=50)
    lab_type: LabType = LabType.COMPUTER_LAB
    capacity: int = Field(default=30, ge=5, le=120)
    workstations_count: int = Field(default=30, ge=0, le=120)
    department_id: str
    is_available: bool = True


class LabUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    lab_type: Optional[LabType] = None
    capacity: Optional[int] = Field(default=None, ge=5, le=120)
    workstations_count: Optional[int] = Field(default=None, ge=0, le=120)
    department_id: Optional[str] = None
    is_available: Optional[bool] = None


# =====================================================================
# 6. Allotment Schemas
# =====================================================================

class AllotmentCreate(BaseModel):
    id: str = Field(min_length=3, max_length=100, description="e.g. alt_2026_odd_21cs51_a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    department_id: str
    subject_id: str
    faculty_id: str
    section: str = Field(min_length=1, max_length=5)
    weekly_hours_allocated: int = Field(ge=1, le=12)


class AllotmentUpdate(BaseModel):
    subject_id: Optional[str] = None
    faculty_id: Optional[str] = None
    section: Optional[str] = Field(default=None, min_length=1, max_length=5)
    weekly_hours_allocated: Optional[int] = Field(default=None, ge=1, le=12)


# =====================================================================
# 7. Timetable Schemas
# =====================================================================

class TimetableCreate(BaseModel):
    id: str = Field(min_length=3, max_length=100, description="e.g. tt_2026_odd_cse_5a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: SemesterType = SemesterType.ODD
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    status: TimetableStatus = TimetableStatus.DRAFT


class TimetableUpdate(BaseModel):
    status: Optional[TimetableStatus] = None


# =====================================================================
# 8. TimetableSlot Schemas
# =====================================================================

class TimetableSlotCreate(BaseModel):
    id: str = Field(min_length=3, max_length=100, description="e.g. slot_tt5a_mon_1")
    timetable_id: str
    day: DayOfWeek
    slot_number: int = Field(ge=1, le=8)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    subject_id: str
    faculty_id: str
    room_id: str
    is_lab: bool = False
    batch: Optional[str] = None


class TimetableSlotUpdate(BaseModel):
    day: Optional[DayOfWeek] = None
    slot_number: Optional[int] = Field(default=None, ge=1, le=8)
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    subject_id: Optional[str] = None
    faculty_id: Optional[str] = None
    room_id: Optional[str] = None
    is_lab: Optional[bool] = None
    batch: Optional[str] = None


# =====================================================================
# 9. WorkloadRecord Schemas
# =====================================================================

class WorkloadRecordCreate(BaseModel):
    id: str = Field(min_length=3, max_length=100, description="e.g. wl_2026_odd_fac01")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: SemesterType = SemesterType.ODD
    faculty_id: str
    department_id: str
    total_theory_hours: Optional[float] = Field(default=0.0, ge=0.0)
    total_lab_hours: Optional[float] = Field(default=0.0, ge=0.0)
    total_hours: Optional[float] = Field(default=0.0, ge=0.0)
    max_allowed_hours: Optional[int] = Field(default=16, ge=4, le=32)
    is_overloaded: bool = False
    allotment_ids: List[str] = Field(default_factory=list)


class WorkloadRecordUpdate(BaseModel):
    total_theory_hours: Optional[float] = Field(default=None, ge=0.0)
    total_lab_hours: Optional[float] = Field(default=None, ge=0.0)
    total_hours: Optional[float] = Field(default=None, ge=0.0)
    max_allowed_hours: Optional[int] = Field(default=None, ge=4, le=32)
    is_overloaded: Optional[bool] = None
    allotment_ids: Optional[List[str]] = None
