"""
Comprehensive unit and workflow tests for AQS Timetable foundational data models and workflows.
Validates:
1. Subject model: optional code, stable independent IDs, L:T:P parsing, lab flags.
2. Allotment model: locked flags, Dean-locked assignments, allocated hours sync.
3. FacultySubjectPreference model: ranked preferences (1-3), status transitions, validation.
4. User roles & AuthContext: DEAN, PRINCIPAL, BASIC_SCIENCE_COORDINATOR and department scoping.
5. End-to-end Preference Workflow:
   - Faculty submits 3 ranked preferences.
   - HOD reviews/modifies preferences.
   - Coordinator cannot see unfinalized preferences.
   - HOD finalizes preferences.
   - Department Coordinator retrieves finalized preferences.
6. Dean-locked allotment preservation during coordinator operations.
7. Authoritative workload calculation across departments and facilities.
"""

import pytest
from pydantic import ValidationError
from fastapi import HTTPException

from app.models.entities import (
    UserRole,
    Subject,
    SubjectType,
    Allotment,
    PreferenceStatus,
    RankedSubjectPreference,
    FacultySubjectPreference,
)
from app.core.dependencies import (
    AuthContext,
    check_department_access,
)
from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.repositories.collections import (
    SubjectRepository,
    FacultyRepository,
    AllotmentRepository,
    SubjectPreferenceRepository,
    WorkloadRecordRepository,
)
from app.core.exceptions import RelationshipValidationError


def sync_runner(coro):
    """
    Lightweight, synchronous coroutine trampoline for unit testing.
    Executes async def coroutines without requiring IOCP or socket loops,
    preventing anyio/proactor deadlocks in isolated sandboxes.
    """
    stack = [coro]
    val = None
    exc = None
    while stack:
        top = stack[-1]
        try:
            if exc:
                res = top.throw(exc)
                exc = None
            else:
                res = top.send(val)
            val = None
            if hasattr(res, "send"):
                stack.append(res)
            else:
                val = res
        except StopIteration as e:
            val = e.value
            stack.pop()
        except Exception as e:
            exc = e
            stack.pop()
            if not stack:
                raise
    return val


# ==============================================================================
# 1. Subject Data Model Tests
# ==============================================================================

def test_subject_code_optional_and_id_independent():
    """Course code must be optional, and ID must be stable and independent."""
    # Subject without code
    sub_no_code = Subject(
        id="sub_math_calc_01",
        course_name="Calculus and Linear Algebra",
        department_id="dept_math",
        semester=1,
        credits=4,
    )
    assert sub_no_code.id == "sub_math_calc_01"
    assert sub_no_code.code is None
    assert sub_no_code.course_name == "Calculus and Linear Algebra"
    assert sub_no_code.title == "Calculus and Linear Algebra"  # synced

    # Subject with explicit code
    sub_with_code = Subject(
        id="sub_cse_algo_01",
        code="21CS51",
        title="Design and Analysis of Algorithms",
        department_id="dept_cse",
        semester=5,
        credits=4,
    )
    assert sub_with_code.id == "sub_cse_algo_01"
    assert sub_with_code.code == "21CS51"
    assert sub_with_code.course_name == "Design and Analysis of Algorithms"  # synced


def test_subject_ltp_and_lab_handling():
    """Tests L:T:P format parsing, hour calculation, and lab requirements."""
    # Theory course with L:T:P = 3:1:0 -> 4 weekly hours
    sub_theory = Subject(
        id="sub_chem_01",
        course_name="Engineering Chemistry",
        department_id="dept_chemistry",
        semester=1,
        credits=4,
        l_t_p="3:1:0",
    )
    assert sub_theory.lecture_hours == 3
    assert sub_theory.tutorial_hours == 1
    assert sub_theory.practical_hours == 0
    assert sub_theory.weekly_hours == 4
    assert sub_theory.is_lab is False

    # Lab course with L:T:P = 0:0:2 -> practical=2, is_lab=True
    sub_lab = Subject(
        id="sub_phy_lab_01",
        course_name="Engineering Physics Laboratory",
        department_id="dept_physics",
        semester=2,
        credits=2,
        l_t_p="0:0:2",
        lab_batch_count=2,
    )
    assert sub_lab.lecture_hours == 0
    assert sub_lab.tutorial_hours == 0
    assert sub_lab.practical_hours == 2
    assert sub_lab.is_lab is True
    assert sub_lab.lab_batch_count == 2


