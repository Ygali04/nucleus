"""generate_storyboard tool — produces N storyboard frames for a prompt.

Expands a single brief into ``frame_count`` shot descriptions and fans out
to the SiliconFlow / FLUX.1-Kontext-dev provider. When
``NUCLEUS_MOCK_PROVIDERS=true`` the provider short-circuits to fixture URLs.
"""

from __future__ import annotations

from nucleus.providers._image_protocol import ImageProvider
from nucleus.providers.siliconflow_image import SiliconFlowImageProvider
from nucleus.tools.schemas import (
    GenerateStoryboardRequest,
    GenerateStoryboardResponse,
)

_SHOT_TEMPLATES = [
    "Shot {n}: opening establishing frame — {prompt}",
    "Shot {n}: midpoint action beat — {prompt}",
    "Shot {n}: emotional close-up — {prompt}",
    "Shot {n}: resolution / hero moment — {prompt}",
]


def _aspect_to_dims(aspect_ratio: str) -> tuple[int, int]:
    """Map aspect ratio label to (width, height) at ~1024 long edge."""
    presets = {
        "16:9": (1024, 576),
        "9:16": (576, 1024),
        "1:1": (1024, 1024),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
    }
    return presets.get(aspect_ratio, (1024, 576))


def expand_shots(prompt: str, frame_count: int, style_hints: str | None = None) -> list[str]:
    """Template the brief into ``frame_count`` shot descriptions."""
    hint_suffix = f" | style: {style_hints}" if style_hints else ""
    shots: list[str] = []
    for i in range(frame_count):
        template = _SHOT_TEMPLATES[i % len(_SHOT_TEMPLATES)]
        shots.append(template.format(n=i + 1, prompt=prompt) + hint_suffix)
    return shots


async def generate_storyboard(
    req: GenerateStoryboardRequest,
    *,
    provider: ImageProvider | None = None,
) -> GenerateStoryboardResponse:
    """Generate ``frame_count`` storyboard frames."""
    image_provider: ImageProvider = provider or SiliconFlowImageProvider()
    width, height = _aspect_to_dims(req.aspect_ratio)
    shots = expand_shots(req.prompt, req.frame_count, req.style_hints)

    # Provider already returns hosted URLs; skip MinIO re-upload here so the
    # tool works without storage infra in tests/local dev.
    results = [
        await image_provider.text_to_image(shot, width=width, height=height)
        for shot in shots
    ]
    return GenerateStoryboardResponse(
        image_urls=[r.image_url for r in results],
        cost_usd=round(sum(r.cost_usd for r in results), 6),
        provider=results[0].provider if results else image_provider.name,
    )
