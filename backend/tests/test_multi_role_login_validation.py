"""
Comprehensive Multi-Role Login Validation and Institutional Role Selection Tests.
Strictly implements the 10 mandatory test cases from AQS specifications.
Strictly uses MockFirestoreClient and mocked firebase_admin.auth (zero live Firestore writes).
"""

import pytest
from fastapi import HTTPException

from tests.mock_firestore import MockFirestoreClient
from app.core.firebase import firebase_manager
from app.core.dependencies import (
    get_current_user_context,
    check_department_access,
    AuthContext,
)
from app.models.entities import UserRole
from app.repositories import user_repository, department_repository
from app.routers.auth import (
    get_authenticated_me,
    validate_selected_role,
    RoleValidationRequest,
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

    # Mock verify_id_token to map bearer token to uid
    def fake_verify_id_token(token):
        if not token or token == "invalid-token" or token == "expired-token":
            raise ValueError("Token is invalid or expired")
        # Token format: "token_<uid>"
        uid = token.replace("token_", "") if token.startswith("token_") else token
        return {"uid": uid, "email": f"{uid}@sode-edu.in"}

    monkeypatch.setattr("app.core.dependencies.auth.verify_id_token", fake_verify_id_token)

    # Seed departments
    sync_runner(department_repository.create("dept_cse", {"id": "dept_cse", "code": "CSE", "name": "Computer Science"}))
    sync_runner(department_repository.create("dept_aids", {"id": "dept_aids", "code": "AIDS", "name": "AI & Data Science"}))

    yield client
    client.reset()


def seed_user(
    uid: str,
    email: str,
    role: str = "FACULTY",
    department_id: str | None = None,
    roles: list[str] | None = None,
    role_assignments: list[dict] | None = None,
    is_active: bool = True,
):
    data = {
        "id": uid,
        "email": email,
        "display_name": f"User {uid}",
        "role": role,
        "department_id": department_id,
        "is_active": is_active,
    }
    if roles is not None:
        data["roles"] = roles
    if role_assignments is not None:
        data["role_assignments"] = role_assignments

    sync_runner(user_repository.create(uid, data))


# --------------------------------------------------------------------------
# Test Case 1: Dean selects DEAN – allowed
# --------------------------------------------------------------------------
def test_1_dean_selects_dean_allowed():
    seed_user("uid_dean", "dean@aqs.test", role="DEAN", department_id=None)

    auth_ctx = sync_runner(
        get_current_user_context(
            authorization="Bearer token_uid_dean",
            x_aqs_active_role="DEAN",
        )
    )
    assert auth_ctx.role == UserRole.DEAN
    assert auth_ctx.is_dean is True

    # Validate via /auth/me
    me = sync_runner(get_authenticated_me(auth_ctx=auth_ctx))
    assert me.role == "DEAN"
    assert me.portal_view == "dean-dashboard"

    # Validate via /auth/validate-role
    val_res = sync_runner(
        validate_selected_role(
            RoleValidationRequest(selected_role="DEAN"),
            auth_ctx=auth_ctx,
        )
    )
    assert val_res.active_role == "DEAN"
    assert val_res.portal_view == "dean-dashboard"


# --------------------------------------------------------------------------
# Test Case 2: Dean selects FACULTY – rejected
# --------------------------------------------------------------------------
def test_2_dean_selects_faculty_rejected():
    seed_user("uid_dean_only", "dean@aqs.test", role="DEAN", department_id=None)

    with pytest.raises(HTTPException) as exc_info:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_dean_only",
                x_aqs_active_role="FACULTY",
            )
        )
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "The selected institutional role does not match your assigned role. Please select the correct role."


