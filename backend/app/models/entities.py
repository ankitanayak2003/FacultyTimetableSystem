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
plus facultyPreferences.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, field_validator, model_validator

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
    DEAN = "DEAN"
    PRINCIPAL = "PRINCIPAL"
    HOD = "HOD"
    DEPARTMENT_COORDINATOR = "DEPARTMENT_COORDINATOR"
    BASIC_SCIENCE_COORDINATOR = "BASIC_SCIENCE_COORDINATOR"
    FACULTY = "FACULTY"
    STUDENT_VIEWER = "STUDENT_VIEWER"


class FacultyDesignation(str, Enum):
    PROFESSOR = "Professor"
    ASSOCIATE_PROFESSOR = "Associate Professor"
    ASSISTANT_PROFESSOR = "Assistant Professor"
    HOD = "HOD"
    HEAD_OF_DEPARTMENT = "Head of Department"
    ADJUNCT_FACULTY = "Adjunct Faculty"
    VISITING_FACULTY = "Visiting Faculty"


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
    NETWORKS_LAB = "NETWORKS_LAB"
    IOT_LAB = "IOT_LAB"
    PHYSICS_LAB = "PHYSICS_LAB"
    CHEMISTRY_LAB = "CHEMISTRY_LAB"
    MECHANICAL_LAB = "MECHANICAL_LAB"
    CIVIL_LAB = "CIVIL_LAB"
    WORKSHOP = "WORKSHOP"
    ELECTRONICS_LAB = "ELECTRONICS_LAB"
    GENERAL_LAB = "GENERAL_LAB"
    AI_LAB = "AI_LAB"
    CAD_LAB = "CAD_LAB"
    CENTRAL_LAB = "CENTRAL_LAB"
    PROJECT_LAB = "PROJECT_LAB"


class DayOfWeek(str, Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"


class TimetableStatus(str, Enum):
    DRAFT = "DRAFT"
    FINALIZED = "FINALIZED"
    LOCKED = "LOCKED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class SemesterType(str, Enum):
    ODD = "ODD"
    EVEN = "EVEN"


class SourceType(str, Enum):
    VTU_OFFICIAL = "VTU_OFFICIAL"
    SODE_OFFICIAL = "SODE_OFFICIAL"
    EXCEL = "EXCEL"
    INFERRED = "INFERRED"
    PLACEHOLDER = "PLACEHOLDER"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    INFERRED = "INFERRED"
    UNVERIFIED = "UNVERIFIED"
    MISSING = "MISSING"


# =====================================================================
# 1. Users Collection Model
# =====================================================================

class RoleAssignment(BaseModel):
    role: UserRole
    department_id: Optional[str] = None


class User(BaseModel):
    id: str = Field(description="Unique User ID / Firebase Auth UID")
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address or placeholder")
    display_name: str = Field(min_length=1, max_length=100)
    role: UserRole = UserRole.STUDENT_VIEWER
    department_id: Optional[str] = None
    roles: List[UserRole] = Field(default_factory=list)
    role_assignments: List[RoleAssignment] = Field(default_factory=list)
    is_active: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 2. Faculty Collection Model
# =====================================================================

class FacultyProfile(BaseModel):
    id: str = Field(description="Unique Faculty Identifier, e.g. fac_dept_aids_dr_tejaswini_h")
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=EMAIL_REGEX, description="Valid email address or placeholder")
    department_id: str = Field(min_length=2, max_length=50)
    designation: FacultyDesignation = FacultyDesignation.ASSISTANT_PROFESSOR
    max_weekly_hours: int = Field(default=16, ge=4, le=40)
    min_weekly_hours: int = Field(default=12, ge=0, le=24)
    specializations: List[str] = Field(default_factory=list)
    is_placeholder: bool = False
    data_status: str = "COMPLETE"
    notes: Optional[str] = None
    has_login_access: bool = False
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
    id: str = Field(description="Unique stable Subject ID, independent of course code")
    code: Optional[str] = Field(default=None, max_length=20, description="Optional VTU Course Code")
    course_name: Optional[str] = Field(default=None, min_length=1, max_length=150, description="Subject / Course name")
    title: Optional[str] = Field(default=None, min_length=1, max_length=150, description="Alias for course_name")
    department_id: Optional[str] = Field(default=None, max_length=50)
    semester: int = Field(default=3, ge=1, le=8)
    credits: int = Field(default=3, ge=0, le=10)
    course_type: Optional[str] = Field(default="Theory", description="Theory, IPCC, PCC, PCCL, Integrated, Practical, etc.")
    subject_type: Optional[SubjectType] = None
    weekly_hours: int = Field(default=3, ge=0, le=20)
    l_t_p: Optional[str] = Field(default=None, description="L:T:P format, e.g. 3:0:2")
    lecture_hours: Optional[int] = Field(default=None, ge=0)
    tutorial_hours: Optional[int] = Field(default=None, ge=0)
    practical_hours: Optional[int] = Field(default=None, ge=0)
    is_lab: bool = False
    lab_batch_count: int = Field(default=1, ge=1, le=4)
    academic_scheme: Optional[str] = "VTU Autonomous 2022/2025 Scheme"
    is_ipcc: bool = False
    requires_lab: bool = False
    requires_batch_split: bool = False
    source_type: SourceType = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = Field(default_factory=utc_now_iso)
    verification_notes: Optional[str] = None
    is_placeholder: bool = False
    data_status: str = "COMPLETE"
    is_active: bool = True
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @model_validator(mode="before")
    @classmethod
    def sync_subject_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 1. Sync course_name and title
            name = data.get("course_name") or data.get("title") or data.get("name")
            if name:
                data["course_name"] = name
                data["title"] = name

            # 2. Sync course_type
            ctype = data.get("course_type") or data.get("subject_type")
            if ctype:
                data["course_type"] = str(ctype)
                if str(ctype).upper() in ("LAB", "SUBJECTTYPE.LAB", "PCCL"):
                    data["is_lab"] = True
                elif "IPCC" in str(ctype).upper():
                    data["is_lab"] = True

            # 3. Parse L:T:P if provided
            ltp = data.get("l_t_p")
            if ltp and isinstance(ltp, str) and ":" in ltp:
                parts = ltp.split(":")
                if len(parts) == 3:
                    try:
                        l, t, p = int(parts[0]), int(parts[1]), int(parts[2])
                        if "lecture_hours" not in data or data["lecture_hours"] is None:
                            data["lecture_hours"] = l
                        if "tutorial_hours" not in data or data["tutorial_hours"] is None:
                            data["tutorial_hours"] = t
                        if "practical_hours" not in data or data["practical_hours"] is None:
                            data["practical_hours"] = p
                        if p > 0:
                            data["is_lab"] = True
                        if "weekly_hours" not in data or not data["weekly_hours"]:
                            data["weekly_hours"] = max(1, l + t + p)
                    except ValueError:
                        pass
        return data


