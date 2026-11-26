"""
Step 3: Subject and Faculty Allocation Persistence Unit Tests.
Strictly uses MockFirestoreClient and zero-dependency sync_runner (no live Firestore writes).
"""

import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import AuthContext
from app.core.exceptions import DuplicateEntityError, RelationshipValidationError
from app.models.entities import UserRole, SubjectType
from app.schemas.entities import AllotmentCreate, AllotmentUpdate, SubjectCreate, SubjectUpdate
from app.repositories import (
    faculty_repository,
    subject_repository,
    allotment_repository,
)
from app.routers.allotments import (
    create_allotment,
    upsert_allotment,
    list_allotments,
    get_allotment,
    update_allotment,
    delete_allotment,
)
from app.routers.subjects import (
    list_subjects,
    get_subject,
    create_subject,
    update_subject,
    delete_subject,
)


def sync_runner(coro):
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
) -> AuthContext:
    return AuthContext(
        uid=uid,
        email=f"{uid}@sode-edu.in",
        role=role,
        department_id=department_id,
        is_active=True,
    )


def seed_catalog():
    sync_runner(
        faculty_repository.create(
            "fac_aids_1",
            {
                "id": "fac_aids_1",
                "name": "Dr. Ananya Rao",
                "email": "ananya@sode-edu.in",
                "department_id": "dept_aids",
                "designation": "Professor",
            },
        )
    )
    sync_runner(
        faculty_repository.create(
            "fac_aids_2",
            {
                "id": "fac_aids_2",
                "name": "Prof. Rajesh Shetty",
                "email": "rajesh@sode-edu.in",
                "department_id": "dept_aids",
                "designation": "Associate Professor",
            },
        )
    )
    sync_runner(
        faculty_repository.create(
            "fac_phy_1",
            {
                "id": "fac_phy_1",
                "name": "Dr. Ravindra K",
                "email": "ravindra@sode-edu.in",
                "department_id": "dept_physics",
                "designation": "Professor",
            },
        )
    )
    sync_runner(
        subject_repository.create(
            "sub_bai301",
            {
                "id": "sub_bai301",
                "department_id": "dept_aids",
                "semester": 3,
                "code": "BAI301",
                "course_name": "Data Structures",
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 4,
            },
        )
    )
    sync_runner(
        subject_repository.create(
            "sub_bcs302",
            {
                "id": "sub_bcs302",
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
            "sub_bphys102",
            {
                "id": "sub_bphys102",
                "department_id": None,
                "semester": 1,
                "code": "BPHYS102",
                "course_name": "Engineering Physics",
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 4,
            },
        )
    )


def test_load_and_empty_allotments():
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")
    empty = sync_runner(
        list_allotments(
            academic_year=None,
            department_id=None,
            semester=None,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=dean_ctx,
        )
    )
    assert empty == []


def test_create_update_upsert_and_duplicate_prevention():
    seed_catalog()
    aids_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_aids")

    created = sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_1",
                section="Section A",
                weekly_hours_allocated=4,
            ),
            auth_ctx=aids_coord,
        )
    )
    assert created["subject_code"] == "BAI301"
    assert created["faculty_name"] == "Dr. Ananya Rao"
    assert created["section"] == "A"

    # Duplicate create for same scope + subject must fail
    with pytest.raises(DuplicateEntityError):
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_aids",
                    subject_id="sub_bai301",
                    faculty_id="fac_aids_2",
                    section="A",
                    weekly_hours_allocated=4,
                ),
                auth_ctx=aids_coord,
            )
        )

    # Idempotent upsert updates the same allotment without creating duplicates
    upserted = sync_runner(
        upsert_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_2",
                section="A",
                weekly_hours_allocated=4,
            ),
            auth_ctx=aids_coord,
        )
    )
    assert upserted["id"] == created["id"]
    assert upserted["faculty_id"] == "fac_aids_2"
    assert upserted["faculty_name"] == "Prof. Rajesh Shetty"

    # Saving Section B creates an independent allotment without touching Section A
    sec_b = sync_runner(
        upsert_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_1",
                section="B",
                weekly_hours_allocated=4,
            ),
            auth_ctx=aids_coord,
        )
    )
    assert sec_b["id"] != created["id"]

    all_aids = sync_runner(
        list_allotments(
            academic_year="2026-2027",
            department_id=None,
            semester=3,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=aids_coord,
        )
    )
    assert len(all_aids) == 2

    # Direct update works
    upd = sync_runner(
        update_allotment(
            sec_b["id"],
            AllotmentUpdate(faculty_id="fac_aids_2"),
            auth_ctx=aids_coord,
        )
    )
    assert upd["faculty_id"] == "fac_aids_2"