# ==============================================================================
# 2. Allotment Model Tests & Dean-Lock
# ==============================================================================

def test_allotment_model_fields_and_hours_sync():
    """Allotment identifies academic year, semester, department, subject, faculty, section, and hours."""
    alt = Allotment(
        id="alt_2026_5_cse_algo_a",
        academic_year="2026-2027",
        semester=5,
        department_id="dept_cse",
        subject_id="sub_cse_algo_01",
        faculty_id="fac_cse_01",
        section="A",
        allocated_hours=4,
        is_locked=True,
        locked_by="usr_dean_academic",
        lock_reason="Institutional core requirement locked by Dean",
    )
    assert alt.academic_year == "2026-2027"
    assert alt.semester == 5
    assert alt.weekly_hours_allocated == 4  # synced
    assert alt.allocated_hours == 4
    assert alt.is_locked is True
    assert alt.locked_by == "usr_dean_academic"
    assert alt.lock_reason is not None


# ==============================================================================
# 3. Faculty Subject Preference Model Tests
# ==============================================================================

def test_faculty_preference_validation():
    """Faculty can submit up to 3 distinct ranked preferences."""
    valid_prefs = [
        RankedSubjectPreference(preference_rank=1, subject_id="sub_math_01", notes="First choice"),
        RankedSubjectPreference(preference_rank=2, subject_id="sub_math_02", notes="Second choice"),
        RankedSubjectPreference(preference_rank=3, subject_id="sub_math_03", notes="Third choice"),
    ]

    fpref = FacultySubjectPreference(
        id="pref_2026_1_fac01",
        faculty_id="fac_math_01",
        faculty_name="Dr. Ramanujan",
        department_id="dept_math",
        academic_year="2026-2027",
        semester=1,
        preferences=valid_prefs,
        status=PreferenceStatus.SUBMITTED,
    )
    assert len(fpref.preferences) == 3
    assert fpref.status == PreferenceStatus.SUBMITTED

    # More than 3 preferences rejected
    with pytest.raises(ValidationError):
        FacultySubjectPreference(
            id="pref_bad",
            faculty_id="fac_01",
            department_id="dept_cse",
            academic_year="2026-2027",
            semester=5,
            preferences=[
                RankedSubjectPreference(preference_rank=1, subject_id="s1"),
                RankedSubjectPreference(preference_rank=2, subject_id="s2"),
                RankedSubjectPreference(preference_rank=3, subject_id="s3"),
                RankedSubjectPreference(preference_rank=1, subject_id="s4"),  # 4th choice
            ],
        )

    # Duplicate ranks rejected (e.g. two rank 1s)
    with pytest.raises(ValidationError):
        FacultySubjectPreference(
            id="pref_bad_ranks",
            faculty_id="fac_01",
            department_id="dept_cse",
            academic_year="2026-2027",
            semester=5,
            preferences=[
                RankedSubjectPreference(preference_rank=1, subject_id="s1"),
                RankedSubjectPreference(preference_rank=1, subject_id="s2"),
            ],
        )


# ==============================================================================
# 4. User Roles and Scoping Tests (Dean, Principal, Basic Science Coordinator)
# ==============================================================================

def test_user_roles_and_administrative_hierarchy():
    """Verifies new roles and administrative authority."""
    dean_ctx = AuthContext(
        uid="dean_01",
        email="dean@college.edu",
        role=UserRole.DEAN,
    )
    assert dean_ctx.is_dean is True
    assert dean_ctx.is_admin is True
    assert dean_ctx.is_coordinator is True

    principal_ctx = AuthContext(
        uid="principal_01",
        email="principal@college.edu",
        role=UserRole.PRINCIPAL,
    )
    assert principal_ctx.is_principal is True
    assert principal_ctx.is_admin is True

    bsc_ctx = AuthContext(
        uid="bsc_01",
        email="bsc@college.edu",
        role=UserRole.BASIC_SCIENCE_COORDINATOR,
        department_id="basic_science",
    )
    assert bsc_ctx.is_basic_science_coordinator is True
    assert bsc_ctx.is_coordinator is True
    assert bsc_ctx.is_admin is False


