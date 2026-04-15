"""SQLAlchemy 2.0 ORM models mirroring ``nucleus.models`` Pydantic schemas.

The mapping is deliberately flat: the Pydantic ``BriefRequest`` is denormalised
into the ``jobs`` table as JSON arrays + scalar columns so we don't need a
separate briefs table. ``ScoreBreakdown`` lives in a child ``scores`` row keyed
one-to-one on ``iterations``.

Timestamps use DB-side defaults (``func.now()``) to avoid clock skew between
app servers; ``updated_at`` fires on every UPDATE.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nucleus.db.engine import Base


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

class JobRow(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False)

    # Flattened BriefRequest
    brand_id: Mapped[str] = mapped_column(String(128), nullable=False)
    source_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    icps: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    languages: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    platforms: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    archetypes: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    variants_per_cell: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    score_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=60.0)
    max_iterations: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    cost_ceiling: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    candidates: Mapped[list["CandidateRow"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------

class CandidateRow(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    job_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    icp: Mapped[str] = mapped_column(String(128), nullable=False)
    language: Mapped[str] = mapped_column(String(16), nullable=False)
    platform: Mapped[str] = mapped_column(String(32), nullable=False)
    archetype: Mapped[str] = mapped_column(String(64), nullable=False)
    variant_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    max_iterations: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_ceiling: Mapped[float | None] = mapped_column(Float, nullable=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False)
    source_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    job: Mapped[JobRow] = relationship(back_populates="candidates")
    iterations: Mapped[list["IterationRow"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Iterations
# ---------------------------------------------------------------------------

class IterationRow(Base):
    __tablename__ = "iterations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    index: Mapped[int] = mapped_column(Integer, nullable=False)
    video_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    edit_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Full NeuroPeer ``AnalysisResult`` (serialized as JSON) captured whenever
    # a scoring event completes. ``ScoreRow`` is the flat rollup used for fast
    # aggregation; this column preserves the complete report for UI retrieval.
    analysis_result_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    candidate: Mapped[CandidateRow] = relationship(back_populates="iterations")
    score: Mapped["ScoreRow | None"] = relationship(
        back_populates="iteration",
        cascade="all, delete-orphan",
        uselist=False,
    )


# ---------------------------------------------------------------------------
# Scores (1:1 with iterations)
# ---------------------------------------------------------------------------

class ScoreRow(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    iteration_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("iterations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    neural_score: Mapped[float] = mapped_column(Float, nullable=False)
    hook_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    sustained_attention: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    emotional_resonance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cognitive_accessibility: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    memory_encoding: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    aesthetic_quality: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    attention_curve: Mapped[list[float]] = mapped_column(JSON, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    iteration: Mapped[IterationRow] = relationship(back_populates="score")


# ---------------------------------------------------------------------------
# Events (durable log; complements the in-process pubsub in nucleus.events)
# ---------------------------------------------------------------------------

class CampaignRow(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    archetype: Mapped[str] = mapped_column(String(64), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(256), nullable=False)
    graph_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    brief_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="idle")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Job enqueued by the most recent /execute call, so /reports can walk
    # candidates -> iterations without a campaign_id FK on existing tables.
    last_job_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    # GTM guide + SOP doc produced by the strategist agent on delivery.
    deliverables_json: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )


class EventRow(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
