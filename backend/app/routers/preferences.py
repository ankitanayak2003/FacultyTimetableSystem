"""
Faculty Subject Preference & HOD Review/Finalization Router.
Supports the multi-stage department workflow:
1. Faculty submits up to three ranked subject preferences.
2. HOD reviews, accepts, or modifies preferences.
3. HOD finalizes the preferences.
4. Finalized preferences are retrieved by Department Coordinator for timetable generation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import FacultySubjectPreference, PreferenceStatus
from app.schemas.entities import (
    FacultyPreferenceSubmit,
    HODPreferenceReview,
    PreferenceFinalizeRequest,
)
from app.repositories import subject_preference_repository
from app.core.dependencies import (
    get_current_user_context,
    require_faculty_or_above,
    require_hod_or_above,
    require_coordinator_or_admin,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/preferences", tags=["Preferences"])


@router.get("", response_model=List[FacultySubjectPreference], include_in_schema=False)
@router.get("/", response_model=List[FacultySubjectPreference])
async def list_all_preferences(
    department_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    status: Optional[PreferenceStatus] = None,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Lists preferences with optional filters, enforcing department isolation for non-admins."""
    filters = {}
    if not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        if target_dept:
            filters["department_id"] = target_dept
    elif department_id:
        filters["department_id"] = department_id
    if academic_year:
        filters["academic_year"] = academic_year
    if semester is not None:
        filters["semester"] = semester
    if status is not None:
        filters["status"] = status.value
    return await subject_preference_repository.list_all(filters=filters, limit=500)


@router.post("/submit", response_model=FacultySubjectPreference, status_code=status.HTTP_201_CREATED)
async def submit_faculty_preferences(
    payload: FacultyPreferenceSubmit,
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """
    Faculty submits up to 3 ranked subject preferences.
    """
    check_department_access(auth_ctx, payload.department_id)

    pref_dicts = [p.model_dump() for p in payload.preferences]
    result = await subject_preference_repository.submit_preferences(
        faculty_id=auth_ctx.uid,
        department_id=payload.department_id,
        academic_year=payload.academic_year,
        semester=payload.semester,
        preferences_data=pref_dicts,
    )
    return result


@router.get("/my", response_model=Optional[FacultySubjectPreference])
async def get_my_preferences(
    academic_year: str,
    semester: int = Query(ge=1, le=8),
    auth_ctx: AuthContext = Depends(require_faculty_or_above),
):
    """Faculty retrieves their own submitted preferences for an academic year/semester."""
    doc_id = f"pref_{academic_year}_{semester}_{auth_ctx.uid}"
    return await subject_preference_repository.get_by_id(doc_id)


@router.get("/department", response_model=List[FacultySubjectPreference])
async def list_department_preferences(
    department_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    status: Optional[PreferenceStatus] = None,
    auth_ctx: AuthContext = Depends(require_hod_or_above),
):
    """HOD lists all faculty preferences within their department."""
    target_dept = department_id or auth_ctx.department_id
    check_department_access(auth_ctx, target_dept)

    filters = {"department_id": target_dept}
    if academic_year:
        filters["academic_year"] = academic_year
    if semester is not None:
        filters["semester"] = semester
    if status is not None:
        filters["status"] = status.value

    return await subject_preference_repository.list_all(filters=filters, limit=500)


@router.put("/{pref_id}/hod-review", response_model=FacultySubjectPreference)
async def review_preferences_by_hod(
    pref_id: str,
    payload: HODPreferenceReview,
    auth_ctx: AuthContext = Depends(require_hod_or_above),
):
    """HOD reviews, accepts, or modifies faculty subject preferences."""
    existing = await subject_preference_repository.get_or_raise(pref_id)
    check_department_access(auth_ctx, existing.get("department_id"))

    modified_list = (
        [p.model_dump() for p in payload.hod_modified_preferences]
        if payload.hod_modified_preferences is not None
        else None
    )

    return await subject_preference_repository.hod_review_preferences(
        pref_id=pref_id,
        status=payload.status,
        hod_comments=payload.hod_comments,
        hod_modified_preferences=modified_list,
    )


@router.post("/{pref_id}/finalize", response_model=FacultySubjectPreference)
async def finalize_preference(
    pref_id: str,
    payload: Optional[PreferenceFinalizeRequest] = None,
    auth_ctx: AuthContext = Depends(require_hod_or_above),
):
    """
    HOD finalizes a faculty preference submission.
    Once finalized, it automatically becomes available to the Department Coordinator.
    """
    existing = await subject_preference_repository.get_or_raise(pref_id)
    check_department_access(auth_ctx, existing.get("department_id"))

    finalized_by = (payload.finalized_by if payload and payload.finalized_by else auth_ctx.uid)
    return await subject_preference_repository.finalize_preference(
        pref_id=pref_id,
        finalized_by=finalized_by,
    )


@router.get("/coordinator/finalized", response_model=List[FacultySubjectPreference])
async def get_finalized_preferences_for_coordinator(
    department_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Department Coordinator retrieves finalized preferences to generate and edit department timetable.
    """
    target_dept = department_id or auth_ctx.department_id
    check_department_access(auth_ctx, target_dept)

    return await subject_preference_repository.get_finalized_preferences_for_coordinator(
        department_id=target_dept,
        academic_year=academic_year,
        semester=semester,
    )
