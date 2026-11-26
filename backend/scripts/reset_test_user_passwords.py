"""
Reset Firebase Authentication Password for 12 AQS Test Accounts.
Target project: mini-project-24d7b
New password: 123456
"""

import sys
import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from firebase_admin import auth as fb_auth
from app.core.firebase import firebase_manager

EXPECTED_PROJECT_ID = "mini-project-24d7b"
NEW_PASSWORD = "123456"

TARGET_EMAILS = [
    "dean@aqs.test",
    "ds.coord@aqs.test",
    "ml.coord@aqs.test",
    "cse.coord@aqs.test",
    "ec.coord@aqs.test",
    "mech.coord@aqs.test",
    "civil.coord@aqs.test",
    "bs.coord@aqs.test",
    "ds.hod@aqs.test",
    "cse.hod@aqs.test",
    "ds.faculty@aqs.test",
    "cse.faculty@aqs.test",
]


def reset_passwords():
    print("=== AQS Test Account Password Reset ===")

    # 1. Initialize Firebase Admin
    if not firebase_manager.initialize():
        print(f"ERROR: Firebase initialization failed: {firebase_manager.status_message}", file=sys.stderr)
        return 1

    actual_project_id = firebase_manager.project_id
    print(f"Target Firebase Project ID: {actual_project_id}")

    # 2. Strict Project ID check
    if actual_project_id != EXPECTED_PROJECT_ID:
        print(
            f"ERROR: Project ID mismatch! Expected '{EXPECTED_PROJECT_ID}', got '{actual_project_id}'. Aborting.",
            file=sys.stderr,
        )
        return 1

    successful_resets = []
    missing_accounts = []
    failed_resets = []

    for email in TARGET_EMAILS:
        # Find user by exact email
        try:
            user_record = fb_auth.get_user_by_email(email)
        except fb_auth.UserNotFoundError:
            print(f"[-] MISSING: {email} (not found in Firebase Auth)")
            missing_accounts.append(email)
            continue
        except Exception as exc:
            print(f"[!] LOOKUP ERROR for {email}: {exc}")
            failed_resets.append((email, str(exc)))
            continue

        uid = user_record.uid
        try:
            # Update password only - do not alter other fields
            fb_auth.update_user(uid, password=NEW_PASSWORD)
            print(f"[+] RESET SUCCESS: {email} (UID: {uid})")
            successful_resets.append(email)
        except Exception as exc:
            print(f"[!] UPDATE ERROR for {email} (UID: {uid}): {exc}")
            failed_resets.append((email, str(exc)))

    print("\n================== SUMMARY ==================")
    print(f"Total target accounts : {len(TARGET_EMAILS)}")
    print(f"Successfully reset    : {len(successful_resets)}")
    print(f"Missing accounts      : {len(missing_accounts)}")
    print(f"Failed accounts       : {len(failed_resets)}")

    if successful_resets:
        print("\nSuccessfully reset emails:")
        for e in successful_resets:
            print(f"  - {e}")

    if missing_accounts:
        print("\nMissing accounts:")
        for e in missing_accounts:
            print(f"  - {e}")

    if failed_resets:
        print("\nFailed accounts:")
        for e, err in failed_resets:
            print(f"  - {e}: {err}")

    return 0 if not failed_resets else 1


if __name__ == "__main__":
    sys.exit(reset_passwords())
