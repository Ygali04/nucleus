"""generate_image tool — single-image generation via FLUX.1-Kontext-dev.

Supports four operations:

* ``text_to_image``     — prompt only, no reference
* ``upscale``           — reference image, same prompt, strength=0.3
* ``theme_transition``  — reference image, transition prompt, strength=0.6
* ``style_transfer``    — reference image, style prompt, strength=0.75

Operations that require a ``reference_image_url`` raise ``ValueError`` when
one isn't supplied.
"""

from __future__ import annotations

from nucleus.providers._image_protocol import ImageProvider
from nucleus.providers.siliconflow_image import SiliconFlowImageProvider
from nucleus.tools.schemas import GenerateImageRequest, GenerateImageResponse

# Operation → default i2i strength override (only used when the caller
# leaves ``strength`` at the 0.7 default).
_OPERATION_STRENGTH: dict[str, float] = {
    "upscale": 0.3,
    "theme_transition": 0.6,
    "style_transfer": 0.75,
}


_REFERENCE_REQUIRED = {"upscale", "theme_transition", "style_transfer"}


async def generate_image(
    req: GenerateImageRequest,
    *,
    provider: ImageProvider | None = None,
) -> GenerateImageResponse:
    """Run a single FLUX-Kontext image generation."""
    image_provider: ImageProvider = provider or SiliconFlowImageProvider()

    if req.operation == "text_to_image":
        result = await image_provider.text_to_image(req.prompt)
        return GenerateImageResponse(
            image_url=result.image_url,
            cost_usd=result.cost_usd,
            provider=result.provider,
        )

    if req.operation in _REFERENCE_REQUIRED:
        if not req.reference_image_url:
            raise ValueError(
                f"operation {req.operation!r} requires reference_image_url"
            )
        # Honor caller-provided strength, otherwise use the per-op default.
        strength = req.strength
        if strength == 0.7 and req.operation in _OPERATION_STRENGTH:
            strength = _OPERATION_STRENGTH[req.operation]
        result = await image_provider.image_to_image(
            req.prompt,
            reference_image_url=req.reference_image_url,
            strength=strength,
        )
        return GenerateImageResponse(
            image_url=result.image_url,
            cost_usd=result.cost_usd,
            provider=result.provider,
        )

    raise ValueError(f"Unknown operation: {req.operation!r}")