# --------------------------------------------------------------------------
# Test Case 3: Faculty + Department Coordinator selects FACULTY – allowed
# --------------------------------------------------------------------------
def test_3_faculty_plus_coordinator_selects_faculty_allowed():
    seed_user(
        "uid_dual",
        "dual@aqs.test",
        role="FACULTY",
        department_id="dept_cse",
        roles=["FACULTY", "DEPARTMENT_COORDINATOR"],
        role_assignments=[
            {"role": "FACULTY", "department_id": "dept_cse"},
            {"role": "DEPARTMENT_COORDINATOR", "department_id": "dept_cse"},
        ],
    )

    auth_ctx = sync_runner(
        get_current_user_context(
            authorization="Bearer token_uid_dual",
            x_aqs_active_role="FACULTY",
        )
    )
    assert auth_ctx.role == UserRole.FACULTY
    assert auth_ctx.department_id == "dept_cse"

    me = sync_runner(get_authenticated_me(auth_ctx=auth_ctx))
    assert me.role == "FACULTY"
    assert me.portal_view == "faculty-dashboard"
    assert "FACULTY" in me.assigned_roles
    assert "DEPARTMENT_COORDINATOR" in me.assigned_roles


# --------------------------------------------------------------------------
# Test Case 4: Faculty + Department Coordinator selects DEPARTMENT_COORDINATOR – allowed
# --------------------------------------------------------------------------
def test_4_faculty_plus_coordinator_selects_coordinator_allowed():
    seed_user(
        "uid_dual_coord",
        "dual@aqs.test",
        role="FACULTY",
        department_id="dept_cse",
        roles=["FACULTY", "DEPARTMENT_COORDINATOR"],
        role_assignments=[
            {"role": "FACULTY", "department_id": "dept_cse"},
            {"role": "DEPARTMENT_COORDINATOR", "department_id": "dept_cse"},
        ],
    )

    auth_ctx = sync_runner(
        get_current_user_context(
            authorization="Bearer token_uid_dual_coord",
            x_aqs_active_role="DEPARTMENT_COORDINATOR",
        )
    )
    assert auth_ctx.role == UserRole.DEPARTMENT_COORDINATOR
    assert auth_ctx.department_id == "dept_cse"
    assert auth_ctx.is_dept_coordinator is True

    me = sync_runner(get_authenticated_me(auth_ctx=auth_ctx))
    assert me.role == "DEPARTMENT_COORDINATOR"
    assert me.portal_view == "dept-coordinator-dashboard"


# --------------------------------------------------------------------------
# Test Case 5: Faculty selects DEAN – rejected
# --------------------------------------------------------------------------
def test_5_faculty_selects_dean_rejected():
    # 5a. Single-role faculty
    seed_user("uid_single_fac", "fac@aqs.test", role="FACULTY", department_id="dept_cse")

    with pytest.raises(HTTPException) as exc_single:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_single_fac",
                x_aqs_active_role="DEAN",
            )
        )
    assert exc_single.value.status_code == 403
    assert exc_single.value.detail == "The selected institutional role does not match your assigned role. Please select the correct role."

    # 5b. Dual-role faculty (FACULTY + DEPARTMENT_COORDINATOR) attempting DEAN
    seed_user(
        "uid_dual_fac",
        "dual@aqs.test",
        role="FACULTY",
        roles=["FACULTY", "DEPARTMENT_COORDINATOR"],
    )
    with pytest.raises(HTTPException) as exc_dual:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_dual_fac",
                x_aqs_active_role="DEAN",
            )
        )
    assert exc_dual.value.status_code == 403
    assert exc_dual.value.detail == "You do not have access to the selected institutional portal. Please select one of your assigned roles."


