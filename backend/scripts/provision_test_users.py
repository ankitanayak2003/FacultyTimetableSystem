"""
Explicit Test Account Provisioning Script for AQS (Step 5).

Provisions the 12 standardized AQS test identities in Firebase Authentication
and Cloud Firestore `users/{uid}` documents.

SAFETY RULES:
- Never invoked automatically at application startup.
- Reads temporary password strictly from AQS_TEST_USER_PASSWORD env var.
- Never hardcodes, prints, logs, or stores passwords in Firestore.
- Verifies Firebase project ID (default: mini-project-24d7b) before any action.
- Requires explicit --confirm-create-test-users flag for writes, or --dry-run.
- Never modifies existing users' passwords or overwrites conflicting roles/departments.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure backend root is on sys.path when invoked as `python scripts/provision_test_users.py`
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from firebase_admin import auth as fb_auth
from app.core.firebase import firebase_manager
from app.models.entities import User, UserRole
from app.repositories import department_repository, user_repository

EXPECTED_FIREBASE_PROJECT_ID = "mini-project-24d7b"


@dataclass(frozen=True)
class TestUserSpec:
    email: str
    display_name: str
    role: UserRole
    department_key: Optional[str]


TEST_USER_SPECS: List[TestUserSpec] = [
    TestUserSpec("dean@aqs.test", "AQS Test Dean", UserRole.DEAN, None),
    TestUserSpec("ds.coord@aqs.test", "AQS Test DS Coordinator", UserRole.DEPARTMENT_COORDINATOR, "DS"),
    TestUserSpec("ml.coord@aqs.test", "AQS Test ML Coordinator", UserRole.DEPARTMENT_COORDINATOR, "ML"),
    TestUserSpec("cse.coord@aqs.test", "AQS Test CSE Coordinator", UserRole.DEPARTMENT_COORDINATOR, "CSE"),
    TestUserSpec("ec.coord@aqs.test", "AQS Test EC Coordinator", UserRole.DEPARTMENT_COORDINATOR, "EC"),
    TestUserSpec("mech.coord@aqs.test", "AQS Test MECH Coordinator", UserRole.DEPARTMENT_COORDINATOR, "MECH"),
    TestUserSpec("civil.coord@aqs.test", "AQS Test CIVIL Coordinator", UserRole.DEPARTMENT_COORDINATOR, "CIVIL"),
    TestUserSpec("bs.coord@aqs.test", "AQS Test Basic Science Coordinator", UserRole.BASIC_SCIENCE_COORDINATOR, "BASIC_SCIENCE"),
    TestUserSpec("ds.hod@aqs.test", "AQS Test DS HOD", UserRole.HOD, "DS"),
    TestUserSpec("cse.hod@aqs.test", "AQS Test CSE HOD", UserRole.HOD, "CSE"),
    TestUserSpec("ds.faculty@aqs.test", "AQS Test DS Faculty", UserRole.FACULTY, "DS"),
    TestUserSpec("cse.faculty@aqs.test", "AQS Test CSE Faculty", UserRole.FACULTY, "CSE"),
]

DEPARTMENT_ALIASES: Dict[str, tuple[str, ...]] = {
    "DS": ("ds", "aids", "ai&ds", "dept_aids", "dept_ds"),
    "ML": ("ml", "aiml", "ai&ml", "dept_aiml", "dept_ml"),
    "CSE": ("cse", "cs", "dept_cse"),
    "EC": ("ec", "ece", "dept_ece", "dept_ec"),
    "MECH": ("mech", "me", "dept_mech"),
    "CIVIL": ("civil", "cv", "dept_civil"),
    "BASIC_SCIENCE": (
        "basic_science",
        "dept_basic_science",
        "dept_chemistry",
        "dept_physics",
        "dept_math",
        "chemistry",
        "physics",
        "mathematics",
    ),
}


def resolve_existing_department_id(
    department_key: Optional[str],
    existing_departments: List[Dict[str, Any]],
) -> tuple[Optional[str], Optional[str]]:
    """
    Resolves a logical department key (e.g. 'DS', 'CSE', 'BASIC_SCIENCE') to an
    actual existing department ID from Firestore. Never invents new department IDs.
    Returns (department_id, error_reason).
    """
    if department_key is None:
        return None, None

    aliases = DEPARTMENT_ALIASES.get(department_key, (department_key.lower(),))
    for dept in existing_departments:
        dept_id = str(dept.get("id") or "").strip()
        dept_code = str(dept.get("code") or "").strip().lower()
        dept_cat = str(dept.get("category") or "").strip().lower()
        if dept_id.lower() in aliases or dept_code in aliases:
            return dept_id, None
        if department_key == "BASIC_SCIENCE" and dept_cat == "basic_science":
            return dept_id, None

    if department_key == "BASIC_SCIENCE":
        # Basic Science Coordinator can operate with department_id=None if no dedicated BS dept doc exists
        return None, None

    return None, f"Existing department record not found in database for '{department_key}'."


async def provision_test_users(
    *,
    expected_project_id: str = EXPECTED_FIREBASE_PROJECT_ID,
    actual_project_id: Optional[str] = None,
    dry_run: bool = False,
    confirm_create: bool = False,
    password: Optional[str] = None,
    auth_client: Any = fb_auth,
    user_repo: Any = user_repository,
    dept_repo: Any = department_repository,
) -> Dict[str, Any]:
    """
    Provisions the 12 test users idempotently without modifying existing passwords
    or overwriting conflicting Firestore user documents.
    """
    if not actual_project_id or actual_project_id != expected_project_id:
        raise RuntimeError(
            f"Firebase project ID verification failed: expected '{expected_project_id}', "
            f"got '{actual_project_id}'."
        )

    if not dry_run and not confirm_create:
        raise RuntimeError(
            "Explicit confirmation required: pass --confirm-create-test-users to write accounts, "
            "or --dry-run to preview."
        )

    existing_departments = await dept_repo.list_all(limit=200)

    summary: Dict[str, Any] = {
        "dry_run": dry_run,
        "project_id": actual_project_id,
        "created": [],
        "already_existing": [],
        "skipped": [],
        "conflicting": [],
    }

    for spec in TEST_USER_SPECS:
        target_dept_id, dept_err = resolve_existing_department_id(spec.department_key, existing_departments)
        if dept_err:
            summary["conflicting"].append(
                {
                    "email": spec.email,
                    "reason": dept_err,
                }
            )
            continue

        # 1. Look up or create Firebase Authentication account
        fb_user = None
        auth_created = False
        try:
            fb_user = auth_client.get_user_by_email(spec.email)
        except Exception:
            fb_user = None

        if fb_user is None:
            if dry_run:
                summary["created"].append(
                    {
                        "email": spec.email,
                        "role": spec.role.value,
                        "department_id": target_dept_id,
                        "note": "Would create Firebase Auth user and Firestore users/{uid} doc",
                    }
                )
                continue

            if not password or len(password) < 6:
                raise RuntimeError(
                    "AQS_TEST_USER_PASSWORD environment variable must be set (min 6 chars) "
                    "before creating missing Firebase Auth test users."
                )

            fb_user = auth_client.create_user(
                email=spec.email,
                password=password,
                display_name=spec.display_name,
                email_verified=True,
                disabled=False,
            )
            auth_created = True

        uid = getattr(fb_user, "uid", None)
        if not uid:
            summary["skipped"].append({"email": spec.email, "reason": "Missing Firebase UID"})
            continue

        # 2. Check existing Firestore users/{uid} document
        existing_doc = await user_repo.get_by_id(uid)
        if existing_doc is not None:
            existing_role = existing_doc.get("role")
            existing_dept = existing_doc.get("department_id") or None
            intended_dept = target_dept_id or None

            if existing_role != spec.role.value or existing_dept != intended_dept:
                summary["conflicting"].append(
                    {
                        "email": spec.email,
                        "uid": uid,
                        "reason": (
                            f"Conflict on users/{uid}: existing=(role={existing_role}, department_id={existing_dept}) "
                            f"vs intended=(role={spec.role.value}, department_id={intended_dept})"
                        ),
                    }
                )
                continue

            summary["already_existing"].append(
                {
                    "email": spec.email,
                    "uid": uid,
                    "role": spec.role.value,
                    "department_id": target_dept_id,
                }
            )
            continue

        if dry_run:
            summary["created"].append(
                {
                    "email": spec.email,
                    "uid": uid,
                    "role": spec.role.value,
                    "department_id": target_dept_id,
                    "note": "Firebase Auth user exists; would create Firestore users/{uid} doc",
                }
            )
            continue

        # Validate strictly against the backend User model before writing
        validated_user = User(
            id=uid,
            email=spec.email,
            display_name=spec.display_name,
            role=spec.role,
            department_id=target_dept_id,
            is_active=True,
        )
        await user_repo.create(uid, validated_user.model_dump())
        summary["created"].append(
            {
                "email": spec.email,
                "uid": uid,
                "role": spec.role.value,
                "department_id": target_dept_id,
                "auth_created": auth_created,
            }
        )

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Provision AQS Step 5 test accounts in Firebase Auth and Firestore."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview provisioning actions without writing to Firebase Auth or Firestore.",
    )
    parser.add_argument(
        "--confirm-create-test-users",
        action="store_true",
        help="Explicit confirmation flag required to create missing test users.",
    )
    parser.add_argument(
        "--expected-project-id",
        default=EXPECTED_FIREBASE_PROJECT_ID,
        help=f"Expected Firebase project ID (default: {EXPECTED_FIREBASE_PROJECT_ID}).",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.confirm_create_test_users:
        print(
            "ERROR: Refusing to modify Firebase without --confirm-create-test-users (or pass --dry-run).",
            file=sys.stderr,
        )
        return 2

    if not firebase_manager.initialize():
        print(f"ERROR: {firebase_manager.status_message}", file=sys.stderr)
        return 1

    password = os.environ.get("AQS_TEST_USER_PASSWORD")
    summary = asyncio.run(
        provision_test_users(
            expected_project_id=args.expected_project_id,
            actual_project_id=firebase_manager.project_id,
            dry_run=args.dry_run,
            confirm_create=args.confirm_create_test_users,
            password=password,
        )
    )

    print("=== AQS Test User Provisioning Summary ===")
    print(f"Project ID       : {summary['project_id']}")
    print(f"Dry Run          : {summary['dry_run']}")
    print(f"Created          : {len(summary['created'])}")
    print(f"Already Existing : {len(summary['already_existing'])}")
    print(f"Skipped          : {len(summary['skipped'])}")
    print(f"Conflicting      : {len(summary['conflicting'])}")
    for item in summary["created"]:
        print(f"  [CREATED]  {item['email']} ({item['role']}, dept={item['department_id']})")
    for item in summary["already_existing"]:
        print(f"  [EXISTING] {item['email']} ({item['role']}, dept={item['department_id']})")
    for item in summary["skipped"]:
        print(f"  [SKIPPED]  {item['email']} - {item['reason']}")
    for item in summary["conflicting"]:
        print(f"  [CONFLICT] {item['email']} - {item['reason']}")

    return 1 if summary["conflicting"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
