"""compose_remotion tool — renders a Remotion composition via HTTP and
uploads the result to object storage.

Flow in real mode:
    1. POST the SceneManifest to ``{REMOTION_API_URL}/render``.
    2. The Remotion server returns a local file path to the rendered mp4.
    3. Upload that file into the Nucleus object store under
       ``s3://{S3_BUCKET}/jobs/{job_id}/composed/{filename}.mp4``.
    4. Return the s3:// URI.

In mock mode (``NUCLEUS_MOCK_PROVIDERS=true``) we return a fixture URL and
do not touch the Remotion server or storage.
"""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import httpx

from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import ComposeRemotionRequest, ComposeRemotionResponse

# Archetype -> Remotion compositionId. Matches the registrations in
# remotion/src/Root.tsx.
ARCHETYPE_TO_COMPOSITION_ID: dict[str, str] = {
    "demo": "DemoArchetype",
    "marketing": "MarketingArchetype",
    "knowledge": "KnowledgeArchetype",
    "education": "EducationArchetype",
}

# Remotion renders can be slow (1-5 min). Give the HTTP call a generous
# timeout so we don't bail before the server responds.
_RENDER_TIMEOUT_S = 600.0


def _composition_id_for(archetype: str) -> str:
    return ARCHETYPE_TO_COMPOSITION_ID.get(archetype, "DemoArchetype")


def _remotion_api_url() -> str:
    return os.environ.get("REMOTION_API_URL", "http://localhost:3101").rstrip("/")


def _s3_bucket() -> str:
    return os.environ.get("S3_BUCKET", "nucleus-media")


async def _upload_to_storage(local_path: str, job_id: str, filename: str) -> str:
    """Upload the rendered file to object storage and return the s3:// URI.

    TODO: replace with ``nucleus.storage`` once WU-C lands. Until then we
    write the mp4 into ``/tmp/nucleus/{filename}`` so subsequent tools can
    still read it, and return a placeholder s3:// URI that matches the
    final contract.
    """
    try:
        from nucleus.storage import upload_file  # type: ignore[import-not-found]
    except ImportError:
        upload_file = None  # type: ignore[assignment]

    key = f"jobs/{job_id}/composed/{filename}"

    if upload_file is not None:
        return await upload_file(local_path, key)  # type: ignore[no-any-return]

    # Fallback: stage the file locally so the rest of the pipeline can still
    # read it, and return the canonical s3:// URI we would have uploaded to.
    staging = Path("/tmp/nucleus") / job_id / "composed"
    staging.mkdir(parents=True, exist_ok=True)
    dest = staging / filename
    src = Path(local_path)
    if src.exists() and src.resolve() != dest.resolve():
        dest.write_bytes(src.read_bytes())
    return f"s3://{_s3_bucket()}/{key}"


async def _post_render(
    *,
    composition_id: str,
    props: dict,
    output_path: str,
    client: httpx.AsyncClient | None = None,
) -> dict:
    """POST to the Remotion render API and return the parsed JSON body."""
    payload = {
        "compositionId": composition_id,
        "props": props,
        "outputPath": output_path,
    }
    url = f"{_remotion_api_url()}/render"

    if client is None:
        async with httpx.AsyncClient(timeout=_RENDER_TIMEOUT_S) as c:
            resp = await c.post(url, json=payload)
    else:
        resp = await client.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()


async def compose_remotion(
    req: ComposeRemotionRequest,
    *,
    http_client: httpx.AsyncClient | None = None,
    job_id: str | None = None,
) -> ComposeRemotionResponse:
    manifest = req.scene_manifest or {}
    total_frames = sum(
        scene.get("durationInFrames", 0) for scene in manifest.get("scenes", [])
    )
    duration_s = total_frames / 30.0 if total_frames else 0.0

    if is_mock():
        return ComposeRemotionResponse(
            video_url=mock_video_url("remotion"),
            cost_usd=0.0,
            duration_s=duration_s,
        )

    archetype = str(manifest.get("archetype", "demo"))
    composition_id = _composition_id_for(archetype)
    effective_job_id = job_id or req.template_id or uuid4().hex[:12]
    filename = f"{composition_id}-{uuid4().hex[:8]}.mp4"
    # The Remotion server resolves relative paths against its cwd. We stage
    # the render under /tmp/nucleus/renders so both the container and host
    # fallback can find it deterministically.
    render_dir = Path("/tmp/nucleus/renders")
    render_dir.mkdir(parents=True, exist_ok=True)
    local_output = str(render_dir / filename)

    # Remotion 4 can fetch remote URLs directly (<Video src="https://..."/>),
    # so we pass SceneManifest URLs through untouched.
    body = await _post_render(
        composition_id=composition_id,
        props=manifest,
        output_path=local_output,
        client=http_client,
    )

    if not body.get("success"):
        raise RuntimeError(f"Remotion render failed: {body.get('error')}")

    produced = body.get("outputPath", local_output)
    video_url = await _upload_to_storage(
        local_path=produced, job_id=effective_job_id, filename=filename
    )

    return ComposeRemotionResponse(
        video_url=video_url,
        cost_usd=0.001,  # Remotion render cost is near-zero
        duration_s=duration_s,
    )
