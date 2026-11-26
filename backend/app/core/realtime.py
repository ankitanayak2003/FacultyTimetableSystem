"""
Real-time Server-Sent Events (SSE) broadcasting system for AQS.
Distributes entity mutation events (faculty updates, allotment changes,
preference finalizations, timetable generation) to all authenticated clients.
"""

import asyncio
import json
import logging
from typing import Set, Dict, Any, AsyncGenerator
from datetime import datetime, timezone

logger = logging.getLogger("aqs.realtime")


class RealtimeBroadcaster:
    """Manages active SSE subscriber queues and event broadcasting."""

    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    @property
    def active_connections_count(self) -> int:
        return len(self._subscribers)

    def register_listener(self) -> asyncio.Queue:
        """Registers a queue listener for SSE stream or internal monitoring."""
        q = asyncio.Queue()
        self._subscribers.add(q)
        return q

    def unregister_listener(self, q: asyncio.Queue):
        """Unregisters a previously registered queue."""
        self._subscribers.discard(q)

    def broadcast(self, event_type: str, entity_id: str, data: Dict[str, Any] = None):
        """Dispatches an event payload to all currently connected subscriber queues."""
        payload = {
            "event": event_type,
            "entity_id": entity_id,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except Exception as e:
                logger.debug("Failed to deliver message to subscriber queue: %s", str(e))

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """Subscribes to real-time events yielding text/event-stream formatted messages."""
        q = asyncio.Queue()
        self._subscribers.add(q)
        try:
            # Send initial connected event
            init_msg = json.dumps({
                "event": "CONNECTED",
                "message": "Connected to AQS Real-time Synchronization Stream",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            yield f"data: {init_msg}\n\n"

            while True:
                try:
                    # Wait for message with periodic keep-alive
                    payload = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment
                    yield ": ping\n\n"
        finally:
            self._subscribers.discard(q)


realtime_broadcaster = RealtimeBroadcaster()
