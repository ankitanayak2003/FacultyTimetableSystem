"""
Authentication and Authorization dependencies.
Enforces default-deny role-based and department-scoped access control.
Resolves identity, role, active status, and department ownership exclusively
from verified server-side database records.
"""

from typing import List, Optional
import logging
from fastapi import Header, HTTPException, status, Depends
import firebase_admin
from firebase_admin import auth
from app.models.entities import UserRole
from app.core.config import settings
from app.core.firebase import firebase_manager

logger = logging.getLogger("faculty_timetable.auth")


class AuthContext:
    """Represents verified caller identity, server-managed role, and assigned department."""
    def __init__(
        self,
        uid: str,
        email: str,
        role: UserRole,
        department_id: Optional[str] = None,
        is_active: bool = True,
        is_authenticated: bool = True,
    ):
        self.uid = uid
        self.email = email
        self.role = role
        self.department_id = department_id
        self.is_active = is_active
        self.is_authenticated = is_authenticated

    @property
    def is_admin(self) -> bool:
        return self.role in {UserRole.ADMIN, UserRole.CHIEF_COORDINATOR}

    @property
    def is_coordinator(self) -> bool:
        return self.role in {
            UserRole.ADMIN,
            UserRole.CHIEF_COORDINATOR,
            UserRole.HOD,
            UserRole.DEPARTMENT_COORDINATOR,
        }


async def get_current_user_context(
    authorization: Optional[str] = Header(default=None),
) -> AuthContext:
    """
    Strict Authenticated Identity Dependency.
    
    1. Extracts Bearer token from the standard Authorization header.
    2. Validates token via Firebase Admin SDK.
    3. Resolves caller's server-side user record from the 'users' collection.
    4. Rejects inactive accounts, missing profiles, and unverified credentials.
    5. Fails closed in all environments.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Expected 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split("Bearer ", 1)[1].strip()

    # Verify token with Firebase Admin SDK
    if not firebase_manager.is_initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is currently unavailable.",
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise ValueError("Token missing uid claim.")
    except Exception as exc:
        logger.warning("Token verification failed: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase Authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve server-managed user profile from 'users' collection
    from app.repositories import user_repository
    user_doc = await user_repository.get_by_id(uid)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User profile for UID '{uid}' was not found in system database. Provisioning required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_doc.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled. Contact department administrator.",
        )

    # Parse role strictly
    role_str = user_doc.get("role")
    try:
        role = UserRole(role_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid server-managed role configuration for user '{uid}'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthContext(
        uid=uid,
        email=user_doc.get("email", decoded_token.get("email", "")),
        role=role,
        department_id=user_doc.get("department_id"),
        is_active=True,
        is_authenticated=True,
    )


async def get_optional_user_context(
    authorization: Optional[str] = Header(default=None),
) -> AuthContext:
    """
    Optional authentication dependency for public viewer endpoints (e.g. published timetables).
    If a Bearer token is provided, it verifies it; otherwise, defaults safely to STUDENT_VIEWER.
    """
    if authorization and authorization.startswith("Bearer "):
        return await get_current_user_context(authorization)

    # Safe anonymous viewer fallback
    return AuthContext(
        uid="anonymous_viewer",
        email="",
        role=UserRole.STUDENT_VIEWER,
        department_id=None,
        is_active=True,
        is_authenticated=False,
    )


def require_coordinator_or_admin(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards operations to Coordinator, HOD, or Admin roles only."""
    if not context.is_coordinator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires coordinator or administrative role, but caller has '{context.role.value}'.",
        )
    return context


def require_faculty_or_above(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards operations to Faculty, Coordinator, or Admin roles only (rejects Students)."""
    allowed = {
        UserRole.ADMIN,
        UserRole.CHIEF_COORDINATOR,
        UserRole.HOD,
        UserRole.DEPARTMENT_COORDINATOR,
        UserRole.FACULTY,
    }
    if context.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires faculty or administrative privileges, but caller has '{context.role.value}'.",
        )
    return context


def require_admin_only(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards super-administrative operations (e.g. provisioning coordinators)."""
    if not context.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only ADMIN or CHIEF_COORDINATOR can perform this operation.",
        )
    return context


def check_department_access(context: AuthContext, target_department_id: Optional[str]):
    """
    Enforces multi-tenancy department isolation:
    - Admin and Chief Coordinator have global institution-wide access.
    - Department Coordinators and HODs are strictly restricted to their assigned department.
    """
    if context.is_admin:
        return  # Global access

    if not target_department_id:
        return  # Shared/general resource

    if context.department_id != target_department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Department access violation: Your account is scoped to department '{context.department_id}', "
                f"and cannot access or modify resources in department '{target_department_id}'."
            ),
        )
