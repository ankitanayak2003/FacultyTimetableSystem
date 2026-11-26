"""
System Management and Institutional Data Ingestion Router.
Provides metadata, system capabilities, and Excel data import services.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from app.core.config import settings
from app.core.dependencies import require_coordinator_or_admin, AuthContext
from app.schemas.entities import ExcelImportRequest, ImportSummaryReport
from app.services.excel_importer import excel_importer

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
            "excel_data_importer": True,
            "lab_batch_management": True,
            "gemini_assistant_enabled": bool(settings.GEMINI_API_KEY),
        },
        "supported_roles": [
            "Dean",
            "Principal",
            "Admin / Chief Coordinator",
            "HOD",
            "Department Coordinator",
            "Basic Science Coordinator",
            "Faculty",
        ],
        "supported_departments": [
            "Artificial Intelligence & Data Science (AIDS)",
            "Artificial Intelligence & Machine Learning (AIML)",
            "Computer Science & Engineering (CSE)",
            "Electronics & Communication Engineering (ECE)",
            "Mechanical Engineering (ME)",
            "Civil Engineering (CV)",
            "Basic Science (Physics, Chemistry, Mathematics)",
        ],
    }


@router.get(
    "/excel-inspect",
    summary="Inspect Excel Data Files",
    description="Checks the availability and sizes of faculty.xlsx, rooms_lab.xlsx, and subjects.xlsx.",
)
async def inspect_excel_files(
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
) -> Dict[str, Any]:
    return excel_importer.inspect_files()


@router.post(
    "/import-excel",
    response_model=ImportSummaryReport,
    summary="Import Real Data from 3 Excel Files",
    description=(
        "Parses faculty.xlsx, rooms_lab.xlsx, and subjects.xlsx into Firestore records. "
        "Supports dry_run=True for validation before writing. Avoids duplicates with stable IDs."
    ),
)
async def import_excel_data(
    payload: ExcelImportRequest,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
) -> ImportSummaryReport:
    report = await excel_importer.execute_import(
        dry_run=payload.dry_run,
        overwrite=payload.overwrite_existing,
    )
    return report