def test_invalid_subject_or_faculty_rejected():
    seed_catalog()
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")

    with pytest.raises(RelationshipValidationError):
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_aids",
                    subject_id="sub_nonexistent",
                    faculty_id="fac_aids_1",
                    section="A",
                ),
                auth_ctx=dean_ctx,
            )
        )

    with pytest.raises(RelationshipValidationError):
        sync_runner(
            upsert_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_aids",
                    subject_id="sub_bai301",
                    faculty_id="fac_nonexistent",
                    section="A",
                ),
                auth_ctx=dean_ctx,
            )
        )


def test_role_isolation_dean_basic_science_and_first_year_null_dept():
    seed_catalog()
    aids_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_aids")
    bs_coord = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", "usr_bs")
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")

    # Dept Coordinator cannot create allotment in another department (dept_cse)
    with pytest.raises(HTTPException) as exc1:
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_cse",
                    subject_id="sub_bcs302",
                    faculty_id="fac_aids_1",
                    section="A",
                ),
                auth_ctx=aids_coord,
            )
        )
    assert exc1.value.status_code == 403

    # Dept Coordinator cannot create First Year (department_id=None) allotment
    with pytest.raises(HTTPException) as exc2:
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=1,
                    department_id=None,
                    subject_id="sub_bphys102",
                    faculty_id="fac_phy_1",
                    section="A",
                ),
                auth_ctx=aids_coord,
            )
        )
    assert exc2.value.status_code == 403

    # First Year with engineering department_id must be rejected (422)
    with pytest.raises(HTTPException) as exc3:
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=1,
                    department_id="dept_aids",
                    subject_id="sub_bphys102",
                    faculty_id="fac_phy_1",
                    section="A",
                ),
                auth_ctx=bs_coord,
            )
        )
    assert exc3.value.status_code == 422

    # Basic Science Coordinator creates First Year allotment with department_id=None
    fy_alt = sync_runner(
        upsert_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=1,
                department_id=None,
                subject_id="sub_bphys102",
                faculty_id="fac_phy_1",
                section="A",
            ),
            auth_ctx=bs_coord,
        )
    )
    assert fy_alt["department_id"] is None

    # Basic Science Coordinator can read First Year allotment
    bs_list = sync_runner(
        list_allotments(
            academic_year=None,
            department_id=None,
            semester=1,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=bs_coord,
        )
    )
    assert [a["id"] for a in bs_list] == [fy_alt["id"]]

    # Dean has institution-wide access across depts and First Year
    sync_runner(
        upsert_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_cse",
                subject_id="sub_bcs302",
                faculty_id="fac_aids_1",
                section="A",
            ),
            auth_ctx=dean_ctx,
        )
    )
    dean_list = sync_runner(
        list_allotments(
            academic_year=None,
            department_id=None,
            semester=None,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=dean_ctx,
        )
    )
    assert len(dean_list) == 2

    # Delete allotment works
    sync_runner(delete_allotment(fy_alt["id"], auth_ctx=bs_coord))
    remaining = sync_runner(allotment_repository.list_all(limit=100))
    assert len(remaining) == 1


