"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-12

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("brand_id", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.String(length=1024), nullable=False),
        sa.Column("icps", sa.JSON(), nullable=False),
        sa.Column("languages", sa.JSON(), nullable=False),
        sa.Column("platforms", sa.JSON(), nullable=False),
        sa.Column("archetypes", sa.JSON(), nullable=False),
        sa.Column("variants_per_cell", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("score_threshold", sa.Float(), nullable=False, server_default="60"),
        sa.Column("max_iterations", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("cost_ceiling", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "candidates",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "job_id",
            sa.String(length=64),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("icp", sa.String(length=128), nullable=False),
        sa.Column("language", sa.String(length=16), nullable=False),
        sa.Column("platform", sa.String(length=32), nullable=False),
        sa.Column("archetype", sa.String(length=64), nullable=False),
        sa.Column("variant_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score_threshold", sa.Float(), nullable=False),
        sa.Column("max_iterations", sa.Integer(), nullable=False),
        sa.Column("cost_ceiling", sa.Float(), nullable=True),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("source_url", sa.String(length=1024), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_candidates_job_id", "candidates", ["job_id"])

    op.create_table(
        "iterations",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.String(length=64),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("index", sa.Integer(), nullable=False),
        sa.Column("video_url", sa.String(length=1024), nullable=False, server_default=""),
        sa.Column("edit_type", sa.String(length=64), nullable=True),
        sa.Column("cost", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_iterations_candidate_id", "iterations", ["candidate_id"])

    op.create_table(
        "scores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "iteration_id",
            sa.String(length=64),
            sa.ForeignKey("iterations.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("neural_score", sa.Float(), nullable=False),
        sa.Column("hook_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sustained_attention", sa.Float(), nullable=False, server_default="0"),
        sa.Column("emotional_resonance", sa.Float(), nullable=False, server_default="0"),
        sa.Column("cognitive_accessibility", sa.Float(), nullable=False, server_default="0"),
        sa.Column("memory_encoding", sa.Float(), nullable=False, server_default="0"),
        sa.Column("aesthetic_quality", sa.Float(), nullable=False, server_default="0"),
        sa.Column("attention_curve", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_scores_iteration_id", "scores", ["iteration_id"], unique=True)

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("job_id", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_events_job_id", "events", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_events_job_id", table_name="events")
    op.drop_table("events")
    op.drop_index("ix_scores_iteration_id", table_name="scores")
    op.drop_table("scores")
    op.drop_index("ix_iterations_candidate_id", table_name="iterations")
    op.drop_table("iterations")
    op.drop_index("ix_candidates_job_id", table_name="candidates")
    op.drop_table("candidates")
    op.drop_table("jobs")
