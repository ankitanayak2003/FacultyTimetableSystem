"""Authenticated user identity resolution and multi-role validation router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.models.entities import UserRole
from app.core.dependencies import (
    AuthContext,
    get_current_user_context,
    parse_user_role,
)
from app.repositories import department_repository

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

ROLE_PORTAL_MAP: dict[UserRole, str] = {
    UserRole.DEAN: "dean-dashboard",
    UserRole.PRINCIPAL: "principal-dashboard",
    UserRole.HOD: "hod-dashboard",
    UserRole.DEPARTMENT_COORDINATOR: "dept-coordinator-dashboard",
    UserRole.BASIC_SCIENCE_COORDINATOR: "basic-science-dashboard",
    UserRole.FACULTY: "faculty-dashboard",
    UserRole.STUDENT_VIEWER: "student-dashboard",
    UserRole.ADMIN: "dean-dashboard",
    UserRole.CHIEF_COORDINATOR: "dean-dashboard",
}


class AuthenticatedUserResponse(BaseModel):
    uid: str
    email: str
    display_name: str
    role: str
    department_id: Optional[str] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool
    assigned_roles: List[str] = Field(default_factory=list)
    portal_view: Optional[str] = None


class RoleValidationRequest(BaseModel):
    selected_role: str


class RoleValidationResponse(BaseModel):
    uid: str
    email: str
    display_name: str
    active_role: str
    department_id: Optional[str] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool
    assigned_roles: List[str]
    portal_view: str
    message: str


@router.get("/me", response_model=AuthenticatedUserResponse)
async def get_authenticated_me(
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """
    Verifies the caller's Firebase ID token and returns their authoritative
    server-side user identity, active role, and assigned roles from Firestore.
    """
    dept_code: Optional[str] = None
    dept_name: Optional[str] = None
    if auth_ctx.department_id:
        dept_doc = await department_repository.get_by_id(auth_ctx.department_id)
        if dept_doc:
            dept_code = dept_doc.get("code")
            dept_name = dept_doc.get("name")

    portal = ROLE_PORTAL_MAP.get(auth_ctx.role, "student-dashboard")
    assigned_str_list = [r.value for r in auth_ctx.assigned_roles]

    return AuthenticatedUserResponse(
        uid=auth_ctx.uid,
        email=auth_ctx.email,
        display_name=auth_ctx.display_name or auth_ctx.email or auth_ctx.uid,
        role=auth_ctx.role.value,
        department_id=auth_ctx.department_id,
        department_code=dept_code,
        department_name=dept_name,
        is_active=auth_ctx.is_active,
        assigned_roles=assigned_str_list,
        portal_view=portal,
    )


@router.post("/validate-role", response_model=RoleValidationResponse)
async def validate_selected_role(
    payload: RoleValidationRequest,
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """
    Validates that the selected institutional role is legitimately assigned
    to the authenticated user in Firestore. Establishes the active session role.
    """
    requested_role = parse_user_role(payload.selected_role)
    if not requested_role or requested_role not in auth_ctx.assigned_roles:
        if len(auth_ctx.assigned_roles) == 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The selected institutional role does not match your assigned role. Please select the correct role.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to the selected institutional portal. Please select one of your assigned roles.",
            )

    dept_code: Optional[str] = None
    dept_name: Optional[str] = None
    if auth_ctx.department_id:
        dept_doc = await department_repository.get_by_id(auth_ctx.department_id)
        if dept_doc:
            dept_code = dept_doc.get("code")
            dept_name = dept_doc.get("name")

    portal = ROLE_PORTAL_MAP.get(requested_role, "student-dashboard")
    assigned_str_list = [r.value for r in auth_ctx.assigned_roles]

    return RoleValidationResponse(
        uid=auth_ctx.uid,
        email=auth_ctx.email,
        display_name=auth_ctx.display_name,
        active_role=requested_role.value,
        department_id=auth_ctx.department_id,
        department_code=dept_code,
        department_name=dept_name,
        is_active=auth_ctx.is_active,
        assigned_roles=assigned_str_list,
        portal_view=portal,
        message=f"Access granted for institutional role '{requested_role.value}'. Redirecting to designated portal.",
    )