# =====================================================================
# 4. Rooms Collection Model
# =====================================================================

class Room(BaseModel):
    id: str = Field(description="e.g. room_ab04")
    name: str = Field(min_length=1, max_length=50)
    room_type: RoomType = RoomType.CLASSROOM
    capacity: int = Field(default=60, ge=10, le=300)
    building_or_block: Optional[str] = None
    department_id: Optional[str] = None
    is_available: bool = True
    availability_status: str = "AVAILABLE"  # AVAILABLE, UNAVAILABLE, MAINTENANCE
    is_external: bool = False
    location: Optional[str] = None
    notes: Optional[str] = None
    source_type: SourceType = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = Field(default_factory=utc_now_iso)
    verification_notes: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 4b. Fixed Classrooms Collection Model (Provisional & Replaceable)
# =====================================================================

class FixedClassroomAssignment(BaseModel):
    id: str = Field(description="e.g. fcr_2026-2027_dept_aids_sem3_a")
    department_id: str
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    student_year: Optional[str] = None  # Second Year, Third Year, Fourth Year
    section: str = Field(min_length=1, max_length=5)
    classroom_id: str = Field(description="e.g. classroom_dept_aids_year2_section_a (provisional) or actual room ID")
    classroom_name: str = Field(description="e.g. Provisional Classroom (AIDS 3rd Sem Sec A)")
    allocation_status: str = Field(default="PROVISIONAL", description="PROVISIONAL, CONFIRMED, or PLACEHOLDER")
    is_provisional: bool = True
    capacity: int = Field(default=60)
    notes: Optional[str] = "Provisional fixed classroom assignment pending official institutional allocation"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 5. Labs Collection Model
# =====================================================================

class Lab(BaseModel):
    id: str = Field(description="e.g. lab_ai_data_analytic_lab")
    name: str = Field(min_length=1, max_length=100)
    room_no: Optional[str] = None
    lab_type: LabType = LabType.COMPUTER_LAB
    capacity: int = Field(default=30, ge=5, le=120)
    workstations_count: int = Field(default=30, ge=0, le=120)
    department_id: str = "dept_general"
    building_or_block: Optional[str] = None
    is_available: bool = True
    availability_status: str = "AVAILABLE"  # AVAILABLE, UNAVAILABLE, EXTERNAL, MAINTENANCE
    is_external: bool = False
    external_venue_name: Optional[str] = None
    location: Optional[str] = None
    equipment: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    source_type: SourceType = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = Field(default_factory=utc_now_iso)
    verification_notes: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# Practical Batch Structure
