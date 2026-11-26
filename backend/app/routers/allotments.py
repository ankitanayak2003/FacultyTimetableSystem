"""Faculty-Subject teaching allotment router with department scoping."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import Allotment
from app.schemas.entities import AllotmentCreate, AllotmentUpdate
from app.repositories import allotment_repository, subject_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    require_faculty_or_above,
    require_dean_or_admin,
    check_department_access,
    BASIC_SCIENCE_DEPARTMENTS,
    is_basic_science_subject_doc,
    AuthContext,
)
from app.core.realtime import realtime_broadcaster

router = APIRouter(prefix="/api/v1/allotments", tags=["Allotments"])


async def _validate_allotment_scope_access(
    auth_ctx: AuthContext,
    department_id: Optional[str],
    semester: Optional[int] = None,
    subject_id: Optional[str] = None,
) -> Optional[str]:
    """
    Validates First Year (department_id=None) and department-scoped access for allotment writes.
    Basic Science Coordinator is strictly limited to Mathematics, Physics, and Chemistry.
    """
    is_first_year = semester in (1, 2)
    effective_dept = department_id
    if is_first_year:
        if department_id and department_id.strip().lower() not in BASIC_SCIENCE_DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="First Year allocations (semesters 1-2) must have department_id = null and cannot use an engineering department.",
            )
        effective_dept = None

    if effective_dept is None:
        if auth_ctx.is_admin:
            return None
        if auth_ctx.is_basic_science_coordinator:
            if not subject_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Basic Science Coordinator requires a valid Basic Science subject reference.",
                )
            sub_doc = await subject_repository.get_by_id(subject_id)
            if not sub_doc or not is_basic_science_subject_doc(sub_doc):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Basic Science Coordinator can only manage Mathematics, Physics, and Chemistry allocations.",
                )
            return None
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Dean, Admin, or Basic Science Coordinator (for Math/Physics/Chemistry) can manage First Year allocations.",
        )

    check_department_access(auth_ctx, effective_dept)
    return effective_dept


@router.post("/", response_model=Allotment, status_code=status.HTTP_201_CREATED)
async def create_allotment(
    payload: AllotmentCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Allots a subject to a faculty member.
    Verifies department ownership and referential integrity for faculty and subject.
    Dean/Admin can create locked institutional allotments.
    """
    effective_dept = await _validate_allotment_scope_access(
        auth_ctx, payload.department_id, payload.semester, payload.subject_id
    )
    if payload.is_locked and not auth_ctx.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Dean or Institutional Admin can create locked allotments.",
        )
    dump_data = payload.model_dump()
    dump_data["department_id"] = effective_dept
    if payload.is_locked:
        dump_data["locked_by"] = auth_ctx.uid
    created = await allotment_repository.create(payload.id, dump_data)
    realtime_broadcaster.broadcast("ALLOTMENT_UPDATED", created["id"], {"department_id": effective_dept})
    return created