def test_basic_science_and_department_scoping():
    """Basic Science Coordinator can access Math, Physics, and Chemistry, but not other branches."""
    bsc_ctx = AuthContext(
        uid="bsc_01",
        email="bsc@college.edu",
        role=UserRole.BASIC_SCIENCE_COORDINATOR,
        department_id="basic_science",
    )

    # Allowed basic science departments
    check_department_access(bsc_ctx, "dept_math")
    check_department_access(bsc_ctx, "physics")
    check_department_access(bsc_ctx, "chemistry")
    check_department_access(bsc_ctx, "dept_basic_science")

    # Disallowed engineering branch
    with pytest.raises(HTTPException) as exc_info:
        check_department_access(bsc_ctx, "dept_mechanical")
    assert exc_info.value.status_code == 403
    assert "not within Basic Science scope" in exc_info.value.detail

    # Department Coordinator restricted strictly to assigned department
    cse_coord = AuthContext(
        uid="coord_cse_01",
        email="cse.coord@college.edu",
        role=UserRole.DEPARTMENT_COORDINATOR,
        department_id="dept_cse",
    )
    check_department_access(cse_coord, "dept_cse")
    with pytest.raises(HTTPException):
        check_department_access(cse_coord, "dept_ece")


# ==============================================================================
# 5. Full Preference Workflow Lifecycle via Repository
# ==============================================================================

def test_full_preference_workflow_lifecycle():
    """
    Tests the complete 4-stage workflow:
    1. Faculty submits up to 3 preferences.
    2. HOD reviews and modifies.
    3. Coordinator cannot retrieve unfinalized preferences.
    4. HOD finalizes.
    5. Department Coordinator retrieves finalized preferences.
    """
    mock_client = MockFirestoreClient()
    firebase_manager._db = mock_client
    firebase_manager._is_initialized = True

    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()
    pref_repo = SubjectPreferenceRepository(faculty_repo=fac_repo, subject_repo=sub_repo)

    async def workflow_flow():
        # Setup test faculty & subjects
        await fac_repo.create("fac_cse_01", {
            "name": "Prof. Alan Turing",
            "email": "turing@college.edu",
            "department_id": "dept_cse",
            "designation": "Professor",
        })
        await sub_repo.create("sub_toc", {
            "course_name": "Theory of Computation",
            "department_id": "dept_cse",
            "semester": 5,
            "credits": 4,
        })
        await sub_repo.create("sub_os", {
            "course_name": "Operating Systems",
            "department_id": "dept_cse",
            "semester": 5,
            "credits": 4,
        })

        # 1. Faculty submits 2 preferences
        pref = await pref_repo.submit_preferences(
            faculty_id="fac_cse_01",
            department_id="dept_cse",
            academic_year="2026-2027",
            semester=5,
            preferences_data=[
                {"preference_rank": 1, "subject_id": "sub_toc", "notes": "Primary specialization"},
                {"preference_rank": 2, "subject_id": "sub_os", "notes": "Secondary"},
            ],
        )
        assert pref["status"] == PreferenceStatus.SUBMITTED.value
        assert len(pref["preferences"]) == 2

        # 2. HOD reviews and modifies
        reviewed = await pref_repo.hod_review_preferences(
            pref_id=pref["id"],
            status=PreferenceStatus.HOD_MODIFIED,
            hod_comments="Assigned TOC as primary lead instructor",
        )
        assert reviewed["status"] == PreferenceStatus.HOD_MODIFIED.value
        assert reviewed["hod_comments"] == "Assigned TOC as primary lead instructor"

        # At this stage, coordinator query should NOT return it because it is not yet FINALIZED
        coord_list_early = await pref_repo.get_finalized_preferences_for_coordinator(
            department_id="dept_cse",
            academic_year="2026-2027",
            semester=5,
        )
        assert len(coord_list_early) == 0

        # 3. HOD finalizes preference
        finalized = await pref_repo.finalize_preference(
            pref_id=pref["id"],
            finalized_by="usr_hod_cse",
        )
        assert finalized["status"] == PreferenceStatus.FINALIZED.value
        assert finalized["finalized_by"] == "usr_hod_cse"
        assert finalized["finalized_at"] is not None

        # 4. Department Coordinator automatically retrieves finalized preference
        coord_list = await pref_repo.get_finalized_preferences_for_coordinator(
            department_id="dept_cse",
            academic_year="2026-2027",
            semester=5,
        )
        assert len(coord_list) == 1
        assert coord_list[0]["id"] == pref["id"]
        assert coord_list[0]["status"] == PreferenceStatus.FINALIZED.value

    sync_runner(workflow_flow())


