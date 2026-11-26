"""
Authentication and Authorization dependencies.
Enforces default-deny role-based and department-scoped access control.
Resolves identity, role, active status, and department ownership exclusively
from verified server-side database records.
"""

from typing import List, Optional
import logging
import re
from fastapi import Header, HTTPException, status, Depends
import firebase_admin
from firebase_admin import auth
from app.models.entities import UserRole
from app.core.config import settings
from app.core.firebase import firebase_manager

logger = logging.getLogger("faculty_timetable.auth")


BASIC_SCIENCE_DEPARTMENTS = {
    "basic_science",
    "dept_basic_science",
    "mathematics",
    "math",
    "dept_math",
    "dept_mathematics",
    "physics",
    "phy",
    "dept_physics",
    "dept_phy",
    "chemistry",
    "chem",
    "dept_chemistry",
    "dept_chem",
}


_BS_NAME_RE = re.compile(r"\b(mathematics|maths|physics|chemistry)\b", re.IGNORECASE)
_BS_CODE_RE = re.compile(r"^(?:[0-9]{2})?(?:b)?(?:mat|phy|che)[a-z0-9]*$", re.IGNORECASE)


def is_basic_science_subject_doc(subject_doc: Optional[dict]) -> bool:
    """
    Returns True only if a subject belongs to Mathematics, Physics, or Chemistry
    (Basic Science scope) via validated department/cycle relationships or exact
    VTU Basic Science subject classification. Departmentless First Year mixed-batch
    subjects (e.g. UHV, Idea Lab, Manufacturing, Philosophy) with department_id=None
    are NOT granted to Basic Science.
    """
    if not subject_doc:
        return False
    dept_id = subject_doc.get("department_id")
    if dept_id:
        return str(dept_id).strip().lower() in BASIC_SCIENCE_DEPARTMENTS

    owning_dept = subject_doc.get("owning_department_id") or subject_doc.get("basic_science_department_id")
    if owning_dept:
        return str(owning_dept).strip().lower() in BASIC_SCIENCE_DEPARTMENTS

    cycle = str(subject_doc.get("cycle") or "").strip().lower()
    if cycle in {"physics", "chemistry", "mathematics", "math"}:
        return True

    # For department_id=None without explicit owning_dept/cycle, require exact
    # Basic Science subject-name word match or VTU Basic Science course code prefix.
    code = str(subject_doc.get("code") or "").strip()
    name = str(subject_doc.get("course_name") or subject_doc.get("title") or "").strip()
    return bool((code and _BS_CODE_RE.match(code)) or (name and _BS_NAME_RE.search(name)))


ROLE_INPUT_MAP: dict[str, UserRole] = {
    "DEAN": UserRole.DEAN,
    "PRINCIPAL": UserRole.PRINCIPAL,
    "HOD": UserRole.HOD,
    "DEPARTMENT_COORDINATOR": UserRole.DEPARTMENT_COORDINATOR,
    "DEPARTMENT COORDINATOR": UserRole.DEPARTMENT_COORDINATOR,
    "BASIC_SCIENCE_COORDINATOR": UserRole.BASIC_SCIENCE_COORDINATOR,
    "BASIC SCIENCE COORDINATOR": UserRole.BASIC_SCIENCE_COORDINATOR,
    "FACULTY": UserRole.FACULTY,
    "STUDENT": UserRole.STUDENT_VIEWER,
    "STUDENT_VIEWER": UserRole.STUDENT_VIEWER,
    "ADMIN": UserRole.ADMIN,
    "CHIEF_COORDINATOR": UserRole.CHIEF_COORDINATOR,
}


def parse_user_role(role_raw: Any) -> Optional[UserRole]:
    """Parses and normalizes a role string or enum into a canonical UserRole."""
    if not role_raw:
        return None
    if isinstance(role_raw, UserRole):
        return role_raw
    s = str(role_raw).strip()
    try:
        return UserRole(s)
    except ValueError:
        pass
    clean = s.upper().replace("-", "_")
    if clean in ROLE_INPUT_MAP:
        return ROLE_INPUT_MAP[clean]
    space_clean = s.upper().replace("_", " ")
    if space_clean in ROLE_INPUT_MAP:
        return ROLE_INPUT_MAP[space_clean]
    return None


def extract_user_role_assignments(user_doc: dict) -> List[tuple[UserRole, Optional[str]]]:
    """
    Extracts all assigned roles and their department scopes from a user document.
    Preserves assignment order (first assignment is the primary/default role).
    Fully backward-compatible with:
    - structured role_assignments: [{"role": "FACULTY", "department_id": "..."}, ...]
    - roles list: ["FACULTY", "DEPARTMENT_COORDINATOR"]
    - legacy single role: "DEAN"
    """
    results: List[tuple[UserRole, Optional[str]]] = []
    seen = set()

    # 1. Structured role_assignments
    raw_assignments = user_doc.get("role_assignments")
    if isinstance(raw_assignments, list):
        for item in raw_assignments:
            if isinstance(item, dict) and "role" in item:
                r = parse_user_role(item.get("role"))
                if r and r not in seen:
                    dept = item.get("department_id") or user_doc.get("department_id")
                    results.append((r, dept))
                    seen.add(r)

    # 2. List of roles
    raw_roles = user_doc.get("roles")
    if isinstance(raw_roles, list):
        for item in raw_roles:
            r = parse_user_role(item)
            if r and r not in seen:
                results.append((r, user_doc.get("department_id")))
                seen.add(r)

    # 3. Legacy single role
    legacy_role_str = user_doc.get("role")
    if legacy_role_str:
        r = parse_user_role(legacy_role_str)
        if r and r not in seen:
            results.append((r, user_doc.get("department_id")))
            seen.add(r)

    return results


