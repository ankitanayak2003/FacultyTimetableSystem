"""
API route tests for Firestore collection endpoints.
Tests authorization barriers, validation errors, HTTP 401, 403, 404, 409, 422,
and CRUD responses via FastAPI TestClient with mocked Firestore and dependency overrides.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import get_current_user_context, AuthContext
from app.models.entities import UserRole


@pytest.fixture(autouse=True)
def mock_db_fixture(monkeypatch):
    """Ensure all API tests use the in-memory mock Firestore client and clean dependency overrides."""
    client = MockFirestoreClient()
    monkeypatch.setattr(firebase_manager, "_db", client)
    monkeypatch.setattr(firebase_manager, "_is_initialized", True)
    app.dependency_overrides.clear()
    yield client
    app.dependency_overrides.clear()
    client.reset()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def set_auth_context(
    role: UserRole = UserRole.DEPARTMENT_COORDINATOR,
    department_id: str = "dept_cse",
    uid: str = "usr_coord_1",
    email: str = "coord@college.edu",
    is_active: bool = True,
):
    """Helper to set authenticated user context via FastAPI dependency override."""
    ctx = AuthContext(
        uid=uid,
        email=email,
        role=role,
        department_id=department_id,
        is_active=is_active,
    )
    app.dependency_overrides[get_current_user_context] = lambda: ctx
    return ctx


def test_faculty_crud_and_auth_guards(client: TestClient):
    fac_payload = {
        "id": "fac_cse_01",
        "name": "Dr. Ananya Sharma",
        "email": "ananya@college.edu",
        "department_id": "dept_cse",
        "designation": "Associate Professor",
        "max_weekly_hours": 16,
        "min_weekly_hours": 12,
        "specializations": ["Machine Learning"],
    }

    # 1. Unauthenticated request rejected with HTTP 401
    res_unauth = client.post("/api/v1/faculty/", json=fac_payload)
    assert res_unauth.status_code == 401

    # 2. Authenticated Department Coordinator can create faculty (HTTP 201)
    set_auth_context(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
    res_ok = client.post("/api/v1/faculty/", json=fac_payload)
    assert res_ok.status_code == 201
    data = res_ok.json()
    assert data["id"] == "fac_cse_01"
    assert data["name"] == "Dr. Ananya Sharma"

    # 3. Duplicate ID returns HTTP 409 Conflict
    res_dup = client.post("/api/v1/faculty/", json=fac_payload)
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"]

    # 4. Read faculty with authenticated identity
    res_get = client.get("/api/v1/faculty/fac_cse_01")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == "fac_cse_01"

    # 5. Nonexistent faculty returns HTTP 404 Not Found
    res_404 = client.get("/api/v1/faculty/fac_missing")
    assert res_404.status_code == 404

    # 6. Update faculty
    res_update = client.put(
        "/api/v1/faculty/fac_cse_01",
        json={"name": "Dr. Ananya Sharma Ph.D."},
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Dr. Ananya Sharma Ph.D."

    # 7. Delete faculty
    res_del = client.delete("/api/v1/faculty/fac_cse_01")
    assert res_del.status_code == 204


def test_user_provisioning_privilege_boundary(client: TestClient):
    admin_payload = {
        "id": "usr_new_admin",
        "email": "hacker@domain.com",
        "display_name": "Pretending Admin",
        "role": "ADMIN",
    }

    # 1. Unauthenticated request rejected (401)
    res_unauth = client.post("/api/v1/users/", json=admin_payload)
    assert res_unauth.status_code == 401

    # 2. Coordinator cannot create admin accounts (403 Forbidden)
    set_auth_context(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
    res_blocked = client.post("/api/v1/users/", json=admin_payload)
    assert res_blocked.status_code == 403
    assert "Elevated privileges required" in res_blocked.json()["detail"]

    # 3. System Admin can provision admin accounts (201 Created)
    set_auth_context(role=UserRole.ADMIN, department_id=None)
    res_admin_ok = client.post("/api/v1/users/", json=admin_payload)
    assert res_admin_ok.status_code == 201
    assert res_admin_ok.json()["role"] == "ADMIN"


def test_allotment_relationship_validation_api(client: TestClient):
    set_auth_context(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    alt_payload = {
        "id": "alt_2026_odd_cse_5a",
        "academic_year": "2026-2027",
        "semester": 5,
        "department_id": "dept_cse",
        "subject_id": "21CS51",
        "faculty_id": "fac_cse_01",
        "section": "A",
        "weekly_hours_allocated": 4,
    }

    # Fails with 422 because referenced faculty and subject do not exist yet
    res_fail = client.post("/api/v1/allotments/", json=alt_payload)
    assert res_fail.status_code == 422
    assert "relationship_validation_failed" in res_fail.json()["error_type"]

    # Provision faculty and subject first
    client.post(
        "/api/v1/faculty/",
        json={
            "id": "fac_cse_01",
            "name": "Dr. Ananya",
            "email": "ananya@college.edu",
            "department_id": "dept_cse",
            "designation": "Professor",
        },
    )
    client.post(
        "/api/v1/subjects/",
        json={
            "id": "21CS51",
            "code": "21CS51",
            "title": "Automata Theory",
            "department_id": "dept_cse",
            "semester": 5,
            "credits": 3,
            "weekly_hours": 4,
        },
    )

    # Now allotment succeeds
    res_ok = client.post("/api/v1/allotments/", json=alt_payload)
    assert res_ok.status_code == 201
    assert res_ok.json()["id"] == "alt_2026_odd_cse_5a"


def test_rooms_and_labs_endpoints(client: TestClient):
    set_auth_context(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    # Create room
    res_room = client.post(
        "/api/v1/rooms/",
        json={"id": "room_lh101", "name": "LH 101", "capacity": 65},
    )
    assert res_room.status_code == 201
    assert res_room.json()["id"] == "room_lh101"

    # Create lab
    res_lab = client.post(
        "/api/v1/labs/",
        json={
            "id": "lab_iot_01",
            "name": "IoT Research Lab",
            "lab_type": "IOT_LAB",
            "capacity": 30,
            "workstations_count": 30,
            "department_id": "dept_cse",
        },
    )
    assert res_lab.status_code == 201
    assert res_lab.json()["id"] == "lab_iot_01"

    # List rooms & labs
    assert len(client.get("/api/v1/rooms/").json()) == 1
    assert len(client.get("/api/v1/labs/").json()) == 1