# ==============================================================================
# 6. Dean-Locked Allotment Preservation Tests
# ==============================================================================

def test_dean_locked_allotment_preservation():
    """Dean-locked allotments cannot be modified or deleted without administrative override."""
    mock_client = MockFirestoreClient()
    firebase_manager._db = mock_client
    firebase_manager._is_initialized = True

    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()
    alt_repo = AllotmentRepository(faculty_repo=fac_repo, subject_repo=sub_repo)

    async def lock_flow():
        await fac_repo.create("fac_dean_01", {
            "name": "Dr. Dean",
            "email": "dean.fac@college.edu",
            "department_id": "dept_cse",
            "designation": "Professor",
        })
        await sub_repo.create("sub_core", {
            "course_name": "Core Mathematics",
            "department_id": "dept_cse",
            "semester": 1,
            "credits": 4,
        })

        # Create locked allotment
        alt = await alt_repo.create("alt_locked_01", {
            "academic_year": "2026-2027",
            "semester": 1,
            "department_id": "dept_cse",
            "subject_id": "sub_core",
            "faculty_id": "fac_dean_01",
            "section": "A",
            "weekly_hours_allocated": 4,
            "is_locked": True,
            "locked_by": "dean_01",
        })
        assert alt["is_locked"] is True

        # Non-administrative coordinator attempt to update fails
        with pytest.raises(RelationshipValidationError) as exc_update:
            await alt_repo.update("alt_locked_01", {"section": "B"}, override_lock=False)
        assert "locked by the Dean" in str(exc_update.value)

        # Non-administrative coordinator attempt to delete fails
        with pytest.raises(RelationshipValidationError) as exc_del:
            await alt_repo.delete("alt_locked_01", override_lock=False)
        assert "locked by the Dean" in str(exc_del.value)

        # Dean/Admin override succeeds
        updated = await alt_repo.update("alt_locked_01", {"section": "B"}, override_lock=True)
        assert updated["section"] == "B"

        # Dean unlocks allotment
        unlocked = await alt_repo.unlock_allotment("alt_locked_01")
        assert unlocked["is_locked"] is False

        # Now regular update succeeds
        await alt_repo.update("alt_locked_01", {"section": "C"}, override_lock=False)

    sync_runner(lock_flow())


# ==============================================================================
# 7. Authoritative Workload Calculation Tests
# ==============================================================================

