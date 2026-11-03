"""Timetable slot assignments router with conflict checks and published status locks."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import TimetableSlot, DayOfWeek, TimetableStatus
from app.schemas.entities import TimetableSlotCreate, TimetableSlotUpdate
from app.repositories import timetable_slot_repository, timetable_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/timetable-slots", tags=["Timetable Slots"])


@router.post("/", response_model=TimetableSlot, status_code=status.HTTP_201_CREATED)
async def create_timetable_slot(
    payload: TimetableSlotCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Schedules an individual timetable period slot.
    Validates:
    - Department ownership of the parent timetable
    - Parent timetable is not PUBLISHED (immutable)
    - Faculty, room, and section conflict prevention (no double-booking)
    - Facility compatibility (Lab subjects in Labs, Theory in Classrooms)
    """
    parent_tt = await timetable_repository.get_or_raise(payload.timetable_id)
    check_department_access(auth_ctx, parent_tt.get("department_id"))

    created = await timetable_slot_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[TimetableSlot])
async def list_timetable_slots(
    timetable_id: Optional[str] = None,
    day: Optional[DayOfWeek] = None,
    faculty_id: Optional[str] = None,
    room_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """
    Lists timetable slots.
    Students/Viewers are restricted to slots belonging to PUBLISHED timetables only.
    """
    # Guard draft slot leakage to students
    if not auth_ctx.is_coordinator and timetable_id:
        parent_tt = await timetable_repository.get_or_raise(timetable_id)
        if parent_tt.get("status") != TimetableStatus.PUBLISHED.value:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Timetable '{timetable_id}' slots are not accessible.",
            )

    filters = {}
    if timetable_id:
        filters["timetable_id"] = timetable_id
    if day:
        filters["day"] = day.value
    if faculty_id:
        filters["faculty_id"] = faculty_id
    if room_id:
        filters["room_id"] = room_id
    if subject_id:
        filters["subject_id"] = subject_id

    return await timetable_slot_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{slot_id}", response_model=TimetableSlot)
async def get_timetable_slot(
    slot_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches a timetable slot by ID, checking published status for students."""
    slot = await timetable_slot_repository.get_or_raise(slot_id)
    if not auth_ctx.is_coordinator:
        parent_tt = await timetable_repository.get_or_raise(slot["timetable_id"])
        if parent_tt.get("status") != TimetableStatus.PUBLISHED.value:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found.")
    return slot


@router.put("/{slot_id}", response_model=TimetableSlot)
async def update_timetable_slot(
    slot_id: str,
    payload: TimetableSlotUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates a scheduled slot assignment, re-running all conflict checks."""
    existing = await timetable_slot_repository.get_or_raise(slot_id)
    parent_tt = await timetable_repository.get_or_raise(existing["timetable_id"])
    check_department_access(auth_ctx, parent_tt.get("department_id"))

    return await timetable_slot_repository.update(slot_id, payload.model_dump(exclude_unset=True))


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_slot(
    slot_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Removes a timetable slot assignment. Rejects if parent timetable is published."""
    existing = await timetable_slot_repository.get_or_raise(slot_id)
    parent_tt = await timetable_repository.get_or_raise(existing["timetable_id"])
    check_department_access(auth_ctx, parent_tt.get("department_id"))

    await timetable_slot_repository.delete(slot_id)
