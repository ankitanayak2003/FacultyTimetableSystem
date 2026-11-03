"""Faculty profile management router with department scoping."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import FacultyProfile
from app.schemas.entities import FacultyCreate, FacultyUpdate
from app.repositories import faculty_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    require_faculty_or_above,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/faculty", tags=["Faculty"])


@router.post("/", response_model=FacultyProfile, status_code=status.HTTP_201_CREATED)
async def create_faculty(
    payload: FacultyCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers a faculty member. Department coordinators are restricted to their department."""
    check_department_access(auth_ctx, payload.department_id)
    created = await faculty_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[FacultyProfile])
async def list_faculty(
    department_id: Optional[str] = None,
    designation: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Lists faculty profiles. Requires faculty or coordinator access."""
    filters = {}
    if not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if designation:
        filters["designation"] = designation
    if is_active is not None:
        filters["is_active"] = is_active

    return await faculty_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{faculty_id}", response_model=FacultyProfile)
async def get_faculty(
    faculty_id: str,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Fetches a specific faculty profile by ID."""
    fac = await faculty_repository.get_or_raise(faculty_id)
    check_department_access(auth_ctx, fac.get("department_id"))
    return fac


@router.put("/{faculty_id}", response_model=FacultyProfile)
async def update_faculty(
    faculty_id: str,
    payload: FacultyUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates faculty details. Verifies department ownership."""
    existing = await faculty_repository.get_or_raise(faculty_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    return await faculty_repository.update(faculty_id, payload.model_dump(exclude_unset=True))


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(
    faculty_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a faculty profile, verifying no active allotments or timetable slots exist."""
    existing = await faculty_repository.get_or_raise(faculty_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await faculty_repository.delete(faculty_id)
