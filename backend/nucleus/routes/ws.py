"""WebSocket endpoint that streams orchestrator progress to the UI.

Events are received from two sources:
  * The in-process bus (for events emitted in the API process itself).
  * Redis pubsub on ``nucleus:job:{job_id}`` (for events emitted from
    a Celery worker in a separate process).

The Redis path is a no-op if ``NUCLEUS_NO_REDIS=1`` or redis is unreachable.
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from nucleus.events import channel_for, get_redis_client, subscribe

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


async def _pump_redis(job_id: str, queue: asyncio.Queue[dict]) -> None:
    """Forward Redis pubsub messages for a job onto the local queue."""
    client = await get_redis_client()
    if client is None:
        return
    pubsub = client.pubsub()
    try:
        await pubsub.subscribe(channel_for(job_id))
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if isinstance(data, bytes):
                data = data.decode()
            try:
                queue.put_nowait(json.loads(data))
            except (TypeError, ValueError):
                logger.debug("malformed redis pubsub payload: %r", data)
    except asyncio.CancelledError:
        pass
    finally:
        try:
            await pubsub.unsubscribe(channel_for(job_id))
            await pubsub.close()
        except Exception:  # noqa: BLE001
            pass


@router.websocket("/ws/job/{job_id}")
async def ws_job_progress(ws: WebSocket, job_id: str) -> None:
    await ws.accept()
    queue: asyncio.Queue[dict] = asyncio.Queue()
    unsubscribe = subscribe(job_id, lambda event: queue.put_nowait(event))
    redis_task = asyncio.create_task(_pump_redis(job_id, queue))

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
        redis_task.cancel()
        try:
            await redis_task
        except (asyncio.CancelledError, Exception):  # noqa: BLE001
            pass
        try:
            await ws.close()
        except Exception:  # noqa: BLE001
            pass
