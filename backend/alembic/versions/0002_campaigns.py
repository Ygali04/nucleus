"""campaigns table + iterations.analysis_result_json

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-12

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("archetype", sa.String(length=64), nullable=False),
        sa.Column("brand_name", sa.String(length=256), nullable=False),
        sa.Column("graph_json", sa.JSON(), nullable=False),
        sa.Column("brief_json", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="idle"),
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
        sa.Column("last_executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_job_id", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_campaigns_last_job_id", "campaigns", ["last_job_id"])

    op.add_column(
        "iterations",
        sa.Column("analysis_result_json", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("iterations", "analysis_result_json")
    op.drop_index("ix_campaigns_last_job_id", table_name="campaigns")
    op.drop_table("campaigns")
