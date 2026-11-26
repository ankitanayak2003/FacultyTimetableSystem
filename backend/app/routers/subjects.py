"""Subjects and VTU curriculum course catalog router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import Subject, SubjectType
from app.schemas.entities import SubjectCreate, SubjectUpdate
from app.repositories import (
    subject_repository,
    allotment_repository,
    timetable_slot_repository,
)
from app.core.dependencies import (
    get_current_user_context,
    require_coordinator_or_admin,
    check_department_access,
    BASIC_SCIENCE_DEPARTMENTS,
    is_basic_science_subject_doc,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/subjects", tags=["Subjects"])


def _assert_subject_write_access(auth_ctx: AuthContext, department_id: Optional[str], subject_doc: dict):
    if auth_ctx.is_admin:
        return
    if department_id is None:
        if auth_ctx.is_basic_science_coordinator and is_basic_science_subject_doc(subject_doc):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Dean, Admin, or Basic Science Coordinator (for Math/Physics/Chemistry) can manage departmentless subjects.",
        )
    check_department_access(auth_ctx, department_id)


@router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers a course / subject in the VTU catalog for a department or First Year."""
    if payload.semester in (1, 2) and payload.department_id:
        norm_dept = payload.department_id.strip().lower()
        if norm_dept not in BASIC_SCIENCE_DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="First Year subjects (semesters 1-2) cannot be assigned to an engineering department.",
            )
    _assert_subject_write_access(auth_ctx, payload.department_id, payload.model_dump())
    doc_id = payload.id
    if not doc_id:
        if payload.code:
            clean_code = "".join(c if c.isalnum() else "_" for c in payload.code.lower()).strip("_")
            doc_id = f"sub_{clean_code}"
        else:
            name_val = payload.course_name or payload.title or "subject"
            clean_name = "".join(c if c.isalnum() else "_" for c in name_val.lower()).strip("_")
            doc_id = f"sub_{clean_name}_{payload.semester}"

    existing = await subject_repository.get_by_id(doc_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject with ID '{doc_id}' already exists in Firestore.",
        )

    data = payload.model_dump()
    data["id"] = doc_id
    created = await subject_repository.create(doc_id, data)
    return created


@router.get("", response_model=List[Subject], include_in_schema=False)
@router.get("/", response_model=List[Subject])
async def list_subjects(
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    subject_type: Optional[SubjectType] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Lists subjects filtered by department, semester, and type. Scoped by role/department."""
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

    if semester:
        filters["semester"] = semester
    if subject_type:
        filters["subject_type"] = subject_type.value
    results = await subject_repository.list_all(filters=filters, limit=limit, offset=offset)
    if auth_ctx.is_basic_science_coordinator and not department_id:
        results = [s for s in results if is_basic_science_subject_doc(s)]
    return results


@router.get("/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str,
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Fetches subject details by ID with role and department verification."""
    subject = await subject_repository.get_or_raise(subject_id)
    if auth_ctx.is_admin:
        return subject
    if auth_ctx.is_basic_science_coordinator:
        if not is_basic_science_subject_doc(subject):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Basic Science Coordinator access restricted to Mathematics, Physics, and Chemistry subjects.",
            )
        return subject
    if subject.get("department_id") is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to First Year departmentless subject.",
        )
    check_department_access(auth_ctx, subject.get("department_id"))
    return subject


@router.put("/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates subject details with department verification."""
    existing = await subject_repository.get_or_raise(subject_id)
    _assert_subject_write_access(auth_ctx, existing.get("department_id"), existing)
    updates = payload.model_dump(exclude_unset=True)
    if "department_id" in updates:
        _assert_subject_write_access(auth_ctx, updates["department_id"], {**existing, **updates})

    return await subject_repository.update(subject_id, updates)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a subject, verifying no active allotments or timetable slots reference it."""
    existing = await subject_repository.get_or_raise(subject_id)
    _assert_subject_write_access(auth_ctx, existing.get("department_id"), existing)

    # Referential Integrity Check: Reject deletion if subject has active allotments or timetable slots
    active_allotments = await allotment_repository.list_all(filters={"subject_id": subject_id}, limit=1)
    if active_allotments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete subject '{subject_id}': Active course allotments exist referencing this subject. "
                "Please reassign or remove these allotments first."
            ),
        )

    active_slots = await timetable_slot_repository.list_all(filters={"subject_id": subject_id}, limit=1)
    if active_slots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete subject '{subject_id}': Active timetable slots exist referencing this subject. "
                "Please clear or regenerate affected timetables first."
            ),
        )

    await subject_repository.delete(subject_id)
