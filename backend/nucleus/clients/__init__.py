"""External API clients for Nucleus (NeuroPeer, ComfyUI, etc.)."""

from nucleus.clients.comfyui import ComfyUIClient, ComfyUIError
from nucleus.clients.neuropeer import NeuroPeerClient, NeuroPeerError
from nucleus.clients.neuropeer_types import (
    AnalysisResult,
    ComparisonResult,
    JobCreated,
    KeyMoment,
    MetricScore,
    ModalityContribution,
    NeuralScoreBreakdown,
    ProgressEvent,
)

__all__ = [
    "AnalysisResult",
    "ComfyUIClient",
    "ComfyUIError",
    "ComparisonResult",
    "JobCreated",
    "KeyMoment",
    "MetricScore",
    "ModalityContribution",
    "NeuralScoreBreakdown",
    "NeuroPeerClient",
    "NeuroPeerError",
    "ProgressEvent",
]
