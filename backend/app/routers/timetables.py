"""Timetable master schedules router with draft protections and department scoping."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import Timetable, TimetableStatus, SemesterType, UserRole
from app.schemas.entities import TimetableCreate, TimetableUpdate
from app.repositories import timetable_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/timetables", tags=["Timetables"])


@router.post("/", response_model=Timetable, status_code=status.HTTP_201_CREATED)
async def create_timetable(
    payload: TimetableCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Initializes a master timetable container. Department scoped."""
    check_department_access(auth_ctx, payload.department_id)
    created = await timetable_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[Timetable])
async def list_timetables(
    academic_year: Optional[str] = None,
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    semester_type: Optional[SemesterType] = None,
    section: Optional[str] = None,
    status_filter: Optional[TimetableStatus] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """
    Lists timetable schedules.
    Security Rules:
    - Students / Viewers are restricted exclusively to PUBLISHED timetables.
    - Draft and archived schedules are visible only to coordinators and faculty.
    """
    filters = {}
    
    # Restrict unauthenticated callers and students to published timetables only
    if not auth_ctx.is_coordinator:
        filters["status"] = TimetableStatus.PUBLISHED.value
    elif status_filter:
        filters["status"] = status_filter.value

    # Department scoping for coordinators
    if auth_ctx.is_coordinator and not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if academic_year:
        filters["academic_year"] = academic_year
    if semester:
        filters["semester"] = semester
    if semester_type:
        filters["semester_type"] = semester_type.value
    if section:
        filters["section"] = section

    return await timetable_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{timetable_id}", response_model=Timetable)
async def get_timetable(
    timetable_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """
    Fetches a timetable by ID.
    Rejects student access to unpublished drafts with a safe 404 response.
    """
    tt = await timetable_repository.get_or_raise(timetable_id)
    
    # Hide unpublished timetables from non-coordinators
    if not auth_ctx.is_coordinator and tt.get("status") != TimetableStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable '{timetable_id}' was not found or is currently in draft.",
        )

    if auth_ctx.is_coordinator:
        check_department_access(auth_ctx, tt.get("department_id"))

    return tt


@router.put("/{timetable_id}", response_model=Timetable)
async def update_timetable(
    timetable_id: str,
    payload: TimetableUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates timetable status (e.g. DRAFT -> PUBLISHED)."""
    existing = await timetable_repository.get_or_raise(timetable_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    return await timetable_repository.update(timetable_id, payload.model_dump(exclude_unset=True))


@router.delete("/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable(
    timetable_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a draft timetable and cascades removal of child slots. Rejects published timetables."""
    existing = await timetable_repository.get_or_raise(timetable_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await timetable_repository.delete(timetable_id)
