import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.firebase import firebase_manager

firebase_manager.initialize()
db = firebase_manager.get_db()

depts = ["dept_aids", "dept_math", "dept_physics", "dept_chemistry"]
for d in depts:
    print(f"\n--- FACULTY IN {d} ---")
    for doc in db.collection("faculty").where("department_id", "==", d).stream():
        data = doc.to_dict()
        print(f"ID: {doc.id} | Name: {data.get('name')} | Designation: {data.get('designation')}")