def test_basic_science_coordinator_restricted_to_math_physics_chemistry():
    seed_catalog()
    # Non-Basic-Science departmentless First Year subject (Universal Human Values)
    sync_runner(
        subject_repository.create(
            "sub_buhv108",
            {
                "code": "BUHV108",
                "title": "Universal Human Values",
                "course_name": "Universal Human Values",
                "department_id": None,
                "semester": 1,
                "credits": 1,
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 1,
            },
        )
    )

    bs_coord = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", "usr_bs")
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")

    # Dean creates allotment for non-BS departmentless subject
    uhv_alt = sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=1,
                department_id=None,
                subject_id="sub_buhv108",
                faculty_id="fac_phy_1",
                section="A",
            ),
            auth_ctx=dean_ctx,
        )
    )

    # BS Coordinator list_subjects includes Physics (sub_bphys102) but excludes UHV (sub_buhv108)
    bs_subjects = sync_runner(
        list_subjects(
            department_id=None,
            semester=1,
            limit=100,
            offset=0,
            auth_ctx=bs_coord,
        )
    )
    bs_sub_ids = {s["id"] for s in bs_subjects}
    assert "sub_bphys102" in bs_sub_ids
    assert "sub_buhv108" not in bs_sub_ids

    # BS Coordinator cannot read, create, update, or delete non-BS department_id=None subjects
    with pytest.raises(HTTPException) as exc_get_sub:
        sync_runner(get_subject("sub_buhv108", auth_ctx=bs_coord))
    assert exc_get_sub.value.status_code == 403

    with pytest.raises(HTTPException) as exc_create_sub:
        sync_runner(
            create_subject(
                SubjectCreate(
                    id="sub_fy_elec",
                    code="BFYE109",
                    title="First Year Design Thinking",
                    course_name="First Year Design Thinking",
                    department_id=None,
                    semester=1,
                    credits=2,
                ),
                auth_ctx=bs_coord,
            )
        )
    assert exc_create_sub.value.status_code == 403

    with pytest.raises(HTTPException) as exc_upd_sub:
        sync_runner(
            update_subject("sub_buhv108", SubjectUpdate(credits=2), auth_ctx=bs_coord)
        )
    assert exc_upd_sub.value.status_code == 403

    with pytest.raises(HTTPException) as exc_del_sub:
        sync_runner(delete_subject("sub_buhv108", auth_ctx=bs_coord))
    assert exc_del_sub.value.status_code == 403

    # BS Coordinator cannot read, list, create, upsert, update, or delete non-BS department_id=None allotments
    bs_allotments = sync_runner(
        list_allotments(
            academic_year=None,
            department_id=None,
            semester=1,
            faculty_id=None,
            subject_id=None,
            section=None,
            is_locked=None,
            limit=100,
            offset=0,
            auth_ctx=bs_coord,
        )
    )
    assert [a["id"] for a in bs_allotments] == []

    with pytest.raises(HTTPException) as exc_get_alt:
        sync_runner(get_allotment(uhv_alt["id"], auth_ctx=bs_coord))
    assert exc_get_alt.value.status_code == 403

    with pytest.raises(HTTPException) as exc_upsert_alt:
        sync_runner(
            upsert_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=1,
                    department_id=None,
                    subject_id="sub_buhv108",
                    faculty_id="fac_phy_1",
                    section="B",
                ),
                auth_ctx=bs_coord,
            )
        )
    assert exc_upsert_alt.value.status_code == 403

    with pytest.raises(HTTPException) as exc_upd_alt:
        sync_runner(
            update_allotment(
                uhv_alt["id"], AllotmentUpdate(weekly_hours_allocated=2), auth_ctx=bs_coord
            )
        )
    assert exc_upd_alt.value.status_code == 403

    with pytest.raises(HTTPException) as exc_del_alt:
        sync_runner(delete_allotment(uhv_alt["id"], auth_ctx=bs_coord))
    assert exc_del_alt.value.status_code == 403


def test_update_allotment_rejects_cross_scope_collision():
    seed_catalog()
    aids_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_aids")

    sec_a = sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_1",
                section="A",
            ),
            auth_ctx=aids_coord,
        )
    )
    sec_b = sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_2",
                section="B",
            ),
            auth_ctx=aids_coord,
        )
    )

    with pytest.raises(DuplicateEntityError):
        sync_runner(
            update_allotment(
                sec_b["id"],
                AllotmentUpdate(section="A"),
                auth_ctx=aids_coord,
            )
        )
    # sec_a remains intact
    fetched_a = sync_runner(get_allotment(sec_a["id"], auth_ctx=aids_coord))
    assert fetched_a["faculty_id"] == "fac_aids_1"


