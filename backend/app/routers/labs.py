"""Engineering laboratories router with department scoping."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Lab, LabType
from app.schemas.entities import LabCreate, LabUpdate
from app.repositories import lab_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/labs", tags=["Labs"])


@router.post("/", response_model=Lab, status_code=status.HTTP_201_CREATED)
async def create_lab(
    payload: LabCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers an engineering lab facility for a department."""
    check_department_access(auth_ctx, payload.department_id)
    created = await lab_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[Lab])
async def list_labs(
    department_id: Optional[str] = None,
    lab_type: Optional[LabType] = None,
    is_available: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists laboratories with optional filters."""
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if lab_type:
        filters["lab_type"] = lab_type.value
    if is_available is not None:
        filters["is_available"] = is_available
    return await lab_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{lab_id}", response_model=Lab)
async def get_lab(
    lab_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches laboratory details by ID."""
    return await lab_repository.get_or_raise(lab_id)


@router.put("/{lab_id}", response_model=Lab)
async def update_lab(
    lab_id: str,
    payload: LabUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates lab configuration with department access check."""
    existing = await lab_repository.get_or_raise(lab_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    return await lab_repository.update(lab_id, payload.model_dump(exclude_unset=True))


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab(
    lab_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a laboratory, verifying no active slots are assigned."""
    existing = await lab_repository.get_or_raise(lab_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await lab_repository.delete(lab_id)