@router.put("/upsert", response_model=Allotment)
async def upsert_allotment(
    payload: AllotmentCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Idempotently creates or updates a subject-faculty allotment for a class scope.
    Prevents duplicate allotments on repeated saves.
    """
    effective_dept = await _validate_allotment_scope_access(
        auth_ctx, payload.department_id, payload.semester, payload.subject_id
    )
    if payload.is_locked and not auth_ctx.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Dean or Institutional Admin can lock allotments.",
        )
    dump_data = payload.model_dump()
    dump_data["department_id"] = effective_dept
    if payload.is_locked:
        dump_data["locked_by"] = auth_ctx.uid
    saved = await allotment_repository.upsert_for_scope(dump_data, override_lock=auth_ctx.is_admin)
    realtime_broadcaster.broadcast("ALLOTMENT_UPDATED", saved["id"], {"department_id": effective_dept})
    return saved


@router.get("", response_model=List[Allotment], include_in_schema=False)
@router.get("/", response_model=List[Allotment])
async def list_allotments(
    academic_year: Optional[str] = None,
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    faculty_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    section: Optional[str] = None,
    is_locked: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Lists course allotments with filters. Restricted to faculty and coordinators."""
    filters = {}
    if auth_ctx.is_admin:
        if department_id:
            filters["department_id"] = department_id
    elif auth_ctx.is_basic_science_coordinator:
        if department_id:
            check_department_access(auth_ctx, department_id)
            filters["department_id"] = department_id
    else:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        if not target_dept or not str(target_dept).strip():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department access violation: Caller has no assigned department.",
            )
        filters["department_id"] = target_dept

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
    if is_locked is not None:
        filters["is_locked"] = is_locked

    results = await allotment_repository.list_all(filters=filters, limit=limit, offset=offset)
    if auth_ctx.is_basic_science_coordinator and not department_id:
        filtered = []
        subject_cache: dict[str, Optional[dict]] = {}
        for a in results:
            dept = a.get("department_id")
            if dept is not None and str(dept).strip().lower() in BASIC_SCIENCE_DEPARTMENTS:
                filtered.append(a)
            elif dept is None:
                sid = a.get("subject_id")
                if sid:
                    if sid not in subject_cache:
                        subject_cache[sid] = await subject_repository.get_by_id(sid)
                    if is_basic_science_subject_doc(subject_cache[sid]):
                        filtered.append(a)
        results = filtered
    return results


@router.get("/{allotment_id}", response_model=Allotment)
async def get_allotment(
    allotment_id: str,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Fetches an allotment by ID with department verification."""
    alt = await allotment_repository.get_or_raise(allotment_id)
    check_department_access(auth_ctx, alt.get("department_id"))
    if alt.get("department_id") is None and not auth_ctx.is_admin:
        if not auth_ctx.is_basic_science_coordinator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to First Year departmentless allotment.",
            )
        subj_doc = await subject_repository.get_by_id(alt.get("subject_id")) if alt.get("subject_id") else None
        if not is_basic_science_subject_doc(subj_doc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Basic Science Coordinator can only view Basic Science subject allotments.",
            )
    return alt


@router.put("/{allotment_id}", response_model=Allotment)
async def update_allotment(
    allotment_id: str,
    payload: AllotmentUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates teaching allotment, respecting Dean locks unless caller has Dean/Admin override."""
    existing = await allotment_repository.get_or_raise(allotment_id)
    await _validate_allotment_scope_access(
        auth_ctx,
        existing.get("department_id"),
        existing.get("semester"),
        existing.get("subject_id"),
    )
    updated = await allotment_repository.update(
        allotment_id,
        payload.model_dump(exclude_unset=True),
        override_lock=auth_ctx.is_admin,
    )
    realtime_broadcaster.broadcast("ALLOTMENT_UPDATED", allotment_id, {"department_id": existing.get("department_id")})
    return updated


@router.delete("/{allotment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allotment(
    allotment_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes an allotment, respecting Dean locks unless caller has Dean/Admin override."""
    existing = await allotment_repository.get_or_raise(allotment_id)
    await _validate_allotment_scope_access(
        auth_ctx,
        existing.get("department_id"),
        existing.get("semester"),
        existing.get("subject_id"),
    )
    await allotment_repository.delete(allotment_id, override_lock=auth_ctx.is_admin)
    realtime_broadcaster.broadcast("ALLOTMENT_UPDATED", allotment_id, {"department_id": existing.get("department_id")})


@router.post("/{allotment_id}/lock", response_model=Allotment)
async def lock_allotment(
    allotment_id: str,
    reason: Optional[str] = None,
    auth_ctx: AuthContext = Depends(require_dean_or_admin),
):
    """Dean or Admin locks an institutional allotment to prevent coordinator modifications."""
    return await allotment_repository.lock_allotment(
        allotment_id, locked_by=auth_ctx.uid, reason=reason
    )


@router.post("/{allotment_id}/unlock", response_model=Allotment)
async def unlock_allotment(
    allotment_id: str,
    auth_ctx: AuthContext = Depends(require_dean_or_admin),
):
    """Dean or Admin unlocks an institutional allotment."""
    return await allotment_repository.unlock_allotment(allotment_id)