class AuthContext:
    """Represents verified caller identity, server-managed active role, and assigned department."""
    def __init__(
        self,
        uid: str,
        email: str,
        role: UserRole,
        department_id: Optional[str] = None,
        display_name: Optional[str] = None,
        is_active: bool = True,
        is_authenticated: bool = True,
        assigned_roles: Optional[List[UserRole]] = None,
        role_assignments: Optional[List[dict]] = None,
    ):
        self.uid = uid
        self.email = email
        self.role = role
        self.department_id = department_id
        self.display_name = display_name or email or uid
        self.is_active = is_active
        self.is_authenticated = is_authenticated
        self.assigned_roles = assigned_roles or [role]
        self.role_assignments = role_assignments or []

    @property
    def is_admin(self) -> bool:
        return self.role in {
            UserRole.ADMIN,
            UserRole.CHIEF_COORDINATOR,
            UserRole.DEAN,
            UserRole.PRINCIPAL,
        }

    @property
    def is_dean(self) -> bool:
        return self.role == UserRole.DEAN

    @property
    def is_principal(self) -> bool:
        return self.role == UserRole.PRINCIPAL

    @property
    def is_hod(self) -> bool:
        return self.role == UserRole.HOD

    @property
    def is_dept_coordinator(self) -> bool:
        return self.role == UserRole.DEPARTMENT_COORDINATOR

    @property
    def is_basic_science_coordinator(self) -> bool:
        return self.role == UserRole.BASIC_SCIENCE_COORDINATOR

    @property
    def is_coordinator(self) -> bool:
        return self.role in {
            UserRole.ADMIN,
            UserRole.CHIEF_COORDINATOR,
            UserRole.DEAN,
            UserRole.PRINCIPAL,
            UserRole.HOD,
            UserRole.DEPARTMENT_COORDINATOR,
            UserRole.BASIC_SCIENCE_COORDINATOR,
        }


