"""Faculty-Subject teaching allotment router with department scoping."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Allotment
from app.schemas.entities import AllotmentCreate, AllotmentUpdate
from app.repositories import allotment_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    require_faculty_or_above,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/allotments", tags=["Allotments"])


@router.post("/", response_model=Allotment, status_code=status.HTTP_201_CREATED)
async def create_allotment(
    payload: AllotmentCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Allots a subject to a faculty member.
    Verifies department ownership and referential integrity for faculty and subject.
    """
    check_department_access(auth_ctx, payload.department_id)
    created = await allotment_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[Allotment])
async def list_allotments(
    academic_year: Optional[str] = None,
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    faculty_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    section: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Lists course allotments with filters. Restricted to faculty and coordinators."""
    filters = {}
    if not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if academic_year:
        filters["academic_year"] = academic_year
    if semester:
        filters["semester"] = semester
    if faculty_id:
        filters["faculty_id"] = faculty_id
    if subject_id:
        filters["subject_id"] = subject_id
    if section:
        filters["section"] = section

    return await allotment_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{allotment_id}", response_model=Allotment)
async def get_allotment(
    allotment_id: str,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Fetches an allotment by ID with department verification."""
    alt = await allotment_repository.get_or_raise(allotment_id)
    check_department_access(auth_ctx, alt.get("department_id"))
    return alt


@router.put("/{allotment_id}", response_model=Allotment)
async def update_allotment(
    allotment_id: str,
    payload: AllotmentUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates teaching allotment, re-validating changed foreign keys."""
    existing = await allotment_repository.get_or_raise(allotment_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    return await allotment_repository.update(allotment_id, payload.model_dump(exclude_unset=True))


@router.delete("/{allotment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allotment(
    allotment_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes an allotment with department access check."""
    existing = await allotment_repository.get_or_raise(allotment_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await allotment_repository.delete(allotment_id)
