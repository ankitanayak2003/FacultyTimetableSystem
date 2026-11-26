import subprocess
import time
import urllib.request
import json
import sys
import os

backend_proc = subprocess.Popen(
    [os.path.join(os.getcwd(), "backend", "venv", "Scripts", "python.exe"), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=os.path.join(os.getcwd(), "backend"),
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print(f"Started uvicorn (PID {backend_proc.pid}), waiting 3s...")
time.sleep(3)

headers = {
    "Authorization": "Bearer dev-token-admin",
    "Content-Type": "application/json"
}

pref_id = "pref_2026-2027_3_fac_aids_ananya"
original_comment = "Allocated Priority 1 based on specialization and teaching track record."
test_comment = "Allocated Priority 1 based on specialization and teaching track record. [Verified sync test]"

try:
    # 1. Update preference via FastAPI PUT endpoint
    update_url = f"http://127.0.0.1:8000/api/v1/preferences/{pref_id}/hod-review"
    payload = json.dumps({
        "status": "ACCEPTED",
        "hod_comments": test_comment
    }).encode("utf-8")

    req = urllib.request.Request(update_url, data=payload, headers=headers, method="PUT")
    with urllib.request.urlopen(req, timeout=10) as resp:
        res_data = json.loads(resp.read().decode())
        print(f"STEP 1: Updated via FastAPI: HTTP {resp.status}, status={res_data.get('status')}")

    # 2. Verify directly from Firestore via Firebase Admin SDK
    sys.path.insert(0, os.path.join(os.getcwd(), "backend"))
    from app.core.firebase import firebase_manager
    firebase_manager.initialize()
    db = firebase_manager._db

    doc = db.collection("facultyPreferences").document(pref_id).get()
    firestore_data = doc.to_dict()
    print(f"STEP 2: Direct Firestore read: hod_comments='{firestore_data.get('hod_comments')}'")
    assert firestore_data.get("hod_comments") == test_comment, "Firestore document did not match test comment!"

    # 3. Reload / Fetch from API endpoint to confirm persistence
    get_url = f"http://127.0.0.1:8000/api/v1/preferences?department_id=dept_aids"
    req_get = urllib.request.Request(get_url, headers=headers)
    with urllib.request.urlopen(req_get, timeout=10) as resp:
        all_prefs = json.loads(resp.read().decode())
        matched = next((p for p in all_prefs if p.get("id") == pref_id), None)
        print(f"STEP 3: Reload from API: found={bool(matched)}, hod_comments='{matched.get('hod_comments') if matched else None}'")
        assert matched and matched.get("hod_comments") == test_comment, "API reload did not reflect updated comment!"

    # 4. Revert back to original value (non-destructive)
    revert_payload = json.dumps({
        "status": "ACCEPTED",
        "hod_comments": original_comment
    }).encode("utf-8")
    req_rev = urllib.request.Request(update_url, data=revert_payload, headers=headers, method="PUT")
    with urllib.request.urlopen(req_rev, timeout=10) as resp:
        print(f"STEP 4: Cleanly reverted to original: HTTP {resp.status}")

    # Verify Firestore restored
    doc_after = db.collection("facultyPreferences").document(pref_id).get()
    print(f"STEP 5: Firestore confirmed restored to: '{doc_after.to_dict().get('hod_comments')}'")
    print("ALL CRUD PERSISTENCE TESTS PASSED CLEANLY!")

finally:
    backend_proc.terminate()
    print("Terminated backend process.")
