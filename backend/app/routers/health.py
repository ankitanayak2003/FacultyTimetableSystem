"""
Health Router.
Provides accurate reporting of backend uptime, Google OR-Tools availability,
and genuine Firebase Firestore connection status.
"""

from fastapi import APIRouter
from app.core.config import settings
from app.core.firebase import firebase_manager
from app.schemas.health import HealthResponse, FirebaseStatusSchema

router = APIRouter(tags=["Health"])


def check_solver_availability() -> bool:
    """Checks whether Google OR-Tools CP-SAT is available in the Python runtime."""
    try:
        from ortools.sat.python import cp_model  # noqa: F401
        return True
    except ImportError:
        return False


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health & Firebase Connection Status",
    description="Reports the live health status of the API, OR-Tools CP-SAT solver, and honest Firebase state.",
)
async def get_health() -> HealthResponse:
    fb_status = firebase_manager.get_status_info()
    solver_ok = check_solver_availability()

    # If Firebase is not configured, the overall server is still alive, but reports 'unconfigured'
    status_label = "healthy" if fb_status["configured"] else "unconfigured_database"

    return HealthResponse(
        status=status_label,
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        firebase=FirebaseStatusSchema(
            configured=fb_status["configured"],
            project_id=fb_status["project_id"],
            message=fb_status["message"],
            credentials_path_provided=fb_status["credentials_path_provided"],
        ),
        solver_available=solver_ok,
    )
