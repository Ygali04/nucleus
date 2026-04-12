"""WebSocket endpoint that streams orchestrator progress to the UI.

The in-process event bus (nucleus.events) publishes events as the recursive loop
executes; this endpoint forwards them to any subscribed client.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from nucleus.events import subscribe

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/job/{job_id}")
async def ws_job_progress(ws: WebSocket, job_id: str) -> None:
    await ws.accept()
    queue: asyncio.Queue[dict] = asyncio.Queue()
    unsubscribe = subscribe(job_id, lambda event: queue.put_nowait(event))

    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                # Keepalive ping
                await ws.send_text(json.dumps({"type": "ping"}))
                continue

            await ws.send_text(json.dumps(event))
            if event.get("event_type", "").endswith((".complete", ".failed")):
                break
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe()
        try:
            await ws.close()
        except Exception:
            pass
