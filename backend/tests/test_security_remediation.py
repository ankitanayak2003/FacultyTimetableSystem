"""
Comprehensive security and data-integrity remediation test suite.
Validates:
1. Authentication bypass elimination and server-side profile resolution.
2. Department-scoped authorization and default-deny enforcement.
3. Foreign key relationship validation on updates.
4. Native atomic duplicate document creation.
5. Referential integrity guards for faculty and subject deletion.
6. Timetable child-slot cascade deletion and published timetable immutability.
7. Double-booking conflict detection (faculty, room, section) and facility compatibility.
8. Server-calculated workload totals resistant to client tampering.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import get_current_user_context, AuthContext
from app.models.entities import UserRole


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """Ensure in-memory mock Firestore client and reset dependency overrides."""
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


def set_auth(
    role: UserRole = UserRole.DEPARTMENT_COORDINATOR,
    department_id: str = "dept_cse",
    uid: str = "usr_coord_cse",
    email: str = "coord.cse@college.edu",
    is_active: bool = True,
):
    """Sets a verified authenticated user context via FastAPI dependency overrides."""
    ctx = AuthContext(
        uid=uid,
        email=email,
        role=role,
        department_id=department_id,
        is_active=is_active,
    )
    app.dependency_overrides[get_current_user_context] = lambda: ctx
    return ctx


# ==============================================================================
# Task 1: Authentication & Header Bypass Elimination
# ==============================================================================

def test_auth_missing_token_and_header_bypass_blocked(client: TestClient):
    """Verifies unauthenticated calls fail with 401 and X-Actor-Role is completely ignored."""
    # 1. Missing token on write
    res_fac = client.post("/api/v1/faculty/", json={"id": "f1", "name": "Prof", "email": "p@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    assert res_fac.status_code == 401
    assert "credentials were not provided" in res_fac.json()["detail"]

    # 2. X-Actor-Role header provided without Bearer token is rejected with 401
    res_bypass = client.post(
        "/api/v1/faculty/",
        json={"id": "f1", "name": "Prof", "email": "p@college.edu", "department_id": "dept_cse", "designation": "Professor"},
        headers={"X-Actor-Role": "ADMIN"},
    )
    assert res_bypass.status_code == 401

    # 3. Workload read without token is rejected with 401
    res_wl = client.get("/api/v1/workload-records/")
    assert res_wl.status_code == 401


def test_firebase_token_verification_and_profile_lookup(client: TestClient, setup_test_env):
    """Verifies Firebase token verification, profile existence, active check, and role validation."""
    mock_db = setup_test_env

    # 1. Invalid or expired token
    with patch("firebase_admin.auth.verify_id_token", side_effect=Exception("Token expired")):
        res_expired = client.get("/api/v1/faculty/", headers={"Authorization": "Bearer bad_token"})
        assert res_expired.status_code == 401
        assert "Invalid or expired" in res_expired.json()["detail"]

    # 2. Valid token, but UID not in Firestore 'users' collection -> 401 Unknown profile
    with patch("firebase_admin.auth.verify_id_token", return_value={"uid": "usr_unregistered", "email": "unregistered@college.edu"}):
        res_unregistered = client.get("/api/v1/faculty/", headers={"Authorization": "Bearer valid_token"})
        assert res_unregistered.status_code == 401
        assert "was not found in system database" in res_unregistered.json()["detail"]

    # Seed an inactive user profile
    mock_db.collection("users").document("usr_inactive").set({
        "id": "usr_inactive",
        "email": "inactive@college.edu",
        "display_name": "Inactive User",
        "role": "FACULTY",
        "department_id": "dept_cse",
        "is_active": False,
    })

    # 3. User profile is inactive -> 403 Forbidden
    with patch("firebase_admin.auth.verify_id_token", return_value={"uid": "usr_inactive", "email": "inactive@college.edu"}):
        res_inactive = client.get("/api/v1/faculty/", headers={"Authorization": "Bearer valid_token"})
        assert res_inactive.status_code == 403
        assert "inactive or disabled" in res_inactive.json()["detail"]

    # Seed a user profile with invalid role
    mock_db.collection("users").document("usr_bad_role").set({
        "id": "usr_bad_role",
        "email": "bad_role@college.edu",
        "display_name": "Bad Role User",
        "role": "SUPER_ADMIN_CUSTOM",
        "department_id": "dept_cse",
        "is_active": True,
    })

    # 4. User profile has invalid role -> 401 Unauthorized
    with patch("firebase_admin.auth.verify_id_token", return_value={"uid": "usr_bad_role", "email": "bad_role@college.edu"}):
        res_bad_role = client.get("/api/v1/faculty/", headers={"Authorization": "Bearer valid_token"})
        assert res_bad_role.status_code == 401
        assert "Invalid server-managed role configuration" in res_bad_role.json()["detail"]

    # Seed a valid active user profile
    mock_db.collection("users").document("usr_valid").set({
        "id": "usr_valid",
        "email": "valid@college.edu",
        "display_name": "Valid Faculty",
        "role": "FACULTY",
        "department_id": "dept_cse",
        "is_active": True,
    })

    # 5. Valid active user profile succeeds
    with patch("firebase_admin.auth.verify_id_token", return_value={"uid": "usr_valid", "email": "valid@college.edu"}):
        res_valid = client.get("/api/v1/faculty/", headers={"Authorization": "Bearer valid_token"})
        assert res_valid.status_code == 200


# ==============================================================================
# Task 2: Department-Scoped Authorization & Default-Deny
# ==============================================================================

def test_coordinator_cross_department_access_blocked(client: TestClient):
    """Verifies that a Department Coordinator cannot manage another department's resources."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    # 1. Attempt to create faculty in ECE department -> 403
    res_fac = client.post(
        "/api/v1/faculty/",
        json={"id": "fac_ece_01", "name": "ECE Prof", "email": "ece@college.edu", "department_id": "dept_ece", "designation": "Professor"},
    )
    assert res_fac.status_code == 403
    assert "Department access violation" in res_fac.json()["detail"]

    # 2. Attempt to create subject in ECE department -> 403
    res_sub = client.post(
        "/api/v1/subjects/",
        json={"id": "21EC51", "code": "21EC51", "title": "Signals", "department_id": "dept_ece", "semester": 5, "credits": 4, "weekly_hours": 4},
    )
    assert res_sub.status_code == 403

    # 3. Attempt to create lab in ECE department -> 403
    res_lab = client.post(
        "/api/v1/labs/",
        json={"id": "lab_ece_01", "name": "DSP Lab", "lab_type": "HARDWARE_LAB", "capacity": 30, "workstations_count": 30, "department_id": "dept_ece"},
    )
    assert res_lab.status_code == 403

    # 4. Attempt to create allotment in ECE department -> 403
    res_alt = client.post(
        "/api/v1/allotments/",
        json={"id": "alt_ece_1", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_ece", "subject_id": "21EC51", "faculty_id": "fac_ece_01", "section": "A", "weekly_hours_allocated": 4},
    )
    assert res_alt.status_code == 403


def test_student_viewer_restrictions_and_draft_secrecy(client: TestClient):
    """Verifies students cannot access workload records and draft timetables remain hidden."""
    # 1. Anonymous student attempts to access workload records -> 401
    res_wl = client.get("/api/v1/workload-records/")
    assert res_wl.status_code == 401

    # 2. Coordinator creates a DRAFT timetable
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
    res_tt = client.post(
        "/api/v1/timetables/",
        json={
            "id": "tt_cse_5a_draft",
            "academic_year": "2026-2027",
            "department_id": "dept_cse",
            "semester": 5,
            "section": "A",
            "semester_type": "ODD",
        },
    )
    assert res_tt.status_code == 201

    # 3. Anonymous caller/student attempts to view the DRAFT timetable -> 404 (draft secrecy)
    app.dependency_overrides.clear()
    res_draft_view = client.get("/api/v1/timetables/tt_cse_5a_draft")
    assert res_draft_view.status_code == 404

    # 4. Coordinator updates timetable status to PUBLISHED
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")
    res_pub = client.put(
        "/api/v1/timetables/tt_cse_5a_draft",
        json={"status": "PUBLISHED"},
    )
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "PUBLISHED"

    # 5. Anonymous caller/student can now view the PUBLISHED timetable
    app.dependency_overrides.clear()
    res_pub_view = client.get("/api/v1/timetables/tt_cse_5a_draft")
    assert res_pub_view.status_code == 200
    assert res_pub_view.json()["id"] == "tt_cse_5a_draft"


# ==============================================================================
# Task 3: Validate Foreign References on Updates
# ==============================================================================

def test_foreign_key_validation_on_updates(client: TestClient):
    """Verifies that updating foreign references to nonexistent entities fails with 422."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    # Seed valid faculty, subject, room, timetable
    client.post("/api/v1/faculty/", json={"id": "fac_u1", "name": "Dr. U1", "email": "u1@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    client.post("/api/v1/subjects/", json={"id": "sub_u1", "code": "21CS51", "title": "Automata", "department_id": "dept_cse", "semester": 5, "credits": 3, "weekly_hours": 4})
    client.post("/api/v1/rooms/", json={"id": "room_u1", "name": "Room 101", "capacity": 60})
    client.post("/api/v1/timetables/", json={"id": "tt_u1", "academic_year": "2026-2027", "department_id": "dept_cse", "semester": 5, "section": "A", "semester_type": "ODD"})

    # Create valid allotment
    res_alt = client.post(
        "/api/v1/allotments/",
        json={"id": "alt_u1", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_u1", "faculty_id": "fac_u1", "section": "A", "weekly_hours_allocated": 4},
    )
    assert res_alt.status_code == 201

    # Update allotment with nonexistent faculty_id -> 422
    res_bad_fac = client.put("/api/v1/allotments/alt_u1", json={"faculty_id": "fac_nonexistent"})
    assert res_bad_fac.status_code == 422
    assert "relationship_validation_failed" in res_bad_fac.json()["error_type"]

    # Update allotment with nonexistent subject_id -> 422
    res_bad_sub = client.put("/api/v1/allotments/alt_u1", json={"subject_id": "sub_nonexistent"})
    assert res_bad_sub.status_code == 422

    # Create valid slot
    res_slot = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_u1", "timetable_id": "tt_u1", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_u1", "faculty_id": "fac_u1", "room_id": "room_u1"},
    )
    assert res_slot.status_code == 201

    # Update slot with nonexistent room_id -> 422
    res_bad_slot_room = client.put("/api/v1/timetable-slots/slot_u1", json={"room_id": "room_nonexistent"})
    assert res_bad_slot_room.status_code == 422

    # Update slot with nonexistent faculty_id -> 422
    res_bad_slot_fac = client.put("/api/v1/timetable-slots/slot_u1", json={"faculty_id": "fac_nonexistent"})
    assert res_bad_slot_fac.status_code == 422


# ==============================================================================
# Task 4: Native Atomic Duplicate Creation
# ==============================================================================

def test_duplicate_document_creation_safe_and_immutable(client: TestClient):
    """Verifies duplicate document creation returns 409 without overwriting original data."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    original_room = {"id": "room_dup_01", "name": "Initial Name", "capacity": 50}
    res1 = client.post("/api/v1/rooms/", json=original_room)
    assert res1.status_code == 201

    # Attempt to overwrite by creating the same ID with different data
    res_dup = client.post("/api/v1/rooms/", json={"id": "room_dup_01", "name": "Hacked Name", "capacity": 100})
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"]

    # Verify original document was not altered
    res_get = client.get("/api/v1/rooms/room_dup_01")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Initial Name"
    assert res_get.json()["capacity"] == 50


# ==============================================================================
# Task 6: Deletion & Orphaned-Reference Guards
# ==============================================================================

def test_deletion_referential_guards(client: TestClient):
    """Verifies faculty and subject deletion is blocked when referenced in slots or allotments."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    client.post("/api/v1/faculty/", json={"id": "fac_guard", "name": "Dr. Guard", "email": "g@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    client.post("/api/v1/subjects/", json={"id": "sub_guard", "code": "21CS52", "title": "DBMS", "department_id": "dept_cse", "semester": 5, "credits": 4, "weekly_hours": 4})
    client.post("/api/v1/rooms/", json={"id": "room_guard", "name": "LH 201", "capacity": 70})
    client.post("/api/v1/timetables/", json={"id": "tt_guard", "academic_year": "2026-2027", "department_id": "dept_cse", "semester": 5, "section": "A", "semester_type": "ODD"})

    # 1. Blocked by allotment reference
    client.post("/api/v1/allotments/", json={"id": "alt_guard", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_guard", "faculty_id": "fac_guard", "section": "A", "weekly_hours_allocated": 4})

    res_del_fac_alt = client.delete("/api/v1/faculty/fac_guard")
    assert res_del_fac_alt.status_code == 422
    assert "active course allotments exist" in res_del_fac_alt.json()["detail"]

    res_del_sub_alt = client.delete("/api/v1/subjects/sub_guard")
    assert res_del_sub_alt.status_code == 422
    assert "active course allotments reference it" in res_del_sub_alt.json()["detail"]

    # Delete allotment, but add a timetable slot
    client.delete("/api/v1/allotments/alt_guard")
    client.post("/api/v1/timetable-slots/", json={"id": "slot_guard", "timetable_id": "tt_guard", "day": "TUESDAY", "slot_number": 2, "start_time": "10:00", "end_time": "11:00", "subject_id": "sub_guard", "faculty_id": "fac_guard", "room_id": "room_guard"})

    # 2. Blocked by timetable slot reference
    res_del_fac_slot = client.delete("/api/v1/faculty/fac_guard")
    assert res_del_fac_slot.status_code == 422
    assert "scheduled timetable slots reference this instructor" in res_del_fac_slot.json()["detail"]

    res_del_sub_slot = client.delete("/api/v1/subjects/sub_guard")
    assert res_del_sub_slot.status_code == 422
    assert "scheduled timetable slots reference it" in res_del_sub_slot.json()["detail"]


def test_timetable_cascade_deletion_and_published_lock(client: TestClient):
    """Verifies that published timetables are locked against mutation, and draft deletion cleans child slots."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    client.post("/api/v1/faculty/", json={"id": "fac_cas", "name": "Dr. Cas", "email": "cas@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    client.post("/api/v1/subjects/", json={"id": "sub_cas", "code": "21CS53", "title": "CN", "department_id": "dept_cse", "semester": 5, "credits": 4, "weekly_hours": 4})
    client.post("/api/v1/rooms/", json={"id": "room_cas", "name": "LH 301", "capacity": 60})
    client.post("/api/v1/timetables/", json={"id": "tt_cas", "academic_year": "2026-2027", "department_id": "dept_cse", "semester": 5, "section": "A", "semester_type": "ODD"})
    client.post("/api/v1/timetable-slots/", json={"id": "slot_cas_1", "timetable_id": "tt_cas", "day": "WEDNESDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_cas", "faculty_id": "fac_cas", "room_id": "room_cas"})

    # 1. Publish timetable
    client.put("/api/v1/timetables/tt_cas", json={"status": "PUBLISHED"})

    # 2. Deleting a published timetable is blocked
    res_del_pub = client.delete("/api/v1/timetables/tt_cas")
    assert res_del_pub.status_code == 422
    assert "is PUBLISHED" in res_del_pub.json()["detail"]

    # 3. Adding slot to published timetable is blocked
    res_add_slot = client.post("/api/v1/timetable-slots/", json={"id": "slot_cas_2", "timetable_id": "tt_cas", "day": "WEDNESDAY", "slot_number": 2, "start_time": "10:00", "end_time": "11:00", "subject_id": "sub_cas", "faculty_id": "fac_cas", "room_id": "room_cas"})
    assert res_add_slot.status_code == 422
    assert "is PUBLISHED" in res_add_slot.json()["detail"]

    # 4. Deleting slot from published timetable is blocked
    res_del_slot = client.delete("/api/v1/timetable-slots/slot_cas_1")
    assert res_del_slot.status_code == 422
    assert "is PUBLISHED" in res_del_slot.json()["detail"]

    # 5. Revert timetable to DRAFT and verify cascade deletion cleans up slots
    client.put("/api/v1/timetables/tt_cas", json={"status": "DRAFT"})
    res_del_tt = client.delete("/api/v1/timetables/tt_cas")
    assert res_del_tt.status_code == 204

    # Slot should no longer exist
    res_slot_missing = client.get("/api/v1/timetable-slots/slot_cas_1")
    assert res_slot_missing.status_code == 404


# ==============================================================================
# Task 7: Timetable Slot Scheduling Conflicts & Facility Rules
# ==============================================================================

def test_scheduling_conflict_and_facility_validation(client: TestClient):
    """Verifies double-booking checks (faculty, room, section) and facility compatibility rules."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    client.post("/api/v1/faculty/", json={"id": "fac_sc1", "name": "Dr. SC1", "email": "sc1@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    client.post("/api/v1/faculty/", json={"id": "fac_sc2", "name": "Dr. SC2", "email": "sc2@college.edu", "department_id": "dept_cse", "designation": "Professor"})
    client.post("/api/v1/subjects/", json={"id": "sub_th", "code": "21CS54", "title": "Theory Course", "department_id": "dept_cse", "semester": 5, "subject_type": "THEORY", "credits": 3, "weekly_hours": 3})
    client.post("/api/v1/subjects/", json={"id": "sub_lb", "code": "21CSL58", "title": "DBMS Lab", "department_id": "dept_cse", "semester": 5, "subject_type": "LAB", "credits": 2, "weekly_hours": 3})
    client.post("/api/v1/rooms/", json={"id": "room_sc1", "name": "LH 101", "capacity": 60})
    client.post("/api/v1/rooms/", json={"id": "room_sc2", "name": "LH 102", "capacity": 60})
    client.post("/api/v1/labs/", json={"id": "lab_sc1", "name": "Database Lab", "lab_type": "COMPUTER_LAB", "capacity": 30, "workstations_count": 30, "department_id": "dept_cse"})
    client.post("/api/v1/timetables/", json={"id": "tt_sc_a", "academic_year": "2026-2027", "department_id": "dept_cse", "semester": 5, "section": "A", "semester_type": "ODD"})
    client.post("/api/v1/timetables/", json={"id": "tt_sc_b", "academic_year": "2026-2027", "department_id": "dept_cse", "semester": 5, "section": "B", "semester_type": "ODD"})

    # 1. Facility Compatibility: Theory subject in Lab -> 422
    res_th_in_lab = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_mismatch_1", "timetable_id": "tt_sc_a", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_th", "faculty_id": "fac_sc1", "room_id": "lab_sc1"},
    )
    assert res_th_in_lab.status_code == 422
    assert "Facility mismatch" in res_th_in_lab.json()["detail"]

    # 2. Facility Compatibility: Lab subject in Classroom -> 422
    res_lb_in_room = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_mismatch_2", "timetable_id": "tt_sc_a", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_lb", "faculty_id": "fac_sc1", "room_id": "room_sc1"},
    )
    assert res_lb_in_room.status_code == 422
    assert "Facility mismatch" in res_lb_in_room.json()["detail"]

    # 3. Create initial baseline valid slot: Monday, Slot 1, Section A, fac_sc1, room_sc1
    res_base = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_base", "timetable_id": "tt_sc_a", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_th", "faculty_id": "fac_sc1", "room_id": "room_sc1"},
    )
    assert res_base.status_code == 201

    # 4. Faculty Double-Booking: fac_sc1 assigned to Section B at the same day & slot
    res_fac_clash = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_fac_clash", "timetable_id": "tt_sc_b", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_th", "faculty_id": "fac_sc1", "room_id": "room_sc2"},
    )
    assert res_fac_clash.status_code == 422
    assert "Faculty double-booking" in res_fac_clash.json()["detail"]

    # 5. Room Double-Booking: room_sc1 assigned to Section B at the same day & slot
    res_room_clash = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_room_clash", "timetable_id": "tt_sc_b", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_th", "faculty_id": "fac_sc2", "room_id": "room_sc1"},
    )
    assert res_room_clash.status_code == 422
    assert "Room double-booking" in res_room_clash.json()["detail"]

    # 6. Section Double-Booking: Section A assigned another slot at the same day & slot
    res_sec_clash = client.post(
        "/api/v1/timetable-slots/",
        json={"id": "slot_sec_clash", "timetable_id": "tt_sc_a", "day": "MONDAY", "slot_number": 1, "start_time": "09:00", "end_time": "10:00", "subject_id": "sub_th", "faculty_id": "fac_sc2", "room_id": "room_sc2"},
    )
    assert res_sec_clash.status_code == 422
    assert "Section schedule conflict" in res_sec_clash.json()["detail"]


# ==============================================================================
# Task 8: Server-Calculated Workload Totals
# ==============================================================================

def test_server_calculated_workload_totals_and_tamper_resistance(client: TestClient):
    """Verifies that workload totals are derived authoritatively and cannot be forged by clients."""
    set_auth(role=UserRole.DEPARTMENT_COORDINATOR, department_id="dept_cse")

    # Seed faculty with max 16 hours
    client.post(
        "/api/v1/faculty/",
        json={"id": "fac_wl_01", "name": "Dr. Workload", "email": "wl@college.edu", "department_id": "dept_cse", "designation": "Associate Professor", "max_weekly_hours": 16, "min_weekly_hours": 10},
    )
    # Theory subject (3 hours)
    client.post(
        "/api/v1/subjects/",
        json={"id": "sub_wl_th", "code": "21CS55", "title": "Theory 1", "department_id": "dept_cse", "semester": 5, "subject_type": "THEORY", "credits": 3, "weekly_hours": 3},
    )
    # Lab subject (4 hours)
    client.post(
        "/api/v1/subjects/",
        json={"id": "sub_wl_lb", "code": "21CSL59", "title": "Lab 1", "department_id": "dept_cse", "semester": 5, "subject_type": "LAB", "credits": 2, "weekly_hours": 4},
    )

    # Create Allotment 1: Theory (3 hours)
    client.post(
        "/api/v1/allotments/",
        json={"id": "alt_wl_1", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_wl_th", "faculty_id": "fac_wl_01", "section": "A", "weekly_hours_allocated": 3},
    )
    # Create Allotment 2: Theory (3 hours)
    client.post(
        "/api/v1/allotments/",
        json={"id": "alt_wl_2", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_wl_th", "faculty_id": "fac_wl_01", "section": "B", "weekly_hours_allocated": 3},
    )
    # Create Allotment 3: Lab (4 hours)
    client.post(
        "/api/v1/allotments/",
        json={"id": "alt_wl_3", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_wl_lb", "faculty_id": "fac_wl_01", "section": "A", "weekly_hours_allocated": 4},
    )

    # Client submits blatantly FALSE metrics claiming 100 theory hours and overloaded = True
    fraudulent_payload = {
        "id": "wl_record_2026_fac_wl_01",
        "faculty_id": "fac_wl_01",
        "academic_year": "2026-2027",
        "department_id": "dept_cse",
        "semester_type": "ODD",
        "total_theory_hours": 100,
        "total_lab_hours": 50,
        "total_hours": 150,
        "is_overloaded": True,
    }

    res_create = client.post("/api/v1/workload-records/", json=fraudulent_payload)
    assert res_create.status_code == 201
    record = res_create.json()

    # Verify that the server calculated the true metrics: 3+3=6 theory, 4 lab, 10 total, not overloaded (10 <= 16)
    assert record["total_theory_hours"] == 6
    assert record["total_lab_hours"] == 4
    assert record["total_hours"] == 10
    assert record["max_allowed_hours"] == 16
    assert record["is_overloaded"] is False

    # Now add another allotment for 8 hours (total becomes 18 hours > max 16)
    client.post(
        "/api/v1/allotments/",
        json={"id": "alt_wl_4", "academic_year": "2026-2027", "semester": 5, "department_id": "dept_cse", "subject_id": "sub_wl_lb", "faculty_id": "fac_wl_01", "section": "B", "weekly_hours_allocated": 8},
    )

    # Client attempts PUT with false claim of 0 hours
    res_update = client.put(
        "/api/v1/workload-records/wl_record_2026_fac_wl_01",
        json={"total_hours": 0, "is_overloaded": False},
    )
    assert res_update.status_code == 200
    updated_record = res_update.json()

    # Verify server authoritatively recalculated: 6 theory + 12 lab = 18 total hours, is_overloaded = True
    assert updated_record["total_theory_hours"] == 6
    assert updated_record["total_lab_hours"] == 12
    assert updated_record["total_hours"] == 18
    assert updated_record["is_overloaded"] is True
