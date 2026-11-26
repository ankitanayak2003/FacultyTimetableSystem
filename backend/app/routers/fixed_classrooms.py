"""
Fixed Classroom Allocation Router for AQS.
Manages section-to-classroom mappings, providing provisional classroom assignments
until official institutional room numbers are finalized.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import FixedClassroomAssignment
from app.schemas.entities import FixedClassroomCreate, FixedClassroomUpdate
from app.repositories import fixed_classroom_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    check_department_access,
    AuthContext,
)
from app.core.realtime import realtime_broadcaster

router = APIRouter(prefix="/api/v1/fixed-classrooms", tags=["Fixed Classrooms"])


@router.post("/", response_model=FixedClassroomAssignment, status_code=status.HTTP_201_CREATED)
async def create_fixed_classroom_assignment(
    payload: FixedClassroomCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Assigns or updates a fixed classroom for a section."""
    check_department_access(auth_ctx, payload.department_id)

    doc_id = payload.id or f"fcr_{payload.academic_year}_{payload.department_id}_sem{payload.semester}_{payload.section.lower()}"
    room_id = payload.classroom_id or f"classroom_{payload.department_id}_sem{payload.semester}_section_{payload.section.lower()}"
    room_name = payload.classroom_name or f"Provisional Classroom ({payload.department_id.replace('dept_', '').upper()} Sem {payload.semester} Sec {payload.section.upper()})"

    # Prevent assigning the same confirmed classroom to multiple sections in the same academic year
    if room_id and not payload.is_provisional and payload.allocation_status == "CONFIRMED":
        existing_assignments = await fixed_classroom_repository.list_all(
            filters={"academic_year": payload.academic_year, "classroom_id": room_id}
        )
        for ex in existing_assignments:
            if ex.get("id") != doc_id and ex.get("allocation_status") == "CONFIRMED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Classroom collision conflict: Facility '{room_id}' is already confirmed for section "
                        f"'{ex.get('department_id')}' Sem {ex.get('semester')} Sec {ex.get('section')}."
                    ),
                )

    data = {
        "id": doc_id,
        "department_id": payload.department_id,
        "academic_year": payload.academic_year,
        "semester": payload.semester,
        "student_year": payload.student_year,
        "section": payload.section.upper(),
        "classroom_id": room_id,
        "classroom_name": room_name,
        "allocation_status": payload.allocation_status,
        "is_provisional": payload.is_provisional,
        "capacity": payload.capacity,
        "notes": payload.notes or "Provisional fixed classroom assignment pending official institutional allocation",
    }

    created = await fixed_classroom_repository.create(doc_id, data)
    realtime_broadcaster.broadcast("FIXED_CLASSROOM_UPDATED", doc_id, data)
    return created


@router.get("", response_model=List[FixedClassroomAssignment], include_in_schema=False)
@router.get("/", response_model=List[FixedClassroomAssignment])
async def list_fixed_classrooms(
    department_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    section: Optional[str] = None,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists fixed classroom assignments with department isolation."""
    filters = {}
    if auth_ctx.is_coordinator and not auth_ctx.is_admin and not auth_ctx.is_basic_science_coordinator:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if academic_year:
        filters["academic_year"] = academic_year
    if semester:
        filters["semester"] = semester
    if section:
        filters["section"] = section.upper()

    return await fixed_classroom_repository.list_all(filters=filters)


@router.get("/{assignment_id}", response_model=FixedClassroomAssignment)
async def get_fixed_classroom_by_id(
    assignment_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Retrieves a single fixed classroom assignment."""
    item = await fixed_classroom_repository.get_or_raise(assignment_id)
    if auth_ctx.is_coordinator and not auth_ctx.is_admin and not auth_ctx.is_basic_science_coordinator:
        check_department_access(auth_ctx, item.get("department_id"))
    return item


@router.put("/{assignment_id}", response_model=FixedClassroomAssignment)
async def update_fixed_classroom_assignment(
    assignment_id: str,
    payload: FixedClassroomUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates a fixed classroom assignment (e.g. replacing provisional with official room number)."""
    existing = await fixed_classroom_repository.get_or_raise(assignment_id)
    check_department_access(auth_ctx, existing.get("department_id"))

    room_id = payload.classroom_id or existing.get("classroom_id")
    status_val = payload.allocation_status or existing.get("allocation_status")
    is_prov = payload.is_provisional if payload.is_provisional is not None else existing.get("is_provisional")

    if room_id and not is_prov and status_val == "CONFIRMED":
        existing_assignments = await fixed_classroom_repository.list_all(
            filters={"academic_year": existing.get("academic_year"), "classroom_id": room_id}
        )
        for ex in existing_assignments:
            if ex.get("id") != assignment_id and ex.get("allocation_status") == "CONFIRMED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Classroom collision conflict: Facility '{room_id}' is already confirmed for section "
                        f"'{ex.get('department_id')}' Sem {ex.get('semester')} Sec {ex.get('section')}."
                    ),
                )

    updated = await fixed_classroom_repository.update(
        assignment_id, payload.model_dump(exclude_unset=True)
    )
    realtime_broadcaster.broadcast("FIXED_CLASSROOM_UPDATED", assignment_id, updated)
    return updated