def test_authoritative_workload_calculation_across_departments():
    """
    Workload is calculated strictly from authoritative allotments,
    including cross-department teaching (e.g. Basic Science faculty in Engineering sections).
    """
    mock_client = MockFirestoreClient()
    firebase_manager._db = mock_client
    firebase_manager._is_initialized = True

    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()
    alt_repo = AllotmentRepository(faculty_repo=fac_repo, subject_repo=sub_repo)
    wl_repo = WorkloadRecordRepository(faculty_repo=fac_repo, allotment_repo=alt_repo, subject_repo=sub_repo)

    async def workload_flow():
        # Setup faculty (max 16 hours)
        await fac_repo.create("fac_math_ramanujan", {
            "name": "Dr. S. Ramanujan",
            "email": "ramanujan@college.edu",
            "department_id": "dept_math",
            "designation": "Professor",
            "max_weekly_hours": 16,
        })

        # Theory subject 1 (CSE Section A)
        await sub_repo.create("sub_math_cse", {
            "course_name": "Calculus for CSE",
            "department_id": "dept_cse",
            "semester": 1,
            "credits": 4,
            "subject_type": "THEORY",
        })
        # Theory subject 2 (ECE Section B)
        await sub_repo.create("sub_math_ece", {
            "course_name": "Linear Algebra for ECE",
            "department_id": "dept_ece",
            "semester": 1,
            "credits": 4,
            "subject_type": "THEORY",
        })
        # Lab subject 3 (CSE Section A Lab)
        await sub_repo.create("sub_math_lab", {
            "course_name": "Computational Math Lab",
            "department_id": "dept_cse",
            "semester": 1,
            "credits": 2,
            "subject_type": "LAB",
            "is_lab": True,
        })

        # Allotments across departments
        await alt_repo.create("alt_cse_math", {
            "academic_year": "2026-2027",
            "semester": 1,
            "department_id": "dept_cse",
            "subject_id": "sub_math_cse",
            "faculty_id": "fac_math_ramanujan",
            "section": "A",
            "weekly_hours_allocated": 4,
        })
        await alt_repo.create("alt_ece_math", {
            "academic_year": "2026-2027",
            "semester": 1,
            "department_id": "dept_ece",
            "subject_id": "sub_math_ece",
            "faculty_id": "fac_math_ramanujan",
            "section": "B",
            "weekly_hours_allocated": 4,
        })
        await alt_repo.create("alt_cse_lab", {
            "academic_year": "2026-2027",
            "semester": 1,
            "department_id": "dept_cse",
            "subject_id": "sub_math_lab",
            "faculty_id": "fac_math_ramanujan",
            "section": "A1",
            "weekly_hours_allocated": 4,
        })

        # Server-side authoritative workload calculation
        wl = await wl_repo.calculate_faculty_workload("fac_math_ramanujan", "2026-2027")
        assert wl["total_theory_hours"] == 8.0  # 4 (CSE) + 4 (ECE)
        assert wl["total_lab_hours"] == 4.0     # 4 (CSE Lab)
        assert wl["total_hours"] == 12.0
        assert wl["max_allowed_hours"] == 16
        assert wl["is_overloaded"] is False
        assert len(wl["allotment_ids"]) == 3

        # Add overload allotment (5 more hours -> 17 > 16)
        await alt_repo.create("alt_extra", {
            "academic_year": "2026-2027",
            "semester": 1,
            "department_id": "dept_cse",
            "subject_id": "sub_math_cse",
            "faculty_id": "fac_math_ramanujan",
            "section": "C",
            "weekly_hours_allocated": 5,
        })

        wl_overloaded = await wl_repo.calculate_faculty_workload("fac_math_ramanujan", "2026-2027")
        assert wl_overloaded["total_hours"] == 17.0
        assert wl_overloaded["is_overloaded"] is True

    sync_runner(workload_flow())


# ==============================================================================
# 8. Preferences & Allotments Router Handler Tests
# ==============================================================================

