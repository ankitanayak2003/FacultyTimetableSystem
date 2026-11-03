"""Classrooms and lecture halls router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.entities import Room, RoomType
from app.schemas.entities import RoomCreate, RoomUpdate
from app.repositories import room_repository
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/rooms", tags=["Rooms"])


@router.post("/", response_model=Room, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Registers a classroom or seminar hall. Requires coordinator or admin role."""
    created = await room_repository.create(payload.id, payload.model_dump())
    return created


@router.get("/", response_model=List[Room])
async def list_rooms(
    room_type: Optional[RoomType] = None,
    department_id: Optional[str] = None,
    is_available: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists rooms with optional availability and type filters."""
    filters = {}
    if room_type:
        filters["room_type"] = room_type.value
    if department_id:
        filters["department_id"] = department_id
    if is_available is not None:
        filters["is_available"] = is_available
    return await room_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{room_id}", response_model=Room)
async def get_room(
    room_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches room details by ID."""
    return await room_repository.get_or_raise(room_id)


@router.put("/{room_id}", response_model=Room)
async def update_room(
    room_id: str,
    payload: RoomUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates room details."""
    return await room_repository.update(room_id, payload.model_dump(exclude_unset=True))


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a room, verifying no scheduled timetable slots are assigned."""
    await room_repository.delete(room_id)
