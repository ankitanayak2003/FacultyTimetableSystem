"""
Unit tests for Department-Wise Faculty Access, Fixed Classrooms, Real-Time SSE,
and Database Migration Safety.
Uses zero-dependency synchronous trampoline runner for sandbox-safe execution on Windows.
"""

import os
import json
import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import AuthContext
from app.models.entities import UserRole
from app.schemas.entities import FacultyCreate, FixedClassroomCreate, FixedClassroomUpdate
from app.routers.faculty import list_faculty, get_faculty, create_faculty
from app.routers.fixed_classrooms import (
    create_fixed_classroom_assignment,
    get_fixed_classroom_by_id,
    update_fixed_classroom_assignment,
    list_fixed_classrooms,
)
from app.core.realtime import realtime_broadcaster
from app.services.migration import database_migration_manager
from app.repositories import faculty_repository, fixed_classroom_repository


def sync_runner(coro):
    """Zero-dependency coroutine trampoline for sandbox-safe async execution."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


@pytest.fixture(autouse=True)
def mock_db_fixture(monkeypatch):
    """Ensure all tests use mock Firestore."""
    client = MockFirestoreClient()
    monkeypatch.setattr(firebase_manager, "_db", client)
    monkeypatch.setattr(firebase_manager, "_is_initialized", True)
    yield client
    client.reset()


def make_auth(
    role: UserRole,
    department_id: str = "dept_aids",
    uid: str = "usr_test_01",
    email: str = "test@sode-edu.in",
) -> AuthContext:
    return AuthContext(
        uid=uid,
        email=email,
        role=role,
        department_id=department_id,
        is_active=True,
    )


# =====================================================================
# 1. Department-Wise Faculty Access Tests
# =====================================================================

def test_dean_has_global_faculty_access():
    """Dean can view faculty across all departments."""
    admin_ctx = make_auth(UserRole.ADMIN, "dept_admin")
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_aids_01", name="Prof AIDS", department_id="dept_aids",
            email="aids@sode-edu.in", designation="Assistant Professor"
        ),
        auth_ctx=admin_ctx,
    ))
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_cse_01", name="Prof CSE", department_id="dept_cse",
            email="cse@sode-edu.in", designation="Associate Professor"
        ),
        auth_ctx=admin_ctx,
    ))

    # Dean queries faculty with no department filter
    dean_ctx = make_auth(UserRole.DEAN, "dept_admin")
    results = sync_runner(list_faculty(department_id=None, auth_ctx=dean_ctx))
    fac_ids = [f["id"] for f in results]
    assert "fac_aids_01" in fac_ids
    assert "fac_cse_01" in fac_ids


def test_basic_science_coordinator_cross_department_read():
    """Basic Science Coordinator has cross-department read access for shared faculty."""
    admin_ctx = make_auth(UserRole.ADMIN, "dept_admin")
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_math_01", name="Dr. Mathematics", department_id="dept_basic_sci",
            email="math@sode-edu.in", designation="Professor"
        ),
        auth_ctx=admin_ctx,
    ))
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_mech_01", name="Dr. Mechanical", department_id="dept_mech",
            email="mech@sode-edu.in", designation="Associate Professor"
        ),
        auth_ctx=admin_ctx,
    ))

    # Basic Science Coordinator listing
    bsc_ctx = make_auth(UserRole.BASIC_SCIENCE_COORDINATOR, "dept_basic_sci")
    results = sync_runner(list_faculty(department_id=None, auth_ctx=bsc_ctx))
    fac_ids = [f["id"] for f in results]
    assert "fac_math_01" in fac_ids
    assert "fac_mech_01" in fac_ids


def test_department_coordinator_restricted_to_own_department():
    """Department Coordinator cannot query or URL-manipulate faculty from other departments."""
    admin_ctx = make_auth(UserRole.ADMIN, "dept_admin")
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_aids_10", name="Prof AIDS 10", department_id="dept_aids",
            email="aids10@sode-edu.in", designation="Assistant Professor"
        ),
        auth_ctx=admin_ctx,
    ))
    sync_runner(create_faculty(
        FacultyCreate(
            id="fac_cse_10", name="Prof CSE 10", department_id="dept_cse",
            email="cse10@sode-edu.in", designation="Assistant Professor"
        ),
        auth_ctx=admin_ctx,
    ))

    # AIDS Coordinator querying department_id=dept_cse should be forbidden (403)
    aids_ctx = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids")
    with pytest.raises(HTTPException) as exc_info:
        sync_runner(list_faculty(department_id="dept_cse", auth_ctx=aids_ctx))
    assert exc_info.value.status_code == 403

    # AIDS Coordinator accessing own department should succeed
    own_results = sync_runner(list_faculty(department_id="dept_aids", auth_ctx=aids_ctx))
    assert len(own_results) >= 1
    assert all(f["department_id"] == "dept_aids" for f in own_results)

    # URL manipulation check: AIDS Coordinator attempting GET /faculty/fac_cse_10
    with pytest.raises(HTTPException) as direct_exc:
        sync_runner(get_faculty("fac_cse_10", auth_ctx=aids_ctx))
    assert direct_exc.value.status_code == 403


# =====================================================================
# 2. Fixed Classroom Allocation & Collision Tests
# =====================================================================

def test_fixed_classroom_provisional_creation_and_collision():
    """Tests provisional fixed classroom allocation and collision prevention."""
    aids_ctx = make_auth(UserRole.DEPARTMENT_COORDINATOR, "dept_aids")

    # 1. Create provisional fixed classroom for AIDS Sem 3 Sec A
    payload_a = FixedClassroomCreate(
        department_id="dept_aids",
        academic_year="2024-2025",
        semester=3,
        section="A",
        student_year="Second Year",
        allocation_status="PROVISIONAL",
        is_provisional=True,
        capacity=60,
    )
    fcr_a = sync_runner(create_fixed_classroom_assignment(payload_a, auth_ctx=aids_ctx))
    assert fcr_a["is_provisional"] is True
    assert fcr_a["allocation_status"] == "PROVISIONAL"
    assert "classroom_dept_aids_year2_section_a" in fcr_a["classroom_id"] or "fcr_" in fcr_a["id"]

    # 2. Confirm classroom LH-301 for AIDS Sem 3 Sec A
    confirmed_payload = FixedClassroomUpdate(
        classroom_id="room_lh_301",
        classroom_name="Lecture Hall 301",
        allocation_status="CONFIRMED",
        is_provisional=False,
    )
    updated_a = sync_runner(update_fixed_classroom_assignment(fcr_a["id"], confirmed_payload, auth_ctx=aids_ctx))
    assert updated_a["allocation_status"] == "CONFIRMED"
    assert updated_a["is_provisional"] is False

    # 3. Another section attempts to confirm the exact same classroom
    payload_b = FixedClassroomCreate(
        department_id="dept_aids",
        academic_year="2024-2025",
        semester=3,
        section="B",
        student_year="Second Year",
        classroom_id="room_lh_301",
        allocation_status="CONFIRMED",
        is_provisional=False,
    )
    with pytest.raises(HTTPException) as exc_b:
        sync_runner(create_fixed_classroom_assignment(payload_b, auth_ctx=aids_ctx))
    assert exc_b.value.status_code == 409  # Conflict on double-booking fixed classroom!


# =====================================================================
# 3. Real-Time Broadcaster Unit Tests
# =====================================================================

def test_realtime_broadcaster():
    """Verifies that realtime broadcaster creates queues and delivers events."""
    q = realtime_broadcaster.register_listener()
    assert realtime_broadcaster.active_connections_count >= 1

    realtime_broadcaster.broadcast("FACULTY_UPDATED", "fac_123", {"name": "Test Faculty"})
    event_payload = q.get_nowait()
    assert event_payload["event"] == "FACULTY_UPDATED"
    assert event_payload["entity_id"] == "fac_123"

    realtime_broadcaster.unregister_listener(q)


# =====================================================================
# 4. Database Migration Safety & Dry-Run Tests
# =====================================================================

def test_migration_safety_guard():
    """execute_migration must raise ValueError if confirmed=True is not passed."""
    with pytest.raises(ValueError, match="Explicit user confirmation required"):
        sync_runner(database_migration_manager.execute_migration(confirmed=False))


def test_migration_plan_dry_run():
    """Dry-run plan inspects collections, flags dummy records, and previews Excel data."""
    plan = sync_runner(database_migration_manager.plan_migration())
    assert plan["status"] == "DRY_RUN_PLAN"
    assert "firebase_project_id" in plan
    assert "dummy_records_flagged_for_removal" in plan
    assert "excel_import_preview" in plan
    assert plan["excel_import_preview"]["faculty_count"] == 87
    assert plan["excel_import_preview"]["rooms_count"] == 3
    assert plan["excel_import_preview"]["labs_count"] == 26
    assert plan["excel_import_preview"]["subjects_count"] == 73
    assert plan["approval_required"] is True


def test_migration_export_backup():
    """export_backup must export collections to a valid JSON file."""
    backup_file = sync_runner(database_migration_manager.export_backup())
    assert os.path.exists(backup_file)
    with open(backup_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "metadata" in data
    assert "collections" in data
    assert data["metadata"]["project_id"] == "mini-project-24d7b"
