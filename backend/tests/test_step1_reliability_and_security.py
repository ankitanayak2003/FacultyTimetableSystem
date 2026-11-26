"""
Step 1: Critical Backend Reliability & Draft Data Protection Unit Tests.
Strictly uses MockFirestoreClient and zero-dependency sync_runner (no live Firestore writes).
"""

import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.config import settings
from app.core.dependencies import AuthContext, get_current_user_context
from app.main import app, lifespan
from app.models.entities import (
    UserRole,
    TimetableStatus,
    SubjectType,
)
from app.schemas.entities import (
    SubjectCreate,
    FacultyCreate,
    DepartmentCreate,
    DepartmentUpdate,
    TimetableGenerationRequest,
)
from app.repositories import (
    subject_repository,
    faculty_repository,
    department_repository,
    allotment_repository,
    timetable_repository,
    timetable_slot_repository,
    subject_preference_repository,
    fixed_classroom_repository,
)
from app.routers.subjects import create_subject, list_subjects, get_subject
from app.routers.faculty import create_faculty
from app.routers.departments import update_department
from app.routers.timetables import (
    generate_timetable,
    get_department_timetables,
    get_faculty_master_timetable,
)
from app.routers.timetable_slots import list_timetable_slots
from app.routers.allotments import list_allotments
from app.routers.preferences import list_all_preferences


