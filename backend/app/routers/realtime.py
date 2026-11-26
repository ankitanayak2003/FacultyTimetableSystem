"""
Real-Time Event Stream Router for AQS.
Streams live database mutation notifications to connected clients via SSE.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Header, HTTPException, status
from fastapi.responses import StreamingResponse
from app.core.realtime import realtime_broadcaster
from app.core.dependencies import (
    get_optional_user_context,
    get_current_user_context,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/realtime", tags=["Realtime"])


@router.get("/stream")
async def realtime_event_stream(
    token: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """
    Subscribes to live Server-Sent Events (SSE).
    Accepts Bearer token in 'Authorization' header or '?token=' query parameter
    to support standard browser EventSource connections.
    """
    auth_header = authorization
    if not auth_header and token:
        auth_header = f"Bearer {token}"

    auth_ctx: AuthContext = await get_optional_user_context(auth_header)
    if not auth_ctx.is_authenticated and not auth_header:
        # Require authentication to subscribe to live institutional event stream
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to connect to real-time event stream.",
        )

    return StreamingResponse(
        realtime_broadcaster.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/broadcast-test")
async def broadcast_test_event(
    event_type: str = "TEST_EVENT",
    entity_id: str = "test_01",
    auth_ctx: AuthContext = Depends(get_current_user_context),
):
    """Fires a test event to all active real-time subscribers."""
    realtime_broadcaster.broadcast(event_type, entity_id, {"triggered_by": auth_ctx.email})
    return {"status": "broadcast_sent", "event": event_type, "entity_id": entity_id}