# =====================================================================

class PracticalBatch(BaseModel):
    batch_id: str = Field(description="e.g. B1, B2")
    student_count: int = Field(default=30, ge=1, le=120)
    faculty_id: Optional[str] = None
    lab_id: Optional[str] = None


# =====================================================================
# 6. Allotments Collection Model
# =====================================================================

class Allotment(BaseModel):
    id: str = Field(description="e.g. alt_2026_odd_21cs51_a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$", description="e.g. 2026-2027")
    semester: int = Field(ge=1, le=8)
    student_year: Optional[str] = None
    department_id: Optional[str] = None
    subject_id: str = Field(description="References subjects.id")
    faculty_id: str = Field(description="References faculty.id")
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    section: str = Field(min_length=1, max_length=5, description="e.g. A, B, C")
    weekly_hours_allocated: int = Field(ge=1, le=24)
    allocated_hours: Optional[int] = None
    is_practical: bool = False
    total_students: Optional[int] = 60
    batch_count: int = 1
    batches: List[PracticalBatch] = Field(default_factory=list)
    practical_duration_slots: int = 2
    is_locked: bool = Field(default=False, description="Dean or Admin locked institutional allotment")
    locked_by: Optional[str] = Field(default=None, description="UID / role of Dean/Admin who locked")
    lock_reason: Optional[str] = Field(default=None, description="Reason for lock by Dean")
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @model_validator(mode="before")
    @classmethod
    def sync_allotment_hours(cls, data: Any) -> Any:
        if isinstance(data, dict):
            hours = data.get("allocated_hours") or data.get("weekly_hours_allocated")
            if hours is not None:
                data["weekly_hours_allocated"] = hours
                data["allocated_hours"] = hours
        return data


# =====================================================================
# 7. Timetables Collection Model
# =====================================================================

class Timetable(BaseModel):
    id: str = Field(description="e.g. tt_2026_odd_cse_5a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: Optional[SemesterType] = SemesterType.ODD
    department_id: Optional[str] = Field(default=None, description="Optional for First Year mixed batches")
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    status: TimetableStatus = TimetableStatus.DRAFT
    generation_status: str = "PENDING"  # PENDING, GENERATED, VALIDATED, INFEASIBLE
    validation_errors: List[str] = Field(default_factory=list)
    solver_diagnostics: Optional[Dict[str, Any]] = None
    is_active: bool = True
    version: int = 1
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 8. TimetableSlots Collection Model
# =====================================================================

class TimetableSlot(BaseModel):
    id: str = Field(description="e.g. slot_tt5a_mon_1")
    timetable_id: str = Field(description="References timetables.id")
    day: DayOfWeek
    slot_number: int = Field(default=1, ge=1, le=8, description="Period slot 1 to 8")
    period: Optional[int] = Field(default=None, ge=1, le=8)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 09:00")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 10:00")
    subject_id: str = Field(description="References subjects.id")
    faculty_id: str = Field(description="References faculty.id")
    room_id: Optional[str] = Field(default=None, description="References rooms.id")
    lab_id: Optional[str] = Field(default=None, description="References labs.id")
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    room_name: Optional[str] = None
    section: Optional[str] = None
    department_id: Optional[str] = None
    is_locked: bool = False
    locked_by: Optional[str] = None
    lock_reason: Optional[str] = None
    is_lab: bool = False
    is_practical: bool = False
    is_external_lab: bool = False
    batch: Optional[str] = Field(default=None, description="e.g. B1, B2 or None for whole class")
    batch_id: Optional[str] = None
    batch_student_count: Optional[int] = None
    duration_slots: int = 1
    practical_session_id: Optional[str] = None
    allocation_status: str = "SCHEDULED"  # SCHEDULED, PENDING_LAB_ALLOCATION, UNAVAILABLE
    allocation_notes: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @model_validator(mode="before")
    @classmethod
    def sync_slot_period(cls, data: Any) -> Any:
        if isinstance(data, dict):
            slot = data.get("slot_number") or data.get("period")
            if slot is not None:
                data["slot_number"] = slot
                data["period"] = slot
            if "is_practical" in data and "is_lab" not in data:
                data["is_lab"] = data["is_practical"]
        return data


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
    max_allowed_hours: int = Field(ge=4, le=40)
    is_overloaded: bool = False
    allotment_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 10. Faculty Preferences Collection Model
