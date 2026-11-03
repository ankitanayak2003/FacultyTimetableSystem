"""
Faculty Workload & Timetable Management System
FastAPI Application Entry Point.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.firebase import firebase_manager
from app.core.exceptions import (
    EntityNotFoundError,
    DuplicateEntityError,
    RelationshipValidationError,
    AuthorizationError,
    DatabaseNotReadyError,
)
from app.routers import (
    health,
    system,
    users,
    faculty,
    subjects,
    rooms,
    labs,
    allotments,
    timetables,
    timetable_slots,
    workload_records,
)

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("faculty_timetable.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: attempts Firebase initialization on startup without crashing."""
    logger.info("Initializing %s v%s...", settings.APP_NAME, settings.APP_VERSION)
    
    # Initialize Firebase safely
    fb_ok = firebase_manager.initialize()
    if fb_ok:
        logger.info("Firebase Cloud Firestore initialized successfully.")
    else:
        logger.warning(
            "Firebase is unconfigured. The server is running, but database features require configuration in backend/.env"
        )
    
    yield
    
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-ready academic scheduling and faculty workload distribution API "
        "for Visvesvaraya Technological University (VTU) affiliated engineering colleges."
    ),
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# Centralized Domain Exception Handlers (Clean HTTP responses, no leaked traces)
# =====================================================================

@app.exception_handler(EntityNotFoundError)
async def entity_not_found_handler(request: Request, exc: EntityNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "entity_name": exc.entity_name, "entity_id": exc.entity_id},
    )


@app.exception_handler(DuplicateEntityError)
async def duplicate_entity_handler(request: Request, exc: DuplicateEntityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc), "entity_name": exc.entity_name, "entity_id": exc.entity_id},
    )


@app.exception_handler(RelationshipValidationError)
async def relationship_validation_handler(request: Request, exc: RelationshipValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc), "error_type": "relationship_validation_failed"},
    )


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)},
    )


@app.exception_handler(DatabaseNotReadyError)
async def database_not_ready_handler(request: Request, exc: DatabaseNotReadyError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc), "error_type": "database_unconfigured"},
    )


# =====================================================================
# Routers Registration
# =====================================================================

# Health & System info
app.include_router(health.router)
app.include_router(system.router)

# 9 Firestore Collections
app.include_router(users.router)
app.include_router(faculty.router)
app.include_router(subjects.router)
app.include_router(rooms.router)
app.include_router(labs.router)
app.include_router(allotments.router)
app.include_router(timetables.router)
app.include_router(timetable_slots.router)
app.include_router(workload_records.router)


@app.get("/", summary="Root Index", tags=["General"])
async def root_endpoint():
    """Welcome endpoint providing service identity and quick links."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "documentation": "/docs",
        "health_check": "/health",
        "system_info": "/api/v1/system/info",
        "firebase_configured": firebase_manager.is_initialized,
        "collections": [
            "users",
            "faculty",
            "subjects",
            "rooms",
            "labs",
            "allotments",
            "timetables",
            "timetableSlots",
            "workloadRecords",
        ],
    }
