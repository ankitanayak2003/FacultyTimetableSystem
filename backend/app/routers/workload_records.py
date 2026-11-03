"""Faculty workload records tracking router with department-scoped authorization."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import WorkloadRecord, SemesterType, UserRole
from app.schemas.entities import WorkloadRecordCreate, WorkloadRecordUpdate
from app.repositories import workload_record_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    require_faculty_or_above,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/workload-records", tags=["Workload Records"])


@router.post("/", response_model=WorkloadRecord, status_code=status.HTTP_201_CREATED)
async def create_workload_record(
    payload: WorkloadRecordCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Creates a workload record for a faculty member.
    Authoritatively derives workload metrics from active allotments and validates department access.
    """
    check_department_access(auth_ctx, payload.department_id)
    created = await workload_record_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[WorkloadRecord])
async def list_workload_records(
    academic_year: Optional[str] = None,
    semester_type: Optional[SemesterType] = None,
    department_id: Optional[str] = None,
    faculty_id: Optional[str] = None,
    is_overloaded: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """
    Lists workload records with optional overload and semester filters.
    Restricted to faculty and coordinators. Department-scoped for non-admins.
    """
    filters = {}
    if not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if academic_year:
        filters["academic_year"] = academic_year
    if semester_type:
        filters["semester_type"] = semester_type.value
    if faculty_id:
        filters["faculty_id"] = faculty_id
    if is_overloaded is not None:
        filters["is_overloaded"] = is_overloaded

    return await workload_record_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{record_id}", response_model=WorkloadRecord)
async def get_workload_record(
    record_id: str,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Fetches a workload record by ID with department scoping."""
    record = await workload_record_repository.get_or_raise(record_id)
    check_department_access(auth_ctx, record.get("department_id"))
    return record


@router.put("/{record_id}", response_model=WorkloadRecord)
async def update_workload_record(
    record_id: str,
    payload: WorkloadRecordUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates workload record, recalculating authoritative metrics and checking department access."""
    existing = await workload_record_repository.get_or_raise(record_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    updates = payload.model_dump(exclude_unset=True)
    if "department_id" in updates:
        check_department_access(auth_ctx, updates["department_id"])
    return await workload_record_repository.update(record_id, updates)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workload_record(
    record_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a workload record with department access verification."""
    existing = await workload_record_repository.get_or_raise(record_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await workload_record_repository.delete(record_id)

