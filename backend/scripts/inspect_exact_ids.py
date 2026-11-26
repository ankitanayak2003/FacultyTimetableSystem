import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.firebase import firebase_manager

firebase_manager.initialize()
db = firebase_manager.get_db()

print("--- MATCHING FACULTY IDS ---")
for doc in db.collection("faculty").stream():
    d = doc.to_dict()
    name = d.get("name", "")
    if any(k in name.lower() for k in ["ananya", "rajesh", "sneha", "ravindra", "subrahmanya", "tejaswini", "sudarshan"]):
        print(f"ID: {doc.id} | Name: {name} | Dept: {d.get('department_id')}")

print("\n--- MATCHING SUBJECT IDS ---")
for doc in db.collection("subjects").stream():
    d = doc.to_dict()
    code = d.get("code", "")
    name = d.get("course_name", "")
    if any(k in code.upper() for k in ["25CS", "25MA", "25PH", "25CH", "25AD"]) or any(k in name.lower() for k in ["physics", "chemistry", "mathematics", "structures", "java"]):
        print(f"ID: {doc.id} | Code: {code} | Title: {name}")
