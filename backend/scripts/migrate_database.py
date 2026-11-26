"""
CLI Utility for AQS Safe Database Cleanup and Migration.

Usage:
    # 1. Export backup only:
    python backend/scripts/migrate_database.py --backup-only

    # 2. Dry run preview (safe, no changes):
    python backend/scripts/migrate_database.py --dry-run

    # 3. Apply migration (with backup and user confirmation):
    python backend/scripts/migrate_database.py --apply
"""

import sys
import os
import asyncio
import argparse
import json

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.services.migration import database_migration_manager


async def main():
    parser = argparse.ArgumentParser(description="AQS Database Migration and Backup Tool")
    parser.add_argument("--backup-only", action="store_true", help="Exports current Firestore data to JSON backup and exits.")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Performs pre-flight inspection and outputs diff without modifying data.")
    parser.add_argument("--apply", action="store_true", help="Executes live cleanup and import after confirmation.")
    parser.add_argument("--yes", "-y", action="store_true", help="Bypasses interactive prompt when --apply is passed.")

    args = parser.parse_args()

    print("=" * 70)
    print("AQS Firestore Migration & Backup Utility")
    print(f"Target Firebase Project ID: {settings.FIREBASE_PROJECT_ID}")
    print("=" * 70)

    if args.backup_only:
        print("\n[+] Creating Firestore backup...")
        backup_path = await database_migration_manager.export_backup()
        print(f"[✓] Backup exported successfully to: {backup_path}")
        return

    if args.apply:
        print("\n[!] WARNING: This will clean up dummy records and import real Excel data into Firestore.")
        if not args.yes:
            confirm = input("Type 'CONFIRM' to proceed with migration: ").strip()
            if confirm != "CONFIRM":
                print("[-] Migration cancelled by user.")
                return

        print("\n[+] Executing migration (backup will be created automatically)...")
        result = await database_migration_manager.execute_migration(confirmed=True)
        print("\n[✓] Migration Completed Successfully!")
        print(json.dumps(result, indent=2))
        return

    # Default: Dry-Run Mode
    print("\n[+] Running pre-flight dry-run inspection...")
    plan = await database_migration_manager.plan_migration()
    print("\n--- Migration Plan Summary ---")
    print(f"Project ID: {plan['firebase_project_id']}")
    print(f"Current Documents Count: {plan['current_database_counts']}")
    print(f"Dummy Records Flagged for Deletion: {plan['total_dummy_records']}")
    for col, ids in plan["dummy_records_flagged_for_removal"].items():
        if ids:
            print(f"  - {col}: {len(ids)} dummy records {ids[:5]}")
    print(f"Excel Records to Import:")
    for k, v in plan["excel_import_preview"].items():
        print(f"  - {k}: {v}")
    print(f"Provisional Fixed Classrooms to Create: {len(plan['provisional_fixed_classrooms_to_create'])}")
    print(f"Status: {plan['status']}")
    print(f"Instruction: {plan['approval_instruction']}")
    print("-" * 70)


if __name__ == "__main__":
    asyncio.run(main())
