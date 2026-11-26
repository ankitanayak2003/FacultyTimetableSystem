"""
Step 2: Backend Draft Persistence Validation Unit Tests.
Strictly uses MockFirestoreClient and zero-dependency sync_runner (no live Firestore writes).
"""

import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import AuthContext
from app.core.exceptions import RelationshipValidationError
from app.models.entities import UserRole, TimetableStatus
from app.schemas.entities import TimetableDraftSaveRequest, TimetableDraftPlacement
from app.routers.timetables import save_timetable_draft
from app.repositories import timetable_repository, timetable_slot_repository


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


def make_auth(role: UserRole = UserRole.DEAN, department_id: str | None = None) -> AuthContext:
    return AuthContext(
        uid="usr_step2_test",
        email="step2@sode-edu.in",
        role=role,
        department_id=department_id,
        is_active=True,
    )


def test_valid_empty_draft_clears_previous_slots_and_persists():
    dean_ctx = make_auth(UserRole.DEAN, None)
    # Save initial draft with 1 placement
    res1 = sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_aids_sem3_seca",
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                section="A",
                status=TimetableStatus.DRAFT,
                placements=[
                    TimetableDraftPlacement(
                        day="Monday",
                        start_period=1,
                        duration=1,
                        subject_code="BAI301",
                        subject_name="Data Structures",
                        faculty_name="Dr. Test",
                    )
                ],
            ),
            auth_ctx=dean_ctx,
        )
    )
    assert res1["slot_count"] == 1

    # Save valid empty draft -> clears old slot cleanly
    res2 = sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_aids_sem3_seca",
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                section="A",
                status=TimetableStatus.DRAFT,
                placements=[],
            ),
            auth_ctx=dean_ctx,
        )
    )
    assert res2["success"] is True
    assert res2["slot_count"] == 0
    remaining = sync_runner(
        timetable_slot_repository.list_all(filters={"timetable_id": "tt_2026_2027_aids_sem3_seca"})
    )
    assert remaining == []


def test_first_year_draft_enforces_null_department_and_rejects_engineering_dept():
    bs_ctx = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_chemistry")

    # Reject engineering department on First Year semester 1
    with pytest.raises(HTTPException) as exc:
        sync_runner(
            save_timetable_draft(
                TimetableDraftSaveRequest(
                    timetable_id="tt_2026_2027_physics_sem1_seca",
                    academic_year="2026-2027",
                    semester=1,
                    department_id="dept_aids",
                    section="A",
                    cycle="Physics",
                    placements=[],
                ),
                auth_ctx=bs_ctx,
            )
        )
    assert exc.value.status_code == 422

    # Valid First Year draft persists department_id=None
    res = sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_physics_sem1_seca",
                academic_year="2026-2027",
                semester=1,
                department_id=None,
                section="A",
                cycle="Physics",
                placements=[],
            ),
            auth_ctx=bs_ctx,
        )
    )
    assert res["success"] is True
    saved_tt = sync_runner(timetable_repository.get_by_id("tt_2026_2027_physics_sem1_seca"))
    assert saved_tt["department_id"] is None


def test_draft_save_rejects_path_body_id_mismatch_and_scope_overwrite():
    coord_ctx = make_auth(UserRole.ADMIN, None)

    with pytest.raises(HTTPException) as exc:
        sync_runner(
            save_timetable_draft(
                TimetableDraftSaveRequest(
                    timetable_id="tt_2026_2027_aids_sem3_seca",
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_aids",
                    section="A",
                    placements=[],
                ),
                timetable_id="tt_2026_2027_cse_sem3_seca",
                auth_ctx=coord_ctx,
            )
        )
    assert exc.value.status_code == 400

    # Create initial timetable for AIDS Sem 3 Sec A
    sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_aids_sem3_seca",
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                section="A",
                placements=[],
            ),
            auth_ctx=coord_ctx,
        )
    )

    # Attempt to overwrite same timetable_id with a different section/semester must fail
    with pytest.raises(RelationshipValidationError):
        sync_runner(
            save_timetable_draft(
                TimetableDraftSaveRequest(
                    timetable_id="tt_2026_2027_aids_sem3_seca",
                    academic_year="2026-2027",
                    semester=5,
                    department_id="dept_aids",
                    section="B",
                    placements=[],
                ),
                auth_ctx=coord_ctx,
            )
        )


def test_non_first_year_cannot_be_misclassified_with_cycle_and_unrelated_slots_untouched():
    coord_ctx = make_auth(UserRole.ADMIN, None)

    # Semester 3 with cycle="Physics" must be rejected
    with pytest.raises(HTTPException) as exc:
        sync_runner(
            save_timetable_draft(
                TimetableDraftSaveRequest(
                    timetable_id="tt_2026_2027_aids_sem3_seca",
                    academic_year="2026-2027",
                    semester=3,
                    department_id="dept_aids",
                    section="A",
                    cycle="Physics",
                    placements=[],
                ),
                auth_ctx=coord_ctx,
            )
        )
    assert exc.value.status_code == 422

    # Saving/clearing tt_A must not delete slots belonging to tt_B
    sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_aids_sem3_secb",
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                section="B",
                placements=[
                    TimetableDraftPlacement(
                        day="Tuesday",
                        start_period=2,
                        duration=1,
                        subject_code="BAI302",
                        subject_name="OS",
                        faculty_name="Dr. B",
                    )
                ],
            ),
            auth_ctx=coord_ctx,
        )
    )
    sync_runner(
        save_timetable_draft(
            TimetableDraftSaveRequest(
                timetable_id="tt_2026_2027_aids_sem3_seca",
                academic_year="2026-2027",
                semester=3,
                department_id="dept_aids",
                section="A",
                placements=[],
            ),
            auth_ctx=coord_ctx,
        )
    )
    secb_slots = sync_runner(
        timetable_slot_repository.list_all(filters={"timetable_id": "tt_2026_2027_aids_sem3_secb"})
    )
    assert len(secb_slots) == 1
    assert secb_slots[0]["subject_code"] == "BAI302"
