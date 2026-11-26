"""
Read-Only Live Firestore Inspector for AQS.
Connects to Firebase Project mini-project-24d7b and inspects all collections.
STRICTLY READ-ONLY: Performs NO writes, NO updates, NO deletions.
"""

import sys
import os
import json

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.firebase import firebase_manager
from app.services.migration import is_legacy_dummy_id


def inspect():
    print(f"[+] Initializing Firebase Admin SDK...")
    success = firebase_manager.initialize()
    if not success or not firebase_manager.is_initialized:
        print(f"[-] ERROR: Failed to initialize Firebase connection.")
        print(f"    Check service account key and credentials.")
        return

    db = firebase_manager.get_db()
    if not db:
        print(f"[-] ERROR: Firestore DB client is None.")
        return

    print(f"[✓] Connected successfully to Firestore Project: {db.project}")

    collections = list(db.collections())
    print(f"[+] Total live collections found: {len(collections)}")

    report = {
        "firestore_project_id": db.project,
        "collections_found": [c.id for c in collections],
        "collection_details": {},
        "dummy_records": {},
        "uncertain_records": {},
        "valid_real_records": {},
        "total_documents": 0,
    }

    # Standard expected collections
    expected_collections = [
        "users",
        "faculty",
        "subjects",
        "rooms",
        "labs",
        "allotments",
        "timetables",
        "timetableSlots",
        "workloadRecords",
        "facultyPreferences",
        "fixedClassrooms",
    ]

    all_collection_names = sorted(list(set([c.id for c in collections] + expected_collections)))

    for col_name in all_collection_names:
        col_ref = db.collection(col_name)
        try:
            docs = list(col_ref.stream())
        except Exception as e:
            print(f"[-] Could not query collection '{col_name}': {e}")
            docs = []

        doc_count = len(docs)
        report["total_documents"] += doc_count
        report["collection_details"][col_name] = {
            "document_count": doc_count,
            "document_ids": [d.id for d in docs],
        }

        dummy_list = []
        uncertain_list = []
        valid_list = []

        for d in docs:
            data = d.to_dict() or {}
            doc_id = d.id

            # Classify record
            if is_legacy_dummy_id(doc_id, data):
                dummy_list.append({
                    "id": doc_id,
                    "reason": "Matches legacy dummy pattern (test/mock/fac_10x/21AI32/sample)",
                    "preview": {k: data[k] for k in list(data.keys())[:3]},
                })
            elif doc_id.startswith("fac_") and not any(title in doc_id for title in ["prof", "dr", "mr", "mrs", "ms"]):
                # Numerical or short ID like fac_1 or fac_02
                dummy_list.append({
                    "id": doc_id,
                    "reason": "Legacy short faculty identifier format",
                    "preview": {k: data[k] for k in list(data.keys())[:3]},
                })
            else:
                # Check if it might be an actual record
                name = str(data.get("name") or data.get("course_name") or data.get("email") or "")
                if "test" in name.lower() or "demo" in name.lower():
                    dummy_list.append({
                        "id": doc_id,
                        "reason": f"Record name '{name}' indicates test/demo content",
                        "preview": {k: data[k] for k in list(data.keys())[:3]},
                    })
                elif len(data) < 2:
                    uncertain_list.append({
                        "id": doc_id,
                        "reason": "Minimal or incomplete document data (<2 fields)",
                        "preview": data,
                    })
                else:
                    valid_list.append({
                        "id": doc_id,
                        "preview": {k: data[k] for k in list(data.keys())[:3]},
                    })

        report["dummy_records"][col_name] = dummy_list
        report["uncertain_records"][col_name] = uncertain_list
        report["valid_real_records"][col_name] = valid_list

    print("\n--- READ-ONLY INSPECTION REPORT ---")
    print(json.dumps(report, indent=2))

    # Also save to inspect_output.json
    out_file = os.path.join(backend_dir, "backups", "live_firestore_inspection.json")
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[✓] Full report saved to: {out_file}")


if __name__ == "__main__":
    inspect()
