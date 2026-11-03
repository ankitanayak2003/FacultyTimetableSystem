"""Subjects and VTU curriculum course catalog router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Subject, SubjectType
from app.schemas.entities import SubjectCreate, SubjectUpdate
from app.repositories import subject_repository
from app.core.dependencies import (
    get_current_user_context,
    require_coordinator_or_admin,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/subjects", tags=["Subjects"])


@router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers a course / subject in the VTU catalog for a department."""
    check_department_access(auth_ctx, payload.department_id)
    created = await subject_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[Subject])
async def list_subjects(
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    subject_type: Optional[SubjectType] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Lists subjects filtered by department, semester, and type. Requires authentication."""
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if semester:
        filters["semester"] = semester
    if subject_type:
        filters["subject_type"] = subject_type.value
    return await subject_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str,
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Fetches subject details by ID. Requires authentication."""
    return await subject_repository.get_or_raise(subject_id)


@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates subject details with department verification."""
    existing = await subject_repository.get_or_raise(subject_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    return await subject_repository.update(subject_id, payload.model_dump(exclude_unset=True))


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a subject, verifying no active allotments or timetable slots reference it."""
    existing = await subject_repository.get_or_raise(subject_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await subject_repository.delete(subject_id)