# --------------------------------------------------------------------------
# Test Case 6: HOD selects DEPARTMENT_COORDINATOR – rejected unless explicitly assigned
# --------------------------------------------------------------------------
def test_6_hod_selects_coordinator_rejected_unless_assigned():
    # 6a. HOD without coordinator assignment
    seed_user("uid_hod_only", "hod@aqs.test", role="HOD", department_id="dept_cse")

    with pytest.raises(HTTPException) as exc_info:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_hod_only",
                x_aqs_active_role="DEPARTMENT_COORDINATOR",
            )
        )
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "The selected institutional role does not match your assigned role. Please select the correct role."

    # 6b. HOD explicitly assigned both HOD and DEPARTMENT_COORDINATOR
    seed_user(
        "uid_hod_coord",
        "hod_coord@aqs.test",
        role="HOD",
        department_id="dept_cse",
        roles=["HOD", "DEPARTMENT_COORDINATOR"],
        role_assignments=[
            {"role": "HOD", "department_id": "dept_cse"},
            {"role": "DEPARTMENT_COORDINATOR", "department_id": "dept_cse"},
        ],
    )
    auth_ctx = sync_runner(
        get_current_user_context(
            authorization="Bearer token_uid_hod_coord",
            x_aqs_active_role="DEPARTMENT_COORDINATOR",
        )
    )
    assert auth_ctx.role == UserRole.DEPARTMENT_COORDINATOR


# --------------------------------------------------------------------------
# Test Case 7: Coordinator attempts to access another department – rejected
# --------------------------------------------------------------------------
def test_7_coordinator_accesses_another_department_rejected():
    seed_user(
        "uid_coord_cse",
        "coord.cse@aqs.test",
        role="DEPARTMENT_COORDINATOR",
        department_id="dept_cse",
    )

    auth_ctx = sync_runner(
        get_current_user_context(
            authorization="Bearer token_uid_coord_cse",
            x_aqs_active_role="DEPARTMENT_COORDINATOR",
        )
    )
    assert auth_ctx.department_id == "dept_cse"

    # Coordinator for CSE attempts to access or modify AIDS department resources
    with pytest.raises(HTTPException) as exc_info:
        check_department_access(auth_ctx, "dept_aids")
    assert exc_info.value.status_code == 403
    assert "Department access violation" in exc_info.value.detail


# --------------------------------------------------------------------------
# Test Case 8: User manually changes selected role in frontend – rejected
# --------------------------------------------------------------------------
def test_8_user_manually_changes_selected_role_rejected():
    # User has only FACULTY assigned in Firestore
    seed_user("uid_hacker_fac", "hacker@aqs.test", role="FACULTY", department_id="dept_cse")

    # Client modifies X-AQS-Active-Role to DEAN or PRINCIPAL
    with pytest.raises(HTTPException) as exc_dean:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_hacker_fac",
                x_aqs_active_role="DEAN",
            )
        )
    assert exc_dean.value.status_code == 403
    assert "does not match your assigned role" in exc_dean.value.detail

    with pytest.raises(HTTPException) as exc_admin:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_hacker_fac",
                x_aqs_active_role="ADMIN",
            )
        )
    assert exc_admin.value.status_code == 403


# --------------------------------------------------------------------------
# Test Case 9: Inactive account – rejected
# --------------------------------------------------------------------------
def test_9_inactive_account_rejected():
    seed_user(
        "uid_inactive_user",
        "inactive@aqs.test",
        role="FACULTY",
        department_id="dept_cse",
        is_active=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        sync_runner(
            get_current_user_context(
                authorization="Bearer token_uid_inactive_user",
                x_aqs_active_role="FACULTY",
            )
        )
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Your account is inactive. Please contact the administrator."


# --------------------------------------------------------------------------
# Test Case 10: Invalid Firebase token – rejected
# --------------------------------------------------------------------------
def test_10_invalid_firebase_token_rejected():
    # 10a. Missing or invalid Authorization header
    with pytest.raises(HTTPException) as exc_missing:
        sync_runner(get_current_user_context(authorization=None))
    assert exc_missing.value.status_code == 401

    # 10b. Invalid/expired Bearer token
    with pytest.raises(HTTPException) as exc_invalid:
        sync_runner(get_current_user_context(authorization="Bearer invalid-token"))
    assert exc_invalid.value.status_code == 401
    assert "Invalid or expired" in exc_invalid.value.detail