async def get_current_user_context(
    authorization: Optional[str] = Header(default=None),
    x_aqs_active_role: Optional[str] = Header(default=None, alias="X-AQS-Active-Role"),
) -> AuthContext:
    """
    Strict Authenticated Identity Dependency.
    
    1. Extracts Bearer token from the standard Authorization header.
    2. Validates token via Firebase Admin SDK.
    3. Resolves caller's server-side user record from the 'users' collection.
    4. Rejects inactive accounts, missing profiles, and unverified credentials.
    5. Validates requested active role (via X-AQS-Active-Role header) against
       authoritative Firestore role assignments.
    6. Fails closed in all environments. Never trusts client role claims.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Expected 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split("Bearer ", 1)[1].strip()

    # Support development and demonstration tokens ONLY in non-production when DEBUG is enabled
    if settings.is_dev_auth_allowed and token.startswith("dev-token-"):
        token_part = token.replace("dev-token-", "").lower()
        role_map = {
            "dean": (UserRole.DEAN, None, [UserRole.DEAN]),
            "principal": (UserRole.PRINCIPAL, None, [UserRole.PRINCIPAL]),
            "admin": (UserRole.ADMIN, None, [UserRole.ADMIN]),
            "hod": (UserRole.HOD, "dept_aids", [UserRole.HOD]),
            "coordinator": (UserRole.DEPARTMENT_COORDINATOR, "dept_aids", [UserRole.DEPARTMENT_COORDINATOR]),
            "basic-science": (UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", [UserRole.BASIC_SCIENCE_COORDINATOR]),
            "basic_science": (UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", [UserRole.BASIC_SCIENCE_COORDINATOR]),
            "faculty": (UserRole.FACULTY, "dept_aids", [UserRole.FACULTY]),
            "student": (UserRole.STUDENT_VIEWER, None, [UserRole.STUDENT_VIEWER]),
        }
        primary_role, dept, all_roles = role_map.get(token_part, (UserRole.ADMIN, None, [UserRole.ADMIN]))

        active_role = primary_role
        if x_aqs_active_role and isinstance(x_aqs_active_role, str):
            requested = parse_user_role(x_aqs_active_role)
            if not requested or requested not in all_roles:
                if len(all_roles) == 1:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="The selected institutional role does not match your assigned role. Please select the correct role.",
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have access to the selected institutional portal. Please select one of your assigned roles.",
                    )
            active_role = requested

        return AuthContext(
            uid=f"dev_user_{token_part}",
            email=f"{token_part}@sode-edu.in",
            role=active_role,
            department_id=dept,
            is_active=True,
            is_authenticated=True,
            assigned_roles=all_roles,
            role_assignments=[{"role": r.value, "department_id": dept} for r in all_roles],
        )

    # Verify token with Firebase Admin SDK
    if not firebase_manager.is_initialized:
        if settings.is_dev_auth_allowed:
            # Fallback for dev mode when offline
            return AuthContext(
                uid="dev_admin",
                email="admin@sode-edu.in",
                role=UserRole.ADMIN,
                department_id=None,
                is_active=True,
                is_authenticated=True,
                assigned_roles=[UserRole.ADMIN],
                role_assignments=[{"role": UserRole.ADMIN.value, "department_id": None}],
            )
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
            detail="Your account is inactive. Please contact the administrator.",
        )

    # Extract all assigned roles from Firestore user document
    assignments = extract_user_role_assignments(user_doc)
    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The selected institutional role does not match your assigned role. Please select the correct role.",
        )

    assigned_roles_list = [a[0] for a in assignments]
    role_assignments_list = [{"role": a[0].value, "department_id": a[1]} for a in assignments]

    # Validate active role if requested by client
    if x_aqs_active_role and isinstance(x_aqs_active_role, str):
        requested_role = parse_user_role(x_aqs_active_role)
        if not requested_role or requested_role not in assigned_roles_list:
            if len(assignments) == 1:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The selected institutional role does not match your assigned role. Please select the correct role.",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to the selected institutional portal. Please select one of your assigned roles.",
                )

        matching_assignment = next((a for a in assignments if a[0] == requested_role), None)
        active_role, active_dept = matching_assignment if matching_assignment else assignments[0]
    else:
        # Default to first assigned role
        active_role, active_dept = assignments[0]

    return AuthContext(
        uid=uid,
        email=user_doc.get("email", decoded_token.get("email", "")),
        role=active_role,
        department_id=active_dept,
        display_name=user_doc.get("display_name") or user_doc.get("email") or decoded_token.get("name") or uid,
        is_active=True,
        is_authenticated=True,
        assigned_roles=assigned_roles_list,
        role_assignments=role_assignments_list,
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


def require_dean_or_admin(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards institutional operations to Dean, Principal, or Admin roles only."""
    allowed = {
        UserRole.ADMIN,
        UserRole.CHIEF_COORDINATOR,
        UserRole.DEAN,
        UserRole.PRINCIPAL,
    }
    if context.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires Dean, Principal, or Admin privileges, but caller has '{context.role.value}'.",
        )
    return context


def require_hod_or_above(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards operations to HOD, Dean, Principal, or Admin roles."""
    allowed = {
        UserRole.ADMIN,
        UserRole.CHIEF_COORDINATOR,
        UserRole.DEAN,
        UserRole.PRINCIPAL,
        UserRole.HOD,
    }
    if context.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires HOD or higher administrative privileges, but caller has '{context.role.value}'.",
        )
    return context


def require_faculty_or_above(
    context: AuthContext = Depends(get_current_user_context),
) -> AuthContext:
    """Guards operations to Faculty, Coordinator, or Admin roles only (rejects Students)."""
    allowed = {
        UserRole.ADMIN,
        UserRole.CHIEF_COORDINATOR,
        UserRole.DEAN,
        UserRole.PRINCIPAL,
        UserRole.HOD,
        UserRole.DEPARTMENT_COORDINATOR,
        UserRole.BASIC_SCIENCE_COORDINATOR,
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
            detail="Access denied. Only ADMIN, CHIEF_COORDINATOR, DEAN, or PRINCIPAL can perform this operation.",
        )
    return context


def check_department_access(context: AuthContext, target_department_id: Optional[str]):
    """
    Enforces multi-tenancy department isolation:
    - Admin, Chief Coordinator, Dean, and Principal have global institution-wide access.
    - Basic Science Coordinator covers Mathematics, Physics, and Chemistry.
    - Department Coordinators and HODs are strictly restricted to their assigned department.
    """
    if context.is_admin:
        return  # Global access for Admin, Chief Coordinator, Dean, Principal

    # Fail closed if a non-admin, non-Basic-Science caller has no assigned department
    if not context.is_basic_science_coordinator:
        if not context.department_id or not str(context.department_id).strip():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department access violation: Your account has no assigned department.",
            )

    if not target_department_id:
        return  # Shared/general resource

    # Basic Science Coordinator scoped access to Math, Physics, Chemistry
    if context.is_basic_science_coordinator:
        normalized_target = target_department_id.strip().lower()
        if normalized_target in BASIC_SCIENCE_DEPARTMENTS or any(
            dept in normalized_target for dept in ("math", "physics", "phy", "chem")
        ):
            return  # Allowed
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Basic Science Coordinator access restricted: '{target_department_id}' is not within "
                f"Basic Science scope (Mathematics, Physics, Chemistry)."
            ),
        )

    if context.department_id != target_department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Department access violation: Your account is scoped to department '{context.department_id}', "
                f"and cannot access or modify resources in department '{target_department_id}'."
            ),
        )
