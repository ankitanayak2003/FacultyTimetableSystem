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

endpoints = [
    ("departments", "http://127.0.0.1:8000/api/v1/departments"),
    ("faculty", "http://127.0.0.1:8000/api/v1/faculty"),
    ("subjects", "http://127.0.0.1:8000/api/v1/subjects"),
    ("labs", "http://127.0.0.1:8000/api/v1/labs"),
    ("rooms", "http://127.0.0.1:8000/api/v1/rooms"),
    ("fixedClassrooms", "http://127.0.0.1:8000/api/v1/fixed-classrooms"),
    ("sections", "http://127.0.0.1:8000/api/v1/sections"),
    ("allotments", "http://127.0.0.1:8000/api/v1/allotments"),
    ("facultyPreferences", "http://127.0.0.1:8000/api/v1/preferences"),
    ("workloadRecords", "http://127.0.0.1:8000/api/v1/workload-records"),
    ("timetables", "http://127.0.0.1:8000/api/v1/timetables"),
    ("timetableSlots", "http://127.0.0.1:8000/api/v1/timetable-slots"),
]

headers = {"Authorization": "Bearer dev-token-admin"}

try:
    for name, url in endpoints:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            cnt = len(data) if isinstance(data, list) else len(data.get("items", []))
            print(f"LIVE SERVER {name}: HTTP {resp.status} - {cnt} items returned")
finally:
    backend_proc.terminate()
    print("Terminated backend process.")
