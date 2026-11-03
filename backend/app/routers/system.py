"""
System Info Router.
Provides metadata about the VTU College Timetable engine capabilities.
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/v1/system", tags=["System"])


@router.get(
    "/info",
    summary="Get System and Scheduling Capabilities",
    description="Returns supported VTU schemes, constraint types, and solver capabilities.",
)
async def get_system_info():
    return {
        "institution_type": "VTU Affiliated Engineering College",
        "supported_schemes": ["2021 Scheme", "2022 Scheme", "2024 Scheme"],
        "features": {
            "cp_sat_scheduler": True,
            "faculty_workload_balancer": True,
            "lab_continuity_solver": True,
            "gemini_assistant_enabled": bool(settings.GEMINI_API_KEY),
        },
        "supported_roles": ["Admin / Chief Coordinator", "HOD", "Department Coordinator", "Faculty"],
        "supported_departments": [
            "Computer Science & Engineering (CSE)",
            "Information Science & Engineering (ISE)",
            "Electronics & Communication Engineering (ECE)",
            "Mechanical Engineering (ME)",
            "Civil Engineering (CV)",
            "Artificial Intelligence & Data Science (AI&DS)",
        ],
    }
