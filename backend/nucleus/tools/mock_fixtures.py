"""Fixture data for mock tool responses.

Mock scoring tracks how many times each candidate has been scored and returns
progressively higher scores, simulating the closed loop improving the variant.
"""

from __future__ import annotations

import random
from uuid import uuid4

from nucleus.config import is_mock as _config_is_mock

# candidate_id -> number of times scored
_SCORE_HISTORY: dict[str, int] = {}


def is_mock() -> bool:
    """Return True when the global mock-providers toggle is set.

    Thin wrapper over :func:`nucleus.config.is_mock` so tools that still
    import from ``mock_fixtures`` keep the same default semantics as the
    rest of the codebase.
    """
    return _config_is_mock()


def mock_video_url(tag: str = "video") -> str:
    return f"s3://nucleus-mock/{tag}-{uuid4().hex[:8]}.mp4"


def mock_audio_url(tag: str = "audio") -> str:
    return f"s3://nucleus-mock/{tag}-{uuid4().hex[:8]}.mp3"


def progressive_score(candidate_id: str, base: float = 45.0) -> float:
    """Return a neural score that improves with each call for the same candidate."""
    calls = _SCORE_HISTORY.get(candidate_id, 0)
    _SCORE_HISTORY[candidate_id] = calls + 1
    improvement = calls * random.uniform(8.0, 12.0)
    return min(base + improvement + random.uniform(-2.0, 2.0), 99.0)


def mock_metrics() -> list[dict]:
    return [
        {"name": "Hook Score", "score": random.uniform(40, 80), "brain_region": "NAcc"},
        {"name": "Sustained Attention", "score": random.uniform(40, 80), "brain_region": "Dorsal Attention Network"},
        {"name": "Emotional Resonance", "score": random.uniform(40, 80), "brain_region": "Amygdala"},
        {"name": "Memory Encoding", "score": random.uniform(40, 80), "brain_region": "Hippocampus"},
        {"name": "Aesthetic Quality", "score": random.uniform(40, 80), "brain_region": "mPFC"},
        {"name": "Cognitive Accessibility", "score": random.uniform(40, 80), "brain_region": "dlPFC"},
    ]


def mock_key_moments(duration_s: float = 30.0) -> list[dict]:
    return [
        {"timestamp": 1.5, "type": "best_hook", "label": "NAcc spike", "score": 78.0},
        {"timestamp": duration_s * 0.4, "type": "peak_engagement", "label": "Sustained attention peak", "score": 82.0},
        {"timestamp": duration_s * 0.7, "type": "dropoff_risk", "label": "DMN activation rise", "score": 42.0},
    ]


def mock_attention_curve(duration_s: float = 30.0, n_points: int = 30) -> list[float]:
    return [50 + 20 * random.random() for _ in range(n_points)]
