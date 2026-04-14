"""Minimal ComfyUI client protocol.

WU-C1 owns the real ``ComfyUIClient`` implementation.  Until that merges we
expose an import-safe ``Protocol`` that the providers and tests can depend
on, plus a lazy ``default_client()`` helper that will use the real class
once it's available.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Protocol, runtime_checkable


@runtime_checkable
class ComfyUIClientProtocol(Protocol):
    """The subset of the ComfyUI client surface Nucleus providers need."""

    async def submit_workflow(self, workflow: dict) -> str: ...

    def stream_progress(self, prompt_id: str) -> AsyncIterator[dict]: ...

    async def get_history(self, prompt_id: str) -> dict: ...

    async def fetch_output(
        self,
        filename: str,
        subfolder: str = "",
        type_: str = "output",
    ) -> bytes: ...


def default_client() -> ComfyUIClientProtocol:
    """Lazy-import the real ``ComfyUIClient`` if WU-C1 has merged.

    Raises ``RuntimeError`` with a clear message otherwise so tests that
    forget to inject a stub fail loudly instead of mysteriously.
    """
    try:
        from nucleus.clients.comfyui import ComfyUIClient  # type: ignore[import-not-found]
    except ImportError as exc:  # pragma: no cover - exercised once WU-C1 lands
        raise RuntimeError(
            "ComfyUIClient not available yet (WU-C1 pending). "
            "Inject a stub client when constructing ComfyUI providers."
        ) from exc
    return ComfyUIClient()


__all__ = ["ComfyUIClientProtocol", "default_client"]