def test_preferences_router_handlers():
    """Validates preference router endpoint handlers directly with AuthContext."""
    from app.routers.preferences import (
        submit_faculty_preferences,
        review_preferences_by_hod,
        finalize_preference,
        get_finalized_preferences_for_coordinator,
    )
    from app.schemas.entities import (
        FacultyPreferenceSubmit,
        RankedPreferenceInput,
        HODPreferenceReview,
    )

    mock_client = MockFirestoreClient()
    firebase_manager._db = mock_client
    firebase_manager._is_initialized = True

    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()

    async def router_flow():
        await fac_repo.create("fac_cse_02", {
            "name": "Dr. Dijkstra",
            "email": "dijkstra@college.edu",
            "department_id": "dept_cse",
            "designation": "Professor",
        })
        await sub_repo.create("sub_algo", {
            "course_name": "Advanced Algorithms",
            "department_id": "dept_cse",
            "semester": 6,
            "credits": 4,
        })

        # 1. Faculty submits
        fac_ctx = AuthContext(uid="fac_cse_02", email="dijkstra@college.edu", role=UserRole.FACULTY, department_id="dept_cse")
        submit_payload = FacultyPreferenceSubmit(
            academic_year="2026-2027",
            semester=6,
            department_id="dept_cse",
            preferences=[
                RankedPreferenceInput(preference_rank=1, subject_id="sub_algo", notes="Algorithms lead"),
            ],
        )
        res_submit = await submit_faculty_preferences(submit_payload, auth_ctx=fac_ctx)
        assert res_submit["status"] == PreferenceStatus.SUBMITTED.value
        pref_id = res_submit["id"]

        # 2. HOD reviews
        hod_ctx = AuthContext(uid="hod_cse_01", email="hod@college.edu", role=UserRole.HOD, department_id="dept_cse")
        review_payload = HODPreferenceReview(status=PreferenceStatus.HOD_MODIFIED, hod_comments="Approved")
        res_review = await review_preferences_by_hod(pref_id, review_payload, auth_ctx=hod_ctx)
        assert res_review["status"] == PreferenceStatus.HOD_MODIFIED.value

        # Coordinator check: not finalized yet
        coord_ctx = AuthContext(uid="coord_01", email="c@college.edu", role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
        res_early = await get_finalized_preferences_for_coordinator(
            department_id="dept_cse", academic_year="2026-2027", semester=6, auth_ctx=coord_ctx
        )
        assert len(res_early) == 0

        # 3. HOD finalizes
        res_final = await finalize_preference(pref_id, payload=None, auth_ctx=hod_ctx)
        assert res_final["status"] == PreferenceStatus.FINALIZED.value
        assert res_final["finalized_by"] == "hod_cse_01"

        # 4. Coordinator gets finalized
        res_coord = await get_finalized_preferences_for_coordinator(
            department_id="dept_cse", academic_year="2026-2027", semester=6, auth_ctx=coord_ctx
        )
        assert len(res_coord) == 1
        assert res_coord[0]["id"] == pref_id

    sync_runner(router_flow())


def test_allotments_router_handlers_with_dean_lock():
    """Validates allotment router lock enforcement and Dean override directly with AuthContext."""
    from app.routers.allotments import (
        create_allotment,
        update_allotment,
        delete_allotment,
        unlock_allotment,
    )
    from app.schemas.entities import AllotmentCreate, AllotmentUpdate

    mock_client = MockFirestoreClient()
    firebase_manager._db = mock_client
    firebase_manager._is_initialized = True

    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()

    async def allotment_router_flow():
        await fac_repo.create("fac_dean_test", {
            "name": "Dr. Euler",
            "email": "euler@college.edu",
            "department_id": "dept_cse",
            "designation": "Professor",
        })
        await sub_repo.create("sub_graph", {
            "course_name": "Graph Theory",
            "department_id": "dept_cse",
            "semester": 6,
            "credits": 4,
        })

        coord_ctx = AuthContext(uid="coord_01", email="c@college.edu", role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
        dean_ctx = AuthContext(uid="dean_01", email="dean@college.edu", role=UserRole.DEAN, department_id=None)

        # 1. Non-Dean attempts to create locked allotment -> raises HTTPException 403
        locked_payload = AllotmentCreate(
            id="alt_locked_test",
            academic_year="2026-2027",
            semester=6,
            department_id="dept_cse",
            subject_id="sub_graph",
            faculty_id="fac_dean_test",
            section="A",
            weekly_hours_allocated=4,
            is_locked=True,
        )
        with pytest.raises(HTTPException) as exc_info:
            await create_allotment(locked_payload, auth_ctx=coord_ctx)
        assert exc_info.value.status_code == 403

        # 2. Dean creates locked allotment -> succeeds
        created = await create_allotment(locked_payload, auth_ctx=dean_ctx)
        assert created["is_locked"] is True
        assert created["locked_by"] == "dean_01"

        # 3. Coordinator attempts to update -> blocked by lock
        with pytest.raises(RelationshipValidationError):
            await update_allotment("alt_locked_test", AllotmentUpdate(section="B"), auth_ctx=coord_ctx)

        # 4. Coordinator attempts to delete -> blocked by lock
        with pytest.raises(RelationshipValidationError):
            await delete_allotment("alt_locked_test", auth_ctx=coord_ctx)

        # 5. Dean can unlock
        unlocked = await unlock_allotment("alt_locked_test", auth_ctx=dean_ctx)
        assert unlocked["is_locked"] is False

        # 6. Coordinator can now update unlocked allotment
        updated = await update_allotment("alt_locked_test", AllotmentUpdate(section="C"), auth_ctx=coord_ctx)
        assert updated["section"] == "C"

    sync_runner(allotment_router_flow())
