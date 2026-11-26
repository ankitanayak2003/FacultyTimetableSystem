"""
Basic Science Coordinator Faculty Management & Access Control Tests.
Verifies CHANGE 3:
1. Basic Science Coordinator can add/update/delete Basic Science faculty (math, physics, chemistry).
2. Strict backend authorization: Basic Science Coordinator cannot touch engineering faculty (HTTP 403).
3. Login provisioning creates users/{uid} with role=FACULTY.
4. Deactivating faculty disables portal login access.
Strictly uses MockFirestoreClient (offline, zero live Firestore writes).
"""

import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import AuthContext
from app.models.entities import UserRole
from app.schemas.entities import FacultyCreate, FacultyUpdate, FacultyLoginProvisionRequest
from app.repositories import faculty_repository, user_repository
from app.routers.faculty import (
    create_faculty,
    update_faculty,
    delete_faculty,
    provision_faculty_login,
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

    class MockFbUser:
        def __init__(self, uid, email):
            self.uid = uid
            self.email = email

    class MockFbAuth:
        @staticmethod
        def get_user_by_email(email):
            return MockFbUser(f"uid_{email.split('@')[0]}", email)

        @staticmethod
        def update_user(uid, disabled=False):
            return None

        @staticmethod
        def create_user(**kwargs):
            return MockFbUser(f"uid_{kwargs.get('email', 'fac').split('@')[0]}", kwargs.get("email", ""))

    monkeypatch.setattr("app.routers.faculty.fb_auth", MockFbAuth)
    yield client
    client.reset()


def make_bs_coord_auth(uid: str = "usr_bs_coord") -> AuthContext:
    return AuthContext(
        uid=uid,
        email="bs.coord@aqs.test",
        role=UserRole.BASIC_SCIENCE_COORDINATOR,
        department_id="dept_basic_science",
        is_active=True,
    )


def make_dept_coord_auth(dept_id: str = "dept_aids", uid: str = "usr_aids_coord") -> AuthContext:
    return AuthContext(
        uid=uid,
        email=f"{dept_id}.coord@aqs.test",
        role=UserRole.DEPARTMENT_COORDINATOR,
        department_id=dept_id,
        is_active=True,
    )


def test_basic_science_coordinator_can_create_bs_faculty():
    auth = make_bs_coord_auth()

    # 1. Math faculty
    math_req = FacultyCreate(
        id="fac_math_new",
        name="Dr. Srinivasa",
        email="srinivasa.math@sode-edu.in",
        department_id="dept_math",
        designation="Professor",
        max_weekly_hours=14,
        min_weekly_hours=12,
        is_active=True,
        has_login_access=True,
    )
    res_math = sync_runner(create_faculty(math_req, auth_ctx=auth))
    assert res_math["id"] == "fac_math_new"
    assert res_math["name"] == "Dr. Srinivasa"
    assert res_math["department_id"] == "dept_math"

    # 2. Physics faculty
    phy_req = FacultyCreate(
        id="fac_phy_new",
        name="Dr. Homi Bhabha",
        email="bhabha.phy@sode-edu.in",
        department_id="dept_physics",
        designation="Professor",
        max_weekly_hours=14,
        min_weekly_hours=12,
        is_active=True,
        has_login_access=True,
    )
    res_phy = sync_runner(create_faculty(phy_req, auth_ctx=auth))
    assert res_phy["id"] == "fac_phy_new"
    assert res_phy["department_id"] == "dept_physics"

    # 3. Chemistry faculty
    chem_req = FacultyCreate(
        id="fac_chem_new",
        name="Dr. Prafulla Ray",
        email="ray.chem@sode-edu.in",
        department_id="dept_chemistry",
        designation="Associate Professor",
        max_weekly_hours=16,
        min_weekly_hours=14,
        is_active=True,
        has_login_access=True,
    )
    res_chem = sync_runner(create_faculty(chem_req, auth_ctx=auth))
    assert res_chem["id"] == "fac_chem_new"
    assert res_chem["department_id"] == "dept_chemistry"


def test_basic_science_coordinator_cannot_create_engineering_faculty():
    auth = make_bs_coord_auth()

    eng_req = FacultyCreate(
        id="fac_aids_illegal",
        name="Dr. Illegal Aids",
        email="illegal.aids@sode-edu.in",
        department_id="dept_aids",
        designation="Assistant Professor",
        max_weekly_hours=16,
        min_weekly_hours=12,
        is_active=True,
    )
    with pytest.raises(HTTPException) as exc_info:
        sync_runner(create_faculty(eng_req, auth_ctx=auth))
    assert exc_info.value.status_code == 403
    assert "Basic Science Coordinator access restricted" in exc_info.value.detail


def test_basic_science_coordinator_can_update_bs_faculty():
    auth = make_bs_coord_auth()

    sync_runner(
        faculty_repository.create(
            "fac_math_1",
            {
                "id": "fac_math_1",
                "name": "Dr. Raman",
                "email": "raman@sode-edu.in",
                "department_id": "dept_math",
                "designation": "Assistant Professor",
                "is_active": True,
            },
        )
    )

    update_req = FacultyUpdate(
        name="Dr. Ramanujan Updated",
        designation="Professor",
        max_weekly_hours=14,
    )
    res = sync_runner(update_faculty("fac_math_1", update_req, auth_ctx=auth))
    assert res["name"] == "Dr. Ramanujan Updated"
    assert res["designation"] == "Professor"


def test_basic_science_coordinator_cannot_update_engineering_faculty():
    auth = make_bs_coord_auth()

    sync_runner(
        faculty_repository.create(
            "fac_aids_target",
            {
                "id": "fac_aids_target",
                "name": "Prof. Aids Member",
                "email": "aids@sode-edu.in",
                "department_id": "dept_aids",
                "designation": "Assistant Professor",
                "is_active": True,
            },
        )
    )

    update_req = FacultyUpdate(name="Hacked Name")
    with pytest.raises(HTTPException) as exc_info:
        sync_runner(update_faculty("fac_aids_target", update_req, auth_ctx=auth))
    assert exc_info.value.status_code == 403
    assert "Basic Science Coordinator access restricted" in exc_info.value.detail


def test_basic_science_coordinator_can_delete_bs_faculty():
    auth = make_bs_coord_auth()

    sync_runner(
        faculty_repository.create(
            "fac_chem_todel",
            {
                "id": "fac_chem_todel",
                "name": "Dr. Temp Chem",
                "email": "temp.chem@sode-edu.in",
                "department_id": "dept_chemistry",
                "designation": "Assistant Professor",
                "is_active": True,
            },
        )
    )

    sync_runner(delete_faculty("fac_chem_todel", auth_ctx=auth))
    # Verify removed from repository
    doc = sync_runner(faculty_repository.get_by_id("fac_chem_todel"))
    assert doc is None


def test_basic_science_coordinator_cannot_delete_engineering_faculty():
    auth = make_bs_coord_auth()

    sync_runner(
        faculty_repository.create(
            "fac_cse_safe",
            {
                "id": "fac_cse_safe",
                "name": "Prof. CSE Safe",
                "email": "safe.cse@sode-edu.in",
                "department_id": "dept_cse",
                "designation": "Assistant Professor",
                "is_active": True,
            },
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        sync_runner(delete_faculty("fac_cse_safe", auth_ctx=auth))
    assert exc_info.value.status_code == 403
    assert "Basic Science Coordinator access restricted" in exc_info.value.detail


def test_basic_science_login_provisioning_and_deactivation():
    auth = make_bs_coord_auth()

    # 1. Create a Physics faculty profile
    sync_runner(
        faculty_repository.create(
            "fac_physics_login",
            {
                "id": "fac_physics_login",
                "name": "Dr. Chandrasekhar",
                "email": "chandra.physics@sode-edu.in",
                "department_id": "dept_physics",
                "designation": "Professor",
                "is_active": True,
                "has_login_access": False,
            },
        )
    )

    # 2. Basic Science Coordinator provisions portal login
    req = FacultyLoginProvisionRequest(enable_login=True)
    prov_res = sync_runner(provision_faculty_login("fac_physics_login", req, auth_ctx=auth))
    assert prov_res.has_login_access is True
    assert prov_res.email == "chandra.physics@sode-edu.in"

    # Verify user doc in Firestore has role=FACULTY and department_id=dept_physics
    uid = prov_res.uid
    user_doc = sync_runner(user_repository.get_by_id(uid))
    assert user_doc is not None
    assert user_doc["role"] == UserRole.FACULTY.value
    assert user_doc["department_id"] == "dept_physics"
    assert user_doc["is_active"] is True

    # 3. Department coordinator cannot provision this Basic Science faculty
    dept_auth = make_dept_coord_auth("dept_aids")
    with pytest.raises(HTTPException) as exc_info:
        sync_runner(provision_faculty_login("fac_physics_login", req, auth_ctx=dept_auth))
    assert exc_info.value.status_code == 403
    assert "Department access violation" in exc_info.value.detail

    # 4. Deactivate faculty (accountStatus = Inactive / soft delete)
    deact_req = FacultyUpdate(is_active=False)
    sync_runner(update_faculty("fac_physics_login", deact_req, auth_ctx=auth))

    # Verify user record is deactivated in Firestore
    updated_user_doc = sync_runner(user_repository.get_by_id(uid))
    assert updated_user_doc["is_active"] is False
