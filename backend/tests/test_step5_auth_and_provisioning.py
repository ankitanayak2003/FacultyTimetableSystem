"""
Step 5: Firebase Authentication, /api/v1/auth/me, and Test Account Provisioning Tests.
Strictly uses MockFirestoreClient and mocked firebase_admin.auth (no live Firestore writes).
"""

from types import SimpleNamespace
import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import get_current_user_context
from app.models.entities import UserRole
from app.repositories import department_repository, user_repository, subject_repository
from app.routers.auth import get_authenticated_me
from app.routers.subjects import list_subjects
from scripts.provision_test_users import (
    EXPECTED_FIREBASE_PROJECT_ID,
    TEST_USER_SPECS,
    provision_test_users,
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


def seed_departments():
    for dept_id, code, name in [
        ("dept_aids", "AIDS", "AI & Data Science"),
        ("dept_aiml", "AIML", "AI & Machine Learning"),
        ("dept_cse", "CSE", "Computer Science & Engineering"),
        ("dept_ece", "ECE", "Electronics & Communication"),
        ("dept_mech", "MECH", "Mechanical Engineering"),
        ("dept_civil", "CIVIL", "Civil Engineering"),
        ("dept_basic_science", "BS", "Basic Science"),
    ]:
        sync_runner(
            department_repository.create(
                dept_id,
                {"id": dept_id, "code": code, "name": name},
            )
        )


def test_firebase_token_verification_and_me_resolution(monkeypatch):
    seed_departments()
    sync_runner(
        user_repository.create(
            "uid_cse_coord",
            {
                "id": "uid_cse_coord",
                "email": "cse.coord@aqs.test",
                "display_name": "CSE Coordinator",
                "role": UserRole.DEPARTMENT_COORDINATOR.value,
                "department_id": "dept_cse",
                "is_active": True,
            },
        )
    )

    monkeypatch.setattr(
        "app.core.dependencies.auth.verify_id_token",
        lambda token: {"uid": "uid_cse_coord", "email": "cse.coord@aqs.test"}
        if token == "valid-fb-token"
        else (_ for _ in ()).throw(ValueError("bad token")),
    )

    auth_ctx = sync_runner(get_current_user_context("Bearer valid-fb-token"))
    assert auth_ctx.uid == "uid_cse_coord"
    assert auth_ctx.role == UserRole.DEPARTMENT_COORDINATOR
    assert auth_ctx.department_id == "dept_cse"

    me = sync_runner(get_authenticated_me(auth_ctx=auth_ctx))
    assert me.uid == "uid_cse_coord"
    assert me.display_name == "CSE Coordinator"
    assert me.role == "DEPARTMENT_COORDINATOR"
    assert me.department_id == "dept_cse"
    assert me.department_code == "CSE"
    assert me.is_active is True


def test_invalid_token_missing_user_doc_and_inactive_user_rejected(monkeypatch):
    monkeypatch.setattr(
        "app.core.dependencies.auth.verify_id_token",
        lambda token: (
            {"uid": "uid_unknown_google", "email": "stranger@gmail.com"}
            if token == "google-token-unknown"
            else {"uid": "uid_inactive", "email": "disabled@aqs.test"}
            if token == "token-inactive"
            else (_ for _ in ()).throw(ValueError("expired/invalid"))
        ),
    )

    # 1. Invalid / expired Firebase token -> 401
    with pytest.raises(HTTPException) as exc_invalid:
        sync_runner(get_current_user_context("Bearer invalid-token"))
    assert exc_invalid.value.status_code == 401

    # 2. Valid Google token, but no Firestore users/{uid} record -> 401
    with pytest.raises(HTTPException) as exc_unknown:
        sync_runner(get_current_user_context("Bearer google-token-unknown"))
    assert exc_unknown.value.status_code == 401

    # 3. Inactive user -> 403
    sync_runner(
        user_repository.create(
            "uid_inactive",
            {
                "id": "uid_inactive",
                "email": "disabled@aqs.test",
                "display_name": "Disabled User",
                "role": UserRole.FACULTY.value,
                "department_id": "dept_cse",
                "is_active": False,
            },
        )
    )
    with pytest.raises(HTTPException) as exc_inactive:
        sync_runner(get_current_user_context("Bearer token-inactive"))
    assert exc_inactive.value.status_code == 403


def test_department_tampering_rejected_for_authenticated_coordinator(monkeypatch):
    seed_departments()
    sync_runner(
        subject_repository.create(
            "sub_bai301",
            {
                "id": "sub_bai301",
                "code": "BAI301",
                "course_name": "Data Structures",
                "department_id": "dept_aids",
                "semester": 3,
            },
        )
    )
    sync_runner(
        user_repository.create(
            "uid_cse_coord",
            {
                "id": "uid_cse_coord",
                "email": "cse.coord@aqs.test",
                "display_name": "CSE Coordinator",
                "role": UserRole.DEPARTMENT_COORDINATOR.value,
                "department_id": "dept_cse",
                "is_active": True,
            },
        )
    )
    monkeypatch.setattr(
        "app.core.dependencies.auth.verify_id_token",
        lambda token: {"uid": "uid_cse_coord", "email": "cse.coord@aqs.test"},
    )
    auth_ctx = sync_runner(get_current_user_context("Bearer cse-token"))

    with pytest.raises(HTTPException) as exc_tamper:
        sync_runner(
            list_subjects(
                department_id="dept_aids",
                semester=3,
                limit=100,
                offset=0,
                auth_ctx=auth_ctx,
            )
        )
    assert exc_tamper.value.status_code == 403


class FakeFirebaseAuthClient:
    def __init__(self):
        self.users_by_email = {}
        self.password_updates = 0

    def get_user_by_email(self, email: str):
        if email not in self.users_by_email:
            raise KeyError(email)
        return self.users_by_email[email]

    def create_user(self, *, email: str, password: str, display_name: str, **_kwargs):
        uid = f"fb_uid_{email.split('@')[0].replace('.', '_')}"
        rec = SimpleNamespace(uid=uid, email=email, display_name=display_name)
        self.users_by_email[email] = rec
        return rec


def test_provisioning_dry_run_idempotency_and_conflict_handling():
    seed_departments()
    fake_auth = FakeFirebaseAuthClient()

    # 1. Wrong project ID is rejected
    with pytest.raises(RuntimeError):
        sync_runner(
            provision_test_users(
                expected_project_id=EXPECTED_FIREBASE_PROJECT_ID,
                actual_project_id="wrong-project",
                dry_run=True,
                auth_client=fake_auth,
                user_repo=user_repository,
                dept_repo=department_repository,
            )
        )

    # 2. Dry-run previews all 12 accounts without writing
    dry_summary = sync_runner(
        provision_test_users(
            expected_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            actual_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            dry_run=True,
            auth_client=fake_auth,
            user_repo=user_repository,
            dept_repo=department_repository,
        )
    )
    assert len(dry_summary["created"]) == len(TEST_USER_SPECS) == 12
    assert len(fake_auth.users_by_email) == 0
    assert sync_runner(user_repository.list_all(limit=50)) == []

    # 3. Actual run creates all 12 accounts and stores no password in Firestore
    run1 = sync_runner(
        provision_test_users(
            expected_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            actual_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            dry_run=False,
            confirm_create=True,
            password="TemporaryTestPassword#123",
            auth_client=fake_auth,
            user_repo=user_repository,
            dept_repo=department_repository,
        )
    )
    assert len(run1["created"]) == 12
    assert len(run1["conflicting"]) == 0

    stored_users = sync_runner(user_repository.list_all(limit=50))
    assert len(stored_users) == 12
    for u in stored_users:
        assert "password" not in u
        assert "TemporaryTestPassword" not in str(u)

    # 4. Rerun is idempotent
    run2 = sync_runner(
        provision_test_users(
            expected_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            actual_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            dry_run=False,
            confirm_create=True,
            password="TemporaryTestPassword#123",
            auth_client=fake_auth,
            user_repo=user_repository,
            dept_repo=department_repository,
        )
    )
    assert len(run2["created"]) == 0
    assert len(run2["already_existing"]) == 12
    assert len(run2["conflicting"]) == 0

    # 5. Conflicting existing user document is reported and NOT overwritten
    dean_uid = fake_auth.users_by_email["dean@aqs.test"].uid
    sync_runner(user_repository.update(dean_uid, {"role": UserRole.FACULTY.value}))
    run3 = sync_runner(
        provision_test_users(
            expected_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            actual_project_id=EXPECTED_FIREBASE_PROJECT_ID,
            dry_run=False,
            confirm_create=True,
            password="TemporaryTestPassword#123",
            auth_client=fake_auth,
            user_repo=user_repository,
            dept_repo=department_repository,
        )
    )
    assert len(run3["conflicting"]) == 1
    assert run3["conflicting"][0]["email"] == "dean@aqs.test"
    # Existing role must remain untouched
    dean_doc = sync_runner(user_repository.get_by_id(dean_uid))
    assert dean_doc["role"] == UserRole.FACULTY.value