def test_missing_or_empty_department_identity_fails_closed():
    seed_catalog()
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")
    sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                subject_id="sub_bai301",
                faculty_id="fac_aids_1",
                section="A",
            ),
            auth_ctx=dean_ctx,
        )
    )

    for bad_dept in (None, "", "   "):
        unassigned_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, bad_dept, "usr_unassigned")
        with pytest.raises(HTTPException) as exc_sub:
            sync_runner(
                list_subjects(
                    department_id=None,
                    semester=None,
                    limit=100,
                    offset=0,
                    auth_ctx=unassigned_coord,
                )
            )
        assert exc_sub.value.status_code == 403

        with pytest.raises(HTTPException) as exc_alt:
            sync_runner(
                list_allotments(
                    academic_year=None,
                    department_id=None,
                    semester=None,
                    faculty_id=None,
                    subject_id=None,
                    section=None,
                    is_locked=None,
                    limit=100,
                    offset=0,
                    auth_ctx=unassigned_coord,
                )
            )
        assert exc_alt.value.status_code == 403

        with pytest.raises(HTTPException) as exc_get_sub:
            sync_runner(get_subject("sub_bai301", auth_ctx=unassigned_coord))
        assert exc_get_sub.value.status_code == 403


def test_department_coordinator_cannot_escape_scope_or_read_first_year_allotment():
    seed_catalog()
    aids_coord = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids", "usr_aids")
    dean_ctx = make_auth(UserRole.DEAN, None, "usr_dean")

    fy_alt = sync_runner(
        create_allotment(
            AllotmentCreate(
                academic_year="2026-2027",
                semester=1,
                department_id=None,
                subject_id="sub_bphys102",
                faculty_id="fac_phy_1",
                section="A",
            ),
            auth_ctx=dean_ctx,
        )
    )

    # Dept Coordinator cannot read First Year departmentless allotment
    with pytest.raises(HTTPException) as exc_fy:
        sync_runner(get_allotment(fy_alt["id"], auth_ctx=aids_coord))
    assert exc_fy.value.status_code == 403

    # Dept Coordinator cannot clear department_id=None on an existing subject
    with pytest.raises(HTTPException) as exc_clear:
        sync_runner(
            update_subject("sub_bai301", SubjectUpdate(department_id=None), auth_ctx=aids_coord)
        )
    assert exc_clear.value.status_code == 403

    # Dept Coordinator cannot read or list another department's subjects
    with pytest.raises(HTTPException) as exc_cse:
        sync_runner(
            list_subjects(
                department_id="dept_cse",
                semester=3,
                limit=100,
                offset=0,
                auth_ctx=aids_coord,
            )
        )
    assert exc_cse.value.status_code == 403


def test_basic_science_rejects_keyword_substring_false_positives():
    seed_catalog()
    # "Automated Manufacturing" contains "mat", "Philosophy" contains "phy"
    sync_runner(
        subject_repository.create(
            "sub_bmfg108",
            {
                "code": "BMFG108",
                "title": "Automated Manufacturing",
                "course_name": "Automated Manufacturing",
                "department_id": None,
                "semester": 1,
                "credits": 2,
                "subject_type": SubjectType.THEORY.value,
                "weekly_hours": 2,
            },
        )
    )
    bs_coord = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry", "usr_bs")
    bs_subjects = sync_runner(
        list_subjects(
            department_id=None,
            semester=1,
            limit=100,
            offset=0,
            auth_ctx=bs_coord,
        )
    )
    assert "sub_bmfg108" not in {s["id"] for s in bs_subjects}

    with pytest.raises(HTTPException) as exc_sub:
        sync_runner(get_subject("sub_bmfg108", auth_ctx=bs_coord))
    assert exc_sub.value.status_code == 403

    with pytest.raises(HTTPException) as exc_alt:
        sync_runner(
            create_allotment(
                AllotmentCreate(
                    academic_year="2026-2027",
                    semester=1,
                    department_id=None,
                    subject_id="sub_bmfg108",
                    faculty_id="fac_phy_1",
                    section="A",
                ),
                auth_ctx=bs_coord,
            )
        )
    assert exc_alt.value.status_code == 403
