"""Class academic sections router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Section
from app.repositories import section_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/sections", tags=["Sections"])


@router.post("", response_model=Section, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=Section, status_code=status.HTTP_201_CREATED)
async def create_section(
    payload: Section,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Creates a section record."""
    created = await section_repository.create(payload.id, payload.model_dump())
    return created


@router.get("", response_model=List[Section], include_in_schema=False)
@router.get("/", response_model=List[Section])
async def list_sections(
    department_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[int] = None,
    student_year: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists sections with optional department, academic year, semester, and student_year filters."""
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if academic_year:
        filters["academic_year"] = academic_year
    if semester:
        filters["semester"] = semester
    if student_year:
        filters["student_year"] = student_year
    return await section_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{section_id}", response_model=Section)
async def get_section(
    section_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches a section by ID."""
    return await section_repository.get_or_raise(section_id)