# =====================================================================

class PreferenceStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    HOD_MODIFIED = "HOD_MODIFIED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    FINALIZED = "FINALIZED"


class RankedSubjectPreference(BaseModel):
    preference_rank: int = Field(ge=1, le=3, description="Priority rank: 1 (highest), 2, 3")
    subject_id: str = Field(description="References subjects.id")
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    notes: Optional[str] = None


class FacultySubjectPreference(BaseModel):
    id: str = Field(description="e.g. pref_2026-2027_5_fac_cse_01")
    faculty_id: str = Field(description="References faculty.id")
    faculty_name: Optional[str] = None
    department_id: str
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    preferences: List[RankedSubjectPreference] = Field(
        default_factory=list,
        description="Up to 3 ranked subject preferences",
    )
    status: PreferenceStatus = PreferenceStatus.DRAFT
    hod_comments: Optional[str] = None
    hod_modified_preferences: Optional[List[RankedSubjectPreference]] = None
    finalized_by: Optional[str] = None
    finalized_at: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @field_validator("preferences")
    @classmethod
    def validate_preferences_count_and_ranks(cls, v: List[RankedSubjectPreference]) -> List[RankedSubjectPreference]:
        if len(v) > 3:
            raise ValueError("Faculty can submit at most 3 ranked subject preferences.")
        ranks = [p.preference_rank for p in v]
        if len(ranks) != len(set(ranks)):
            raise ValueError("Preference ranks must be distinct (1, 2, 3).")
        return v


# =====================================================================
# 11. Departments Collection Model
# =====================================================================

class Department(BaseModel):
    id: str = Field(description="Deterministic department ID e.g. dept_aids")
    name: str = Field(description="Official department name")
    code: str = Field(description="Short department code e.g. AIDS")
    aliases: List[str] = Field(default_factory=list)
    category: str = Field(default="ENGINEERING_PROGRAM", description="ENGINEERING_PROGRAM, BASIC_SCIENCE, INSTITUTIONAL_SUPPORT, INSTITUTIONAL_ADMIN")
    is_academic_program: bool = True
    hod_faculty_id: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 12. Academic Years Collection Model
# =====================================================================

class AcademicYear(BaseModel):
    id: str = Field(description="e.g. ay_2026_2027")
    name: str = Field(description="e.g. 2026-2027")
    start_year: int = 2026
    end_year: int = 2027
    is_current: bool = True
    current_term: SemesterType = SemesterType.ODD
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 13. Sections Collection Model
# =====================================================================

class Section(BaseModel):
    id: str = Field(description="e.g. sec_2026_aids_sem3_a")
    department_id: Optional[str] = Field(default=None, description="Optional for First Year mixed batches")
    academic_year: str = "2026-2027"
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    student_year: Optional[str] = None
    student_count: int = Field(default=60, ge=1)
    batch_count: int = Field(default=2, ge=1)
    fixed_classroom_id: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 14. Institutional Assignments Collection Model (Dean Locked)
# =====================================================================

class InstitutionalAssignment(BaseModel):
    id: str = Field(description="e.g. inst_2026_odd_dean_assign_01")
    academic_year: str = "2026-2027"
    semester: int = Field(ge=1, le=8)
    department_id: str
    subject_id: str
    faculty_id: str
    section: str
    allocated_hours: int = 3
    is_locked: bool = True
    locked_by: Optional[str] = "Dr. Sudarshan Rao (Dean Academics)"
    locked_at: Optional[str] = Field(default_factory=utc_now_iso)
    lock_reason: Optional[str] = "Institutional academic assignment locked by Dean"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 15. Lab Batches Collection Model
# =====================================================================

class LabBatchRecord(BaseModel):
    id: str = Field(description="e.g. batch_2026_aids_sem3_a_b1")
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: str
    batch_name: str  # B1, B2
    student_count: int = 30
    subject_id: Optional[str] = None
    lab_id: Optional[str] = None
    faculty_id: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# =====================================================================
# 16. Generation Runs Collection Model (Solver Audit)
# =====================================================================

class GenerationRun(BaseModel):
    id: str = Field(description="e.g. run_20261123_aids_sem3")
    academic_year: str = "2026-2027"
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: Optional[str] = None
    status: str = "COMPLETED"  # RUNNING, COMPLETED, FAILED
    solver_status: str = "OPTIMAL"  # OPTIMAL, FEASIBLE, INFEASIBLE
    wall_time_seconds: float = 0.0
    conflicts_detected: int = 0
    generated_slots_count: int = 0
    timetable_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
