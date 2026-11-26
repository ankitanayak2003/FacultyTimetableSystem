"""
Request and Response validation schemas for all Firestore collections.
Provides separate Create, Update, and Response definitions.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator, field_validator
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
    PreferenceStatus,
    RankedSubjectPreference,
    FacultySubjectPreference,
    PracticalBatch,
    FixedClassroomAssignment,
    SourceType,
    VerificationStatus,
    Department,
    AcademicYear,
    Section,
    InstitutionalAssignment,
    LabBatchRecord,
    GenerationRun,
)


# =====================================================================
# 1. User Schemas
# =====================================================================

class UserRoleAssignmentSchema(BaseModel):
    role: UserRole
    department_id: Optional[str] = None


class UserCreate(BaseModel):
    id: str = Field(min_length=1, max_length=128, description="User ID or Firebase Auth UID")
    email: str = Field(description="Valid email address or placeholder")
    display_name: str = Field(min_length=1, max_length=100)
    role: UserRole = UserRole.STUDENT_VIEWER
    department_id: Optional[str] = None
    roles: List[UserRole] = Field(default_factory=list)
    role_assignments: List[UserRoleAssignmentSchema] = Field(default_factory=list)
    is_active: bool = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    role: Optional[UserRole] = None
    department_id: Optional[str] = None
    roles: Optional[List[UserRole]] = None
    role_assignments: Optional[List[UserRoleAssignmentSchema]] = None
    is_active: Optional[bool] = None


# =====================================================================
# 2. Faculty Schemas
# =====================================================================

class FacultyCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=100, description="e.g. fac_dept_aids_dr_tejaswini_h. Auto-generated if omitted.")
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(description="Email address or placeholder")
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


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = None
    department_id: Optional[str] = None
    designation: Optional[FacultyDesignation] = None
    max_weekly_hours: Optional[int] = Field(default=None, ge=4, le=40)
    min_weekly_hours: Optional[int] = Field(default=None, ge=0, le=24)
    specializations: Optional[List[str]] = None
    is_placeholder: Optional[bool] = None
    data_status: Optional[str] = None
    notes: Optional[str] = None
    has_login_access: Optional[bool] = None
    is_active: Optional[bool] = None


class FacultyLoginProvisionRequest(BaseModel):
    password: Optional[str] = Field(default="123456", min_length=6, description="Initial temporary password if creating user")
    enable_login: bool = Field(default=True, description="Whether login is enabled or revoked")


class FacultyLoginProvisionResponse(BaseModel):
    faculty_id: str
    email: str
    uid: Optional[str] = None
    has_login_access: bool
    is_active: bool
    message: str


# =====================================================================
# 3. Subject Schemas
# =====================================================================

class SubjectCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=100, description="Optional custom ID. Auto-generated if omitted.")
    code: Optional[str] = Field(default=None, max_length=20, description="Optional VTU Course Code")
    course_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    department_id: Optional[str] = None
    semester: int = Field(default=3, ge=1, le=8)
    credits: int = Field(default=3, ge=0, le=10)
    l_t_p: str = Field(default="3:0:0")
    lecture_hours: Optional[int] = Field(default=None, ge=0, le=10)
    tutorial_hours: Optional[int] = Field(default=None, ge=0, le=10)
    practical_hours: Optional[int] = Field(default=None, ge=0, le=10)
    course_type: Optional[str] = Field(default="Theory")
    subject_type: Optional[SubjectType] = None
    weekly_hours: Optional[int] = Field(default=None, ge=0, le=20)
    is_lab: bool = False
    lab_batch_count: int = Field(default=1, ge=1, le=4)
    preferred_room_type: str = Field(default="CLASSROOM")
    academic_scheme: Optional[str] = "VTU Autonomous 2022/2025 Scheme"
    is_ipcc: bool = False
    requires_lab: bool = False
    requires_batch_split: bool = False
    source_type: Optional[SourceType] = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None
    is_placeholder: bool = False
    data_status: str = "COMPLETE"

    @model_validator(mode="before")
    @classmethod
    def sync_subject_create(cls, data: Any) -> Any:
        if isinstance(data, dict):
            name = data.get("course_name") or data.get("title") or data.get("name")
            if name:
                data["course_name"] = name
                data["title"] = name
            ctype = data.get("course_type") or data.get("subject_type") or "Theory"
            data["course_type"] = str(ctype)
            if str(ctype).upper() in ("LAB", "SUBJECTTYPE.LAB", "PCCL") or "IPCC" in str(ctype).upper():
                data["is_lab"] = True
            ltp = data.get("l_t_p")
            if ltp and isinstance(ltp, str) and ":" in ltp:
                parts = ltp.split(":")
                if len(parts) == 3:
                    try:
                        l, t, p = int(parts[0]), int(parts[1]), int(parts[2])
                        if data.get("lecture_hours") is None:
                            data["lecture_hours"] = l
                        if data.get("tutorial_hours") is None:
                            data["tutorial_hours"] = t
                        if data.get("practical_hours") is None:
                            data["practical_hours"] = p
                        if p > 0:
                            data["is_lab"] = True
                        if data.get("weekly_hours") is None:
                            data["weekly_hours"] = max(1, l + t + p)
                    except ValueError:
                        pass
        return data


class SubjectUpdate(BaseModel):
    course_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    code: Optional[str] = Field(default=None, max_length=20)
    department_id: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=8)
    credits: Optional[int] = Field(default=None, ge=0, le=10)
    l_t_p: Optional[str] = None
    lecture_hours: Optional[int] = Field(default=None, ge=0, le=10)
    tutorial_hours: Optional[int] = Field(default=None, ge=0, le=10)
    practical_hours: Optional[int] = Field(default=None, ge=0, le=10)
    course_type: Optional[str] = None
    subject_type: Optional[SubjectType] = None
    weekly_hours: Optional[int] = Field(default=None, ge=0, le=20)
    is_lab: Optional[bool] = None
    lab_batch_count: Optional[int] = Field(default=None, ge=0)
    preferred_room_type: Optional[str] = None
    academic_scheme: Optional[str] = None
    is_ipcc: Optional[bool] = None
    requires_lab: Optional[bool] = None
    requires_batch_split: Optional[bool] = None
    source_type: Optional[SourceType] = None
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None
    is_placeholder: Optional[bool] = None
    data_status: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_subject_update(cls, data: Any) -> Any:
        if isinstance(data, dict):
            name = data.get("course_name") or data.get("title")
            if name:
                data["course_name"] = name
                data["title"] = name
            ctype = data.get("course_type") or data.get("subject_type")
            if ctype:
                data["course_type"] = str(ctype)
        return data


# =====================================================================
# 4. Room Schemas
# =====================================================================

class RoomCreate(BaseModel):
    id: str = Field(min_length=2, max_length=50, description="e.g. room_ab04")
    name: str = Field(min_length=1, max_length=50)
    room_type: RoomType = RoomType.CLASSROOM
    capacity: int = Field(default=60, ge=10, le=300)
    building_or_block: Optional[str] = None
    department_id: Optional[str] = None
    is_available: bool = True
    availability_status: str = "AVAILABLE"
    is_external: bool = False
    location: Optional[str] = None
    notes: Optional[str] = None
    source_type: Optional[SourceType] = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = Field(default=None, ge=10, le=300)
    building_or_block: Optional[str] = None
    department_id: Optional[str] = None
    is_available: Optional[bool] = None
    availability_status: Optional[str] = None
    is_external: Optional[bool] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    source_type: Optional[SourceType] = None
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None


# =====================================================================
# 4b. Fixed Classroom Schemas (Provisional Allocation)
# =====================================================================

class FixedClassroomCreate(BaseModel):
    id: Optional[str] = None
    department_id: str
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    student_year: Optional[str] = None
    section: str = Field(min_length=1, max_length=5)
    classroom_id: Optional[str] = None
    classroom_name: Optional[str] = None
    capacity: int = Field(default=60, ge=10, le=300)
    allocation_status: str = "PROVISIONAL"
    is_provisional: bool = True
    notes: Optional[str] = None


class FixedClassroomUpdate(BaseModel):
    classroom_id: Optional[str] = None
    classroom_name: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=10, le=300)
    allocation_status: Optional[str] = None
    is_provisional: Optional[bool] = None
    notes: Optional[str] = None


# =====================================================================
# 5. Lab Schemas
# =====================================================================

class LabCreate(BaseModel):
    id: str = Field(min_length=2, max_length=100, description="e.g. lab_ai_data_analytic_lab")
    name: str = Field(min_length=1, max_length=100)
    room_no: Optional[str] = None
    lab_type: LabType = LabType.COMPUTER_LAB
    capacity: int = Field(default=30, ge=5, le=120)
    workstations_count: int = Field(default=30, ge=0, le=120)
    department_id: str = "dept_general"
    building_or_block: Optional[str] = None
    is_available: bool = True
    availability_status: str = "AVAILABLE"
    is_external: bool = False
    external_venue_name: Optional[str] = None
    location: Optional[str] = None
    equipment: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    source_type: Optional[SourceType] = SourceType.EXCEL
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = VerificationStatus.VERIFIED
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None


class LabUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    room_no: Optional[str] = None
    lab_type: Optional[LabType] = None
    capacity: Optional[int] = Field(default=None, ge=5, le=120)
    workstations_count: Optional[int] = Field(default=None, ge=0, le=120)
    department_id: Optional[str] = None
    building_or_block: Optional[str] = None
    is_available: Optional[bool] = None
    availability_status: Optional[str] = None
    is_external: Optional[bool] = None
    external_venue_name: Optional[str] = None
    location: Optional[str] = None
    equipment: Optional[List[str]] = None
    notes: Optional[str] = None
    source_type: Optional[SourceType] = None
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    last_verified_at: Optional[str] = None
    verification_notes: Optional[str] = None


# =====================================================================
# 6. Allotment Schemas
# =====================================================================

class PracticalBatchSchema(BaseModel):
    batch_id: str = Field(description="e.g. B1, B2")
    student_count: int = Field(default=30, ge=1, le=120)
    faculty_id: Optional[str] = None
    lab_id: Optional[str] = None


class AllotmentCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=100, description="Auto-generated if omitted")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    student_year: Optional[str] = None
    department_id: Optional[str] = Field(default=None, description="Must be None for First Year (semesters 1-2)")
    subject_id: str
    faculty_id: str
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    section: str = Field(min_length=1, max_length=10)
    weekly_hours_allocated: Optional[int] = Field(default=None, ge=1, le=24)
    allocated_hours: Optional[int] = Field(default=None, ge=1, le=24)
    is_practical: bool = False
    total_students: Optional[int] = 60
    batch_count: int = 1
    batches: List[PracticalBatchSchema] = Field(default_factory=list)
    practical_duration_slots: int = 2
    is_locked: bool = Field(default=False, description="Dean or Admin locked institutional allotment")
    locked_by: Optional[str] = Field(default=None, description="UID / role of Dean/Admin who locked")
    lock_reason: Optional[str] = Field(default=None, description="Reason for lock")

    @model_validator(mode="before")
    @classmethod
    def sync_allotment_create(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if isinstance(data.get("academic_year"), str):
                data["academic_year"] = data["academic_year"].replace("–", "-").strip()
            if isinstance(data.get("section"), str):
                data["section"] = data["section"].replace("Section", "").strip().upper()
            hours = data.get("allocated_hours") or data.get("weekly_hours_allocated") or 4
            data["weekly_hours_allocated"] = hours
            data["allocated_hours"] = hours
        return data


class AllotmentUpdate(BaseModel):
    subject_id: Optional[str] = None
    faculty_id: Optional[str] = None
    student_year: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    section: Optional[str] = Field(default=None, min_length=1, max_length=10)
    weekly_hours_allocated: Optional[int] = Field(default=None, ge=1, le=24)
    allocated_hours: Optional[int] = Field(default=None, ge=1, le=24)
    is_practical: Optional[bool] = None
    total_students: Optional[int] = None
    batch_count: Optional[int] = None
    batches: Optional[List[PracticalBatchSchema]] = None
    practical_duration_slots: Optional[int] = None
    is_locked: Optional[bool] = None
    locked_by: Optional[str] = None
    lock_reason: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_allotment_update(cls, data: Any) -> Any:
        if isinstance(data, dict):
            hours = data.get("allocated_hours") or data.get("weekly_hours_allocated")
            if hours is not None:
                data["weekly_hours_allocated"] = hours
                data["allocated_hours"] = hours
        return data


# =====================================================================
# 7. Timetable Schemas
# =====================================================================

class TimetableCreate(BaseModel):
    id: str = Field(min_length=3, max_length=100, description="e.g. tt_2026_odd_cse_5a")
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester_type: SemesterType = SemesterType.ODD
    department_id: Optional[str] = Field(default=None, description="Optional for First Year mixed batches")
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    status: TimetableStatus = TimetableStatus.DRAFT
    generation_status: str = "PENDING"
    validation_errors: List[str] = Field(default_factory=list)
    solver_diagnostics: Optional[Dict[str, Any]] = None


class TimetableUpdate(BaseModel):
    status: Optional[TimetableStatus] = None
    generation_status: Optional[str] = None
    validation_errors: Optional[List[str]] = None
    solver_diagnostics: Optional[Dict[str, Any]] = None


class TimetableDraftPlacement(BaseModel):
    id: Optional[str] = None
    day: str = Field(description="Day of week (Monday, Tuesday, etc.)")
    start_period: int = Field(ge=1, le=8, description="Start period 1-8")
    duration: int = Field(default=1, ge=1, le=4, description="Duration in periods")
    subject_id: Optional[str] = None
    subject_code: str = Field(min_length=1, description="Course code, e.g. 25CSCC310")
    subject_name: Optional[str] = None
    subject_title: Optional[str] = None
    faculty_id: Optional[str] = None
    faculty_name: Optional[str] = None
    room: Optional[str] = None
    room_id: Optional[str] = None
    is_locked: bool = False
    is_practical: bool = False
    batch: Optional[str] = None
    lock_reason: Optional[str] = None


class TimetableDraftSaveRequest(BaseModel):
    timetable_id: str = Field(min_length=3, max_length=120)
    academic_year: str = Field(default="2026-2027")
    semester: int = Field(ge=1, le=8)
    semester_type: Optional[SemesterType] = None
    department_id: Optional[str] = Field(default=None, description="Must be None for First Year")
    section: str = Field(min_length=1, max_length=10)
    cycle: Optional[str] = Field(default=None, description="'Physics' or 'Chemistry' for First Year")
    status: TimetableStatus = TimetableStatus.DRAFT
    placements: List[TimetableDraftPlacement] = Field(default_factory=list)

    @field_validator("academic_year", mode="before")
    @classmethod
    def clean_academic_year(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.replace("–", "-").strip()
        return "2026-2027"

    @field_validator("section", mode="before")
    @classmethod
    def clean_section(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.replace("Section", "").strip().upper()
        return "A"


class TimetableDraftSaveResponse(BaseModel):
    success: bool = True
    timetable_id: str
    status: str
    slot_count: int
    message: str
    slots: List[Dict[str, Any]] = Field(default_factory=list)


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
    room_id: Optional[str] = None
    lab_id: Optional[str] = None
    is_lab: bool = False
    is_external_lab: bool = False
    batch: Optional[str] = None
    batch_student_count: Optional[int] = None
    duration_slots: int = 1
    practical_session_id: Optional[str] = None
    allocation_status: str = "SCHEDULED"
    allocation_notes: Optional[str] = None


class TimetableSlotUpdate(BaseModel):
    day: Optional[DayOfWeek] = None
    slot_number: Optional[int] = Field(default=None, ge=1, le=8)
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    subject_id: Optional[str] = None
    faculty_id: Optional[str] = None
    room_id: Optional[str] = None
    lab_id: Optional[str] = None
    is_lab: Optional[bool] = None
    is_external_lab: Optional[bool] = None
    batch: Optional[str] = None
    batch_student_count: Optional[int] = None
    duration_slots: Optional[int] = None
    practical_session_id: Optional[str] = None
    allocation_status: Optional[str] = None
    allocation_notes: Optional[str] = None


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
    max_allowed_hours: Optional[int] = Field(default=16, ge=4, le=40)
    is_overloaded: bool = False
    allotment_ids: List[str] = Field(default_factory=list)


class WorkloadRecordUpdate(BaseModel):
    total_theory_hours: Optional[float] = Field(default=None, ge=0.0)
    total_lab_hours: Optional[float] = Field(default=None, ge=0.0)
    total_hours: Optional[float] = Field(default=None, ge=0.0)
    max_allowed_hours: Optional[int] = Field(default=None, ge=4, le=40)
    is_overloaded: Optional[bool] = None
    allotment_ids: Optional[List[str]] = None


# =====================================================================
# 10. Preference Schemas
# =====================================================================

class RankedPreferenceInput(BaseModel):
    preference_rank: int = Field(ge=1, le=3, description="Rank 1, 2, or 3")
    subject_id: str
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    notes: Optional[str] = None


class FacultyPreferenceSubmit(BaseModel):
    academic_year: str = Field(pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    department_id: str
    preferences: List[RankedPreferenceInput] = Field(default_factory=list, description="Up to 3 ranked choices")


class HODPreferenceReview(BaseModel):
    status: PreferenceStatus = PreferenceStatus.HOD_MODIFIED
    hod_comments: Optional[str] = None
    hod_modified_preferences: Optional[List[RankedPreferenceInput]] = None


class PreferenceFinalizeRequest(BaseModel):
    finalized_by: Optional[str] = None
    notes: Optional[str] = None


# =====================================================================
# 11. Excel Import & Solver Schemas
# =====================================================================

class ExcelImportRequest(BaseModel):
    dry_run: bool = Field(default=True, description="When true, performs full parse and validation without writing")
    overwrite_existing: bool = Field(default=False, description="When true, overwrites existing records")


class ImportSummaryCategory(BaseModel):
    parsed: int = 0
    added: int = 0
    updated: int = 0
    skipped: int = 0
    invalid: int = 0


class ImportSummaryReport(BaseModel):
    dry_run: bool
    faculty: ImportSummaryCategory
    rooms: ImportSummaryCategory
    labs: ImportSummaryCategory
    subjects: ImportSummaryCategory
    total_records: int
    details: List[str] = Field(default_factory=list)


class TimetableGenerationRequest(BaseModel):
    academic_year: str = Field(default="2026-2027", pattern=r"^\d{4}-\d{4}$")
    semester: int = Field(ge=1, le=8)
    department_id: Optional[str] = Field(default=None, description="Optional for First Year mixed batches")
    section: str = Field(min_length=1, max_length=5)
    student_count: int = Field(default=60, ge=10, le=120)
    batch_count: int = Field(default=2, ge=1, le=4)
    days: List[DayOfWeek] = Field(
        default=[
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
        ]
    )
    periods_per_day: int = Field(default=7, ge=5, le=8)
    lunch_period: int = Field(default=5, ge=4, le=6)
    max_solve_time_seconds: int = Field(default=15, ge=5, le=60)
    subject_ids: Optional[List[str]] = Field(default=None, description="Optional explicit list of subject IDs allocated to this class")


class TimetableGenerationResponse(BaseModel):
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, ERROR
    timetable_id: str
    slots_generated: int
    slots: List[Dict[str, Any]]
    diagnostics: Optional[Dict[str, Any]] = None
    validation_messages: List[str] = Field(default_factory=list)


class TimetableValidationResponse(BaseModel):
    is_valid: bool
    error_count: int
    warning_count: int
    clashes: List[Dict[str, Any]] = Field(default_factory=list)
    messages: List[str] = Field(default_factory=list)


# =====================================================================
# 12. Department Schemas
# =====================================================================

class DepartmentCreate(BaseModel):
    id: str = Field(min_length=2, max_length=50, description="e.g. dept_aids")
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=20)
    aliases: List[str] = Field(default_factory=list)
    category: str = Field(default="ENGINEERING_PROGRAM")
    is_academic_program: bool = True
    hod_faculty_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    aliases: Optional[List[str]] = None
    category: Optional[str] = None
    is_academic_program: Optional[bool] = None
    hod_faculty_id: Optional[str] = None


class DepartmentResponse(DepartmentCreate):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# =====================================================================
# 13. Academic Year & Section Schemas
# =====================================================================

class AcademicYearCreate(BaseModel):
    id: str = Field(description="e.g. ay_2026_2027")
    name: str = Field(description="e.g. 2026-2027")
    start_year: int = 2026
    end_year: int = 2027
    is_current: bool = True
    current_term: SemesterType = SemesterType.ODD


class SectionCreate(BaseModel):
    id: str = Field(description="e.g. sec_2026_aids_sem3_a")
    department_id: Optional[str] = Field(default=None, description="Optional for First Year mixed batches")
    academic_year: str = "2026-2027"
    semester: int = Field(ge=1, le=8)
    section: str = Field(min_length=1, max_length=5)
    student_year: Optional[str] = None
    student_count: int = Field(default=60, ge=1)
    batch_count: int = Field(default=2, ge=1)
    fixed_classroom_id: Optional[str] = None


# =====================================================================
# 14. Institutional Assignment Schemas (Dean Locked)
# =====================================================================

class InstitutionalAssignmentCreate(BaseModel):
    id: str
    academic_year: str = "2026-2027"
    semester: int = Field(ge=1, le=8)
    department_id: str
    subject_id: str
    faculty_id: str
    section: str
    allocated_hours: int = 3
    is_locked: bool = True
    locked_by: Optional[str] = "Dr. Sudarshan Rao (Dean Academics)"
    lock_reason: Optional[str] = "Institutional academic assignment locked by Dean"


# =====================================================================
# 15. Lab Batch & Generation Run Schemas
# =====================================================================

class LabBatchCreate(BaseModel):
    id: str
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: str
    batch_name: str
    student_count: int = 30
    subject_id: Optional[str] = None
    lab_id: Optional[str] = None
    faculty_id: Optional[str] = None


class GenerationRunCreate(BaseModel):
    id: str
    academic_year: str = "2026-2027"
    department_id: str
    semester: int = Field(ge=1, le=8)
    section: Optional[str] = None
    status: str = "COMPLETED"
    solver_status: str = "OPTIMAL"
    wall_time_seconds: float = 0.0
    conflicts_detected: int = 0
    generated_slots_count: int = 0
    timetable_id: Optional[str] = None
    created_by: Optional[str] = None
