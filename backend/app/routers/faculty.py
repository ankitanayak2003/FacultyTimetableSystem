"""
Faculty profile management router with strict department-wise access control.
Enforces multi-tenancy visibility rules:
- Dean / Principal / Admin: Global access to faculty across all departments.
- Basic Science Coordinator: Read-only access across all departments to view cross-department assignments,
  scoped write access to Basic Science only.
- Department Coordinator / HOD: Strictly isolated to assigned department.
- Faculty: Access to own department faculty and own profile.
"""

from typing import List, Optional
import logging
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import FacultyProfile, UserRole, User
from app.schemas.entities import (
    FacultyCreate,
    FacultyUpdate,
    FacultyLoginProvisionRequest,
    FacultyLoginProvisionResponse,
)
from app.repositories import (
    faculty_repository,
    allotment_repository,
    timetable_slot_repository,
    subject_preference_repository,
    user_repository,
)
from app.core.dependencies import (
    require_coordinator_or_admin,
    require_faculty_or_above,
    check_department_access,
    AuthContext,
)
from app.core.realtime import realtime_broadcaster
from app.core.firebase import firebase_manager
from firebase_admin import auth as fb_auth

logger = logging.getLogger("faculty_timetable.faculty")

router = APIRouter(prefix="/api/v1/faculty", tags=["Faculty"])


