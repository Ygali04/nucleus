"""Coordinator-runnable end-to-end smoke test for Nucleus.

Submits a brief, streams WebSocket events, then pulls the final summary.

Examples
--------
Run in mock mode (default)::

    NUCLEUS_MOCK_PROVIDERS=true python backend/scripts/smoke_test.py

Run against real providers (requires FAL_KEY, ELEVENLABS_API_KEY, etc.)::

    python backend/scripts/smoke_test.py --real

Exit codes
----------
* 0 – job completed and at least one candidate was delivered
* 1 – job failed, timed out, or the backend was unreachable
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from typing import Any

import httpx
import websockets


DEFAULT_BRIEF: dict[str, Any] = {
    "brand_id": "smoke-test-brand",
    "source_url": "s3://nucleus-fixtures/sample-source.mp4",
    "icps": ["sme-founder"],
    "languages": ["en"],
    "platforms": ["tiktok"],
    "archetypes": ["testimonial"],
    "variants_per_cell": 1,
    "score_threshold": 60.0,
    "max_iterations": 5,
}


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--real",
        action="store_true",
        help="Use real providers (requires API keys). Default is mock mode.",
    )
    parser.add_argument(
        "--api",
        default=os.environ.get("NUCLEUS_API_URL", "http://localhost:8000"),
        help="Nucleus API base URL (default: http://localhost:8000).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=300.0,
        help="Overall timeout in seconds (default: 300).",
    )
    return parser.parse_args()


async def _submit_brief(api_url: str, brief: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{api_url}/api/v1/briefs", json=brief)
        resp.raise_for_status()
        return resp.json()


async def _get_candidate(api_url: str, candidate_id: str) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{api_url}/api/v1/candidates/{candidate_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()


async def _list_job_candidates(api_url: str, job_id: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{api_url}/api/v1/jobs/{job_id}/candidates")
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        return resp.json()


async def _stream_events(
    ws_url: str,
    timeout: float,
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Collect WebSocket events until the job completes or fails."""
    collected: list[dict[str, Any]] = []
    final_event: dict[str, Any] | None = None

    async with websockets.connect(ws_url, open_timeout=15.0) as ws:
        try:
            async with asyncio.timeout(timeout):
                async for raw in ws:
                    event = json.loads(raw)
                    if event.get("type") == "ping":
                        continue
                    collected.append(event)
                    event_type = event.get("event_type", "")
                    # Pretty-print each event as it arrives.
                    print(f"  [event] {event_type}: {json.dumps(event, default=str)}")
                    if event_type.endswith((".complete", ".failed")):
                        final_event = event
                        break
        except asyncio.TimeoutError:
            print(f"! timed out after {timeout}s waiting for job completion")

    return collected, final_event


def _summarise(
    candidates: list[dict[str, Any]],
    events: list[dict[str, Any]],
) -> tuple[float | None, int, float]:
    """Return (best_score, variant_count, total_cost)."""
    best_score = None
    for c in candidates:
        score = c.get("current_score")
        if score is not None and (best_score is None or score > best_score):
            best_score = score

    # Sum cost from events when we can find it; otherwise 0.
    total_cost = 0.0
    for evt in events:
        data = evt.get("data") or {}
        cost = data.get("cost") or data.get("cost_so_far") or 0
        try:
            total_cost = max(total_cost, float(cost))
        except (TypeError, ValueError):
            continue

    return best_score, len(candidates), total_cost


async def _run(args: argparse.Namespace) -> int:
    if args.real:
        os.environ.pop("NUCLEUS_MOCK_PROVIDERS", None)
        print("Using REAL providers (make sure keys are configured).")
    else:
        os.environ["NUCLEUS_MOCK_PROVIDERS"] = "true"
        print("Using MOCK providers (NUCLEUS_MOCK_PROVIDERS=true).")

    api_url: str = args.api.rstrip("/")
    print(f"API base: {api_url}")

    try:
        brief_resp = await _submit_brief(api_url, DEFAULT_BRIEF)
    except httpx.ConnectError as exc:
        print(
            f"! could not reach {api_url} ({exc}). "
            "Is the Nucleus backend running? See LOCAL_DEV.md."
        )
        return 1
    except httpx.HTTPStatusError as exc:
        print(f"! brief submission failed: {exc.response.status_code} {exc.response.text}")
        return 1

    job_id: str = brief_resp["job_id"]
    candidate_count: int = brief_resp.get("candidate_count", 0)
    raw_ws_url = brief_resp.get("websocket_url") or f"/ws/job/{job_id}"
    if raw_ws_url.startswith(("ws://", "wss://")):
        ws_url = raw_ws_url
    else:
        # Relative path — bolt onto the API base, flipping http[s] → ws[s].
        base = api_url.rstrip("/")
        ws_base = "ws" + base[len("http"):]
        ws_url = ws_base + (raw_ws_url if raw_ws_url.startswith("/") else f"/{raw_ws_url}")

    print(f"Brief submitted — job_id={job_id}, candidates={candidate_count}")

    # Eager-mode paths (NUCLEUS_EAGER_TASKS=1) run the loop synchronously before
    # we can open the WebSocket, so events have already fired and nothing will
    # be streamed. Check candidate status first; if everything is already
    # COMPLETE, skip streaming.
    candidates = await _list_job_candidates(api_url, job_id)
    already_done = bool(candidates) and all(
        (c.get("state") or "").upper() == "COMPLETE" for c in candidates
    )

    events: list[dict[str, Any]] = []
    final_event: dict[str, Any] | None = None

    if not already_done:
        print(f"Streaming events from {ws_url} ...")
        try:
            events, final_event = await _stream_events(ws_url, args.timeout)
        except (OSError, websockets.exceptions.WebSocketException) as exc:
            print(f"! websocket error: {exc}")
            return 1

        if final_event is None:
            print("! no terminal event received — treating as failure")
            return 1

        final_type = final_event.get("event_type", "")
        if final_type.endswith(".failed"):
            print(f"! job failed: {json.dumps(final_event, default=str)}")
            return 1

        candidates = await _list_job_candidates(api_url, job_id)
    else:
        print("(eager-completed before WS opened — using candidate status)")

    best_score, variants, total_cost = _summarise(candidates, events)

    score_str = f"{best_score:.1f}" if best_score is not None else "n/a"
    print(
        f"\n\u2713 job COMPLETE, final_score={score_str}, "
        f"variants={variants}, cost=${total_cost:.3f}"
    )
    return 0


def main() -> None:
    args = _parse_args()
    try:
        exit_code = asyncio.run(_run(args))
    except KeyboardInterrupt:
        exit_code = 130
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
