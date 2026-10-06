"""Add journey_state and journey_updated_at to users.

These two columns move the Journey save from the browser's
localStorage onto the account, so progress follows the trainer
instead of the device.

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-10-04
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
# Set this to your current head revision id before running. If this is
# the only migration you have, leave it as None.
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable with no server default: every existing trainer simply
    # has no server-side save yet, and the API reports that as
    # `empty: true` so their local save is kept rather than wiped.
    op.add_column("users", sa.Column("journey_state", sa.JSON(), nullable=True))
    op.add_column("users", sa.Column("journey_updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "journey_updated_at")
    op.drop_column("users", "journey_state")