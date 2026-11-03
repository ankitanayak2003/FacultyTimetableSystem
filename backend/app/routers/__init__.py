"""FastAPI routers export."""

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

__all__ = [
    "health",
    "system",
    "users",
    "faculty",
    "subjects",
    "rooms",
    "labs",
    "allotments",
    "timetables",
    "timetable_slots",
    "workload_records",
]