@router.post("/", response_model=FacultyProfile, status_code=status.HTTP_201_CREATED)
async def create_faculty(
    payload: FacultyCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers a faculty member. Scoped strictly by department ownership."""
    check_department_access(auth_ctx, payload.department_id)
    doc_id = payload.id
    if not doc_id:
        clean_dept = "".join(c if c.isalnum() else "_" for c in payload.department_id.lower()).strip("_")
        clean_name = "".join(c if c.isalnum() else "_" for c in payload.name.lower()).strip("_")
        doc_id = f"fac_{clean_dept}_{clean_name}"

    existing = await faculty_repository.get_by_id(doc_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Faculty member with ID '{doc_id}' already exists in Firestore.",
        )

    data = payload.model_dump()
    data["id"] = doc_id
    created = await faculty_repository.create(doc_id, data)
    realtime_broadcaster.broadcast("FACULTY_CREATED", doc_id, {"name": payload.name, "department_id": payload.department_id})
    return created


@router.get("", response_model=List[FacultyProfile], include_in_schema=False)
@router.get("/", response_model=List[FacultyProfile])
async def list_faculty(
    department_id: Optional[str] = None,
    designation: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """
    Lists faculty profiles with strict multi-tenancy isolation:
    - Dean / Principal / Admin: Can view faculty from every department.
    - Basic Science Coordinator: Can view faculty across all departments (to inspect cross-department teaching).
    - Department Coordinator / HOD: Restricted strictly to their assigned department.
    """
    filters = {}

    if auth_ctx.is_dean or auth_ctx.is_principal or auth_ctx.is_admin:
        # Global institutional view
        if department_id:
            filters["department_id"] = department_id
    elif auth_ctx.is_basic_science_coordinator:
        # Cross-department read access for Basic Science Coordinator
        if department_id:
            filters["department_id"] = department_id
    else:
        # Department Coordinator, HOD, or Faculty
        if department_id and department_id != auth_ctx.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied: Your account is scoped to department '{auth_ctx.department_id}' "
                    f"and cannot access faculty belonging to department '{department_id}'."
                ),
            )
        filters["department_id"] = auth_ctx.department_id

    if designation:
        filters["designation"] = designation
    if is_active is not None:
        filters["is_active"] = is_active

    return await faculty_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{faculty_id}", response_model=FacultyProfile)
async def get_faculty(
    faculty_id: str,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """
    Fetches a specific faculty profile by ID.
    Enforces that Department Coordinators cannot access faculty from other departments via URL manipulation.
    """
    fac = await faculty_repository.get_or_raise(faculty_id)
    fac_dept = fac.get("department_id")

    if auth_ctx.is_dean or auth_ctx.is_principal or auth_ctx.is_admin or auth_ctx.is_basic_science_coordinator:
        return fac

    if fac_dept != auth_ctx.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Access denied: Faculty '{faculty_id}' belongs to department '{fac_dept}'. "
                f"Your account only has access to department '{auth_ctx.department_id}'."
            ),
        )

    return fac


@router.put("/{faculty_id}", response_model=FacultyProfile)
async def update_faculty(
    faculty_id: str,
    payload: FacultyUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates faculty details. Verifies department ownership."""
    existing = await faculty_repository.get_or_raise(faculty_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    updated = await faculty_repository.update(faculty_id, payload.model_dump(exclude_unset=True))

    # Synchronize user active state if is_active changed
    if payload.is_active is not None:
        email = existing.get("email")
        if email:
            try:
                users = await user_repository.list_all(filters={"email": email}, limit=1)
                for u in users:
                    await user_repository.update(u["id"], {"is_active": payload.is_active})
                    if firebase_manager.is_initialized:
                        try:
                            fb_auth.update_user(u["id"], disabled=not payload.is_active)
                        except Exception:
                            pass
            except Exception as exc:
                logger.warning("Could not synchronize user active state for %s: %s", email, exc)

    realtime_broadcaster.broadcast("FACULTY_UPDATED", faculty_id, {"faculty_id": faculty_id})
    return updated


@router.post("/{faculty_id}/provision-login", response_model=FacultyLoginProvisionResponse)
async def provision_faculty_login(
    faculty_id: str,
    payload: FacultyLoginProvisionRequest = FacultyLoginProvisionRequest(),
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Provisions or toggles Firebase Authentication and Firestore user identity for a faculty member.
    Enforces strict department scoping:
    - Basic Science Coordinator can ONLY provision Basic Science faculty.
    - Department Coordinator can ONLY provision their assigned department's faculty.
    - Dean / Principal / Admin have institutional provisioning access.
    """
    fac = await faculty_repository.get_or_raise(faculty_id)
    target_dept = fac.get("department_id")
    check_department_access(auth_ctx, target_dept)

    email = fac.get("email")
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Faculty '{faculty_id}' has no valid institutional email configured for login provisioning.",
        )

    name = fac.get("name", "Faculty Member")
    uid = None

    if firebase_manager.is_initialized:
        try:
            fb_user = None
            try:
                fb_user = fb_auth.get_user_by_email(email)
            except fb_auth.UserNotFoundError:
                fb_user = None
            except Exception as exc:
                logger.warning("Error looking up Firebase user for %s: %s", email, exc)

            if payload.enable_login:
                if fb_user is None:
                    fb_user = fb_auth.create_user(
                        email=email,
                        password=payload.password or "123456",
                        display_name=name,
                        email_verified=True,
                        disabled=False,
                    )
                else:
                    fb_auth.update_user(fb_user.uid, disabled=False)
                uid = fb_user.uid
            else:
                if fb_user is not None:
                    fb_auth.update_user(fb_user.uid, disabled=True)
                    uid = fb_user.uid
        except Exception as exc:
            logger.error("Firebase Authentication provisioning failed for %s: %s", email, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Firebase Authentication provisioning failed: {str(exc)}",
            )
    else:
        # Offline development or unit test mode
        uid = f"user_{faculty_id.replace('fac_', '')}"

    # Sync Firestore users/{uid} document
    if uid:
        user_doc = await user_repository.get_by_id(uid)
        if user_doc is None:
            if payload.enable_login:
                new_user = User(
                    id=uid,
                    email=email,
                    display_name=name,
                    role=UserRole.FACULTY,
                    department_id=target_dept,
                    is_active=True,
                )
                await user_repository.create(uid, new_user.model_dump())
        else:
            await user_repository.update(
                uid,
                {
                    "is_active": payload.enable_login,
                    "department_id": target_dept,
                    "role": UserRole.FACULTY.value,
                },
            )

    # Sync faculty record
    updated_fac = await faculty_repository.update(
        faculty_id,
        {
            "has_login_access": payload.enable_login,
            "is_active": payload.enable_login if payload.enable_login else fac.get("is_active", True),
        },
    )

    action_text = "enabled and provisioned" if payload.enable_login else "disabled and revoked"
    realtime_broadcaster.broadcast(
        "FACULTY_UPDATED",
        faculty_id,
        {"faculty_id": faculty_id, "has_login_access": payload.enable_login},
    )

    return FacultyLoginProvisionResponse(
        faculty_id=faculty_id,
        email=email,
        uid=uid,
        has_login_access=payload.enable_login,
        is_active=updated_fac.get("is_active", True),
        message=f"Faculty portal login access successfully {action_text} in Firebase Auth and Firestore.",
    )


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(
    faculty_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a faculty profile, verifying no active allotments or timetable slots exist."""
    existing = await faculty_repository.get_or_raise(faculty_id)
    check_department_access(auth_ctx, existing.get("department_id"))

    # Referential Integrity Check: Reject deletion if faculty is referenced in active academic records
    active_allotments = await allotment_repository.list_all(filters={"faculty_id": faculty_id}, limit=1)
    if active_allotments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete faculty '{faculty_id}': Active course allotments exist referencing this faculty member. "
                "Please reassign or delete these allotments first."
            ),
        )

    active_slots = await timetable_slot_repository.list_all(filters={"faculty_id": faculty_id}, limit=1)
    if active_slots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete faculty '{faculty_id}': Active timetable slots exist referencing this faculty member. "
                "Please regenerate or edit affected timetables first."
            ),
        )

    active_prefs = await subject_preference_repository.list_all(filters={"faculty_id": faculty_id}, limit=1)
    if active_prefs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete faculty '{faculty_id}': Active submitted subject preferences exist for this faculty member. "
                "Please clear these preference submissions first."
            ),
        )

    email = existing.get("email")
    if email:
        try:
            users = await user_repository.list_all(filters={"email": email}, limit=1)
            for u in users:
                await user_repository.update(u["id"], {"is_active": False})
                if firebase_manager.is_initialized:
                    try:
                        fb_auth.update_user(u["id"], disabled=True)
                    except Exception:
                        pass
        except Exception as exc:
            logger.warning("Could not revoke user access for deleted faculty %s: %s", email, exc)

    await faculty_repository.delete(faculty_id)
    realtime_broadcaster.broadcast("FACULTY_DELETED", faculty_id, {"faculty_id": faculty_id})
