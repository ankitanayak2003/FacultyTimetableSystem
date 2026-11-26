"""Departments router for institutional and academic programs."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Department
from app.schemas.entities import DepartmentCreate, DepartmentUpdate
from app.repositories import department_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])


@router.post("/", response_model=Department, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Creates a new institutional department record."""
    created = await department_repository.create(payload.id, payload.model_dump())
    return created


@router.get("", response_model=List[Department], include_in_schema=False)
@router.get("/", response_model=List[Department])
async def list_departments(
    category: Optional[str] = None,
    is_academic_program: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists all institutional departments."""
    filters = {}
    if category:
        filters["category"] = category
    if is_academic_program is not None:
        filters["is_academic_program"] = is_academic_program
    return await department_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{dept_id}", response_model=Department)
async def get_department(
    dept_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches department details by ID."""
    return await department_repository.get_or_raise(dept_id)


@router.put("/{dept_id}", response_model=Department)
async def update_department(
    dept_id: str,
    payload: DepartmentUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates department details."""
    updates = payload.model_dump(exclude_unset=True)
    return await department_repository.update(dept_id, updates)


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    dept_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a department record."""
    await department_repository.delete(dept_id)