def sync_runner(coro):
    """Zero-dependency coroutine trampoline for sandbox-safe async execution."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


@pytest.fixture(autouse=True)
def mock_db_fixture(monkeypatch):
    client = MockFirestoreClient()
    monkeypatch.setattr(firebase_manager, "_db", client)
    monkeypatch.setattr(firebase_manager, "_is_initialized", True)
    yield client
    client.reset()


def make_auth(
    role: UserRole,
    department_id: str | None = "dept_aids",
    uid: str = "usr_test",
    is_authenticated: bool = True,
) -> AuthContext:
    return AuthContext(
        uid=uid,
        email=f"{uid}@sode-edu.in",
        role=role,
        department_id=department_id,
        is_active=True,
        is_authenticated=is_authenticated,
    )


# =====================================================================
# 1. Repository Method Fixes
# =====================================================================


def test_create_subject_and_faculty_use_get_by_id():
    admin_ctx = make_auth(UserRole.ADMIN, None, "usr_admin")

    sub = sync_runner(
        create_subject(
            SubjectCreate(
                id="sub_test_301",
                department_id="dept_aids",
                semester=3,
                code="BCS301",
                course_name="Mathematics for CS",
                subject_type=SubjectType.THEORY,
                weekly_hours=4,
            ),
            auth_ctx=admin_ctx,
        )
    )
    assert sub["id"] == "sub_test_301"

    # Duplicate should raise HTTPException 409 (and HTTPException must be imported)
    with pytest.raises(HTTPException) as exc:
        sync_runner(
            create_subject(
                SubjectCreate(
                    id="sub_test_301",
                    department_id="dept_aids",
                    semester=3,
                    code="BCS301",
                    course_name="Mathematics for CS",
                    subject_type=SubjectType.THEORY,
                    weekly_hours=4,
                ),
                auth_ctx=admin_ctx,
            )
        )
    assert exc.value.status_code == 409

    fac = sync_runner(
        create_faculty(
            FacultyCreate(
                id="fac_test_01",
                name="Dr. Test Faculty",
                email="testfac@sode-edu.in",
                department_id="dept_aids",
                designation="Professor",
            ),
            auth_ctx=admin_ctx,
        )
    )
    assert fac["id"] == "fac_test_01"

    with pytest.raises(HTTPException) as fac_exc:
        sync_runner(
            create_faculty(
                FacultyCreate(
                    id="fac_test_01",
                    name="Dr. Test Faculty",
                    email="testfac@sode-edu.in",
                    department_id="dept_aids",
                    designation="Professor",
                ),
                auth_ctx=admin_ctx,
            )
        )
    assert fac_exc.value.status_code == 409


def test_update_department_uses_update():
    admin_ctx = make_auth(UserRole.ADMIN, None, "usr_admin")
    sync_runner(
        department_repository.create(
            "dept_aids",
            {"id": "dept_aids", "name": "AI & DS", "code": "AIDS"},
        )
    )
    updated = sync_runner(
        update_department(
            "dept_aids",
            DepartmentUpdate(name="Artificial Intelligence & Data Science"),
            auth_ctx=admin_ctx,
        )
    )
    assert updated["name"] == "Artificial Intelligence & Data Science"


def test_generate_timetable_uses_get_by_id_and_handles_first_year_null_dept():
    admin_ctx = make_auth(UserRole.ADMIN, None, "usr_admin")
    sync_runner(
        subject_repository.create(
            "sub_fy_phy",
            {
                "id": "sub_fy_phy",
                "department_id": "dept_physics",
                "semester": 1,
                "code": "BPHYS102",
                "course_name": "Engineering Physics",
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 3,
                "lecture_hours": 3,
                "tutorial_hours": 0,
                "practical_hours": 0,
            },
        )
    )

    # First Year fixed classroom with department_id=None must not crash
    fcr = sync_runner(
        fixed_classroom_repository.get_or_create_fixed_classroom(
            department_id=None,
            academic_year="2026-2027",
            semester=1,
            section="A",
        )
    )
    assert fcr["department_id"] is None
    assert "firstyear" in fcr["id"]
    assert "FIRST YEAR" in fcr["classroom_name"]

    # generate_timetable with department_id=None and subject_ids should resolve via get_by_id
    res = sync_runner(
        generate_timetable(
            TimetableGenerationRequest(
                academic_year="2026-2027",
                semester=1,
                department_id=None,
                section="A",
                subject_ids=["sub_fy_phy"],
            ),
            auth_ctx=admin_ctx,
        )
    )
    assert res.status in ("OPTIMAL", "FEASIBLE")


# =====================================================================
# 2. Draft Timetable & Slot Protection
# =====================================================================


def test_draft_timetables_and_slots_hidden_from_anonymous_and_students(mock_db_fixture):
    mock_db = mock_db_fixture
    mock_db.collection("timetables").document("tt_draft_aids").set(
        {
            "id": "tt_draft_aids",
            "academic_year": "2026-2027",
            "semester": 3,
            "semester_type": "ODD",
            "department_id": "dept_aids",
            "section": "A",
            "status": TimetableStatus.DRAFT.value,
        }
    )
    mock_db.collection("timetables").document("tt_pub_aids").set(
        {
            "id": "tt_pub_aids",
            "academic_year": "2026-2027",
            "semester": 3,
            "semester_type": "ODD",
            "department_id": "dept_aids",
            "section": "B",
            "status": TimetableStatus.PUBLISHED.value,
        }
    )
    mock_db.collection("timetableSlots").document("slot_draft_1").set(
        {
            "id": "slot_draft_1",
            "timetable_id": "tt_draft_aids",
            "day": "MONDAY",
            "slot_number": 1,
            "subject_id": "sub_1",
            "faculty_id": "fac_1",
        }
    )
    mock_db.collection("timetableSlots").document("slot_pub_1").set(
        {
            "id": "slot_pub_1",
            "timetable_id": "tt_pub_aids",
            "day": "MONDAY",
            "slot_number": 1,
            "subject_id": "sub_2",
            "faculty_id": "fac_1",
        }
    )

    student_ctx = make_auth(UserRole.STUDENT_VIEWER, None, "anonymous_viewer", is_authenticated=False)
    coord_ctx = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_coord_aids")

    # Department timetables: student sees only PUBLISHED
    student_tts = sync_runner(get_department_timetables("dept_aids", academic_year=None, auth_ctx=student_ctx))
    assert [t["id"] for t in student_tts] == ["tt_pub_aids"]

    # Department timetables: own coordinator sees both DRAFT and PUBLISHED
    coord_tts = sync_runner(get_department_timetables("dept_aids", academic_year=None, auth_ctx=coord_ctx))
    assert {t["id"] for t in coord_tts} == {"tt_draft_aids", "tt_pub_aids"}

    # Timetable slots WITHOUT timetable_id: student sees only PUBLISHED slots
    student_slots = sync_runner(
        list_timetable_slots(
            timetable_id=None,
            day=None,
            faculty_id=None,
            room_id=None,
            subject_id=None,
            limit=100,
            offset=0,
            auth_ctx=student_ctx,
        )
    )
    assert [s["id"] for s in student_slots] == ["slot_pub_1"]

    # Faculty master timetable: student sees only PUBLISHED slots
    fac_slots = sync_runner(get_faculty_master_timetable("fac_1", auth_ctx=student_ctx))
    assert [s["id"] for s in fac_slots] == ["slot_pub_1"]


# =====================================================================
# 3. Department Access Protection
# =====================================================================


def test_department_isolation_on_subjects_allotments_and_preferences():
    sync_runner(
        subject_repository.create(
            "sub_cse_1",
            {
                "id": "sub_cse_1",
                "department_id": "dept_cse",
                "semester": 3,
                "code": "BCS302",
                "course_name": "DDCO",
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 4,
            },
        )
    )
    sync_runner(
        subject_repository.create(
            "sub_aids_1",
            {
                "id": "sub_aids_1",
                "department_id": "dept_aids",
                "semester": 3,
                "code": "BAI301",
                "course_name": "DS",
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 4,
            },
        )
    )
    sync_runner(
        subject_preference_repository.create(
            "pref_cse_1",
            {
                "id": "pref_cse_1",
                "faculty_id": "fac_cse_1",
                "department_id": "dept_cse",
                "academic_year": "2026-2027",
                "semester": 3,
                "preferences": [],
                "status": "SUBMITTED",
            },
        )
    )

    aids_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_aids_coord")
    bs_coord = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", "usr_bs_coord")

    # AIDS coordinator listing subjects gets only dept_aids
    aids_subs = sync_runner(
        list_subjects(department_id=None, semester=None, subject_type=None, limit=100, offset=0, auth_ctx=aids_coord)
    )
    assert [s["id"] for s in aids_subs] == ["sub_aids_1"]

    # AIDS coordinator requesting dept_cse subjects is forbidden
    with pytest.raises(HTTPException) as exc1:
        sync_runner(
            list_subjects(department_id="dept_cse", semester=None, subject_type=None, limit=100, offset=0, auth_ctx=aids_coord)
        )
    assert exc1.value.status_code == 403

    with pytest.raises(HTTPException) as exc2:
        sync_runner(get_subject("sub_cse_1", auth_ctx=aids_coord))
    assert exc2.value.status_code == 403

    # AIDS coordinator requesting dept_cse preferences is forbidden
    with pytest.raises(HTTPException) as exc3:
        sync_runner(
            list_all_preferences(department_id="dept_cse", academic_year=None, semester=None, status=None, auth_ctx=aids_coord)
        )
    assert exc3.value.status_code == 403

    # Basic Science coordinator can query dept_physics allotments without forced dept_chemistry filter
    mock_db_fixture_alt = {
        "id": "alt_phy_1",
        "faculty_id": "fac_phy_1",
        "subject_id": "sub_phy_1",
        "department_id": "dept_physics",
        "academic_year": "2026-2027",
        "semester": 1,
        "section": "A",
    }
    firebase_manager.get_db().collection("allotments").document("alt_phy_1").set(mock_db_fixture_alt)
    phy_alts = sync_runner(
        list_allotments(
            academic_year=None,
            department_id="dept_physics",
            semester=None,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=bs_coord,
        )
    )
    assert [a["id"] for a in phy_alts] == ["alt_phy_1"]


# =====================================================================
# 4. Production Authentication Configuration Safety
# =====================================================================


def test_production_blocks_dev_tokens_and_requires_real_auth(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEBUG", True)  # Even if accidentally left True

    assert settings.is_production is True
    assert settings.is_dev_auth_allowed is False

    # dev-token-admin must NOT bypass Firebase auth in production
    with pytest.raises(HTTPException) as exc:
        sync_runner(get_current_user_context(authorization="Bearer dev-token-admin"))
    assert exc.value.status_code == 401

    # Uninitialized Firebase in production must fail closed with 503 (never dev_admin)
    monkeypatch.setattr(firebase_manager, "_is_initialized", False)
    with pytest.raises(HTTPException) as exc_uninit:
        sync_runner(get_current_user_context(authorization="Bearer some-real-jwt"))
    assert exc_uninit.value.status_code == 503

    # Production startup lifespan must abort if DEBUG=True or Firebase uninitialized
    monkeypatch.setattr(firebase_manager, "initialize", lambda: False)
    with pytest.raises(RuntimeError):
        sync_runner(lifespan(app).__aenter__())
