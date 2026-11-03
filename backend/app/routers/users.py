"""User management router with strict RBAC."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import User, UserRole
from app.schemas.entities import UserCreate, UserUpdate
from app.repositories import user_repository
from app.core.dependencies import (
    get_current_user_context,
    require_admin_only,
    require_coordinator_or_admin,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Provisions a new user.
    Security:
    - Only ADMIN or CHIEF_COORDINATOR can provision admin/coordinator roles.
    - Department coordinators can only provision Faculty or Students within their department.
    - Anonymous or public registration is strictly denied.
    """
    # Guard administrative role elevation
    if payload.role in {UserRole.ADMIN, UserRole.CHIEF_COORDINATOR, UserRole.HOD, UserRole.DEPARTMENT_COORDINATOR}:
        if not auth_ctx.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Elevated privileges required: Only administrators can provision coordinator or admin accounts.",
            )

    # Department scoping for coordinator
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    created = await user_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[User])
async def list_users(
    role: Optional[UserRole] = None,
    department_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Lists users. Coordinators are scoped to their department unless administrator."""
    filters = {}
    if not auth_ctx.is_admin:
        # Enforce coordinator's own department
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if role:
        filters["role"] = role.value

    return await user_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Fetches user details. Callers can only view their own record unless coordinator/admin."""
    user = await user_repository.get_or_raise(user_id)
    if not auth_ctx.is_coordinator and auth_ctx.uid != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You may only view your own user profile.",
        )
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates user. Role elevation or department transfer requires administrative role."""
    target_user = await user_repository.get_or_raise(user_id)

    # Prevent self-elevation or role change by non-admins
    if payload.role and payload.role != target_user.get("role"):
        if not auth_ctx.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify user roles.",
            )

    if payload.department_id and payload.department_id != target_user.get("department_id"):
        if not auth_ctx.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can transfer user departments.",
            )

    return await user_repository.update(user_id, payload.model_dump(exclude_unset=True))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    auth_ctx: AuthContext = Depends(require_admin_only),
):
    """Deletes a user account. Restricted exclusively to administrators."""
    await user_repository.delete(user_id)
