import os
import sys
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    endpoints = [
        ('/api/v1/departments', 'departments'),
        ('/api/v1/faculty', 'faculty'),
        ('/api/v1/subjects', 'subjects'),
        ('/api/v1/labs', 'labs'),
        ('/api/v1/rooms', 'rooms'),
        ('/api/v1/fixed-classrooms', 'fixedClassrooms'),
        ('/api/v1/sections', 'sections'),
        ('/api/v1/allotments', 'allotments'),
        ('/api/v1/workload-records', 'workloadRecords'),
        ('/api/v1/timetables', 'timetables'),
        ('/api/v1/timetable-slots', 'timetableSlots'),
        ('/api/v1/preferences', 'facultyPreferences'),
        ('/api/v1/timetables/department/dept_aids', 'timetables_dept_aids'),
        ('/api/v1/preferences/coordinator/finalized?department_id=dept_aids&academic_year=2026-2027&semester=3', 'preferences_finalized'),
    ]

    headers = {'Authorization': 'Bearer dev-token-admin'}

    results = {}

    for ep, name in endpoints:
        try:
            r = client.get(ep, headers=headers)
            if r.status_code == 200:
                data = r.json()
                cnt = len(data) if isinstance(data, list) else (len(data.get('items', [])) if isinstance(data, dict) else 1)
                sample_keys = list(data[0].keys()) if (cnt > 0 and isinstance(data, list) and isinstance(data[0], dict)) else []
                first_item = data[0] if (cnt > 0 and isinstance(data, list)) else data
                results[name] = {
                    'status': r.status_code,
                    'count': cnt,
                    'sample_keys': sample_keys,
                    'first_item': first_item
                }
                print(f"SUCCESS {name}: {cnt} items")
            else:
                results[name] = {'status': r.status_code, 'error': r.text}
                print(f"FAILED {name}: status {r.status_code} - {r.text[:100]}")
        except Exception as e:
            results[name] = {'exception': str(e)}
            print(f"EXCEPTION {name}: {e}")

with open(os.path.join(os.path.dirname(__file__), "..", "backups", "fastapi_inspection_results.json"), "w") as f:
    json.dump(results, f, indent=2, default=str)
print("Saved to backups/fastapi_inspection_results.json")
