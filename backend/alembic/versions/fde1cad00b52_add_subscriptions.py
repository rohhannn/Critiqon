"""Subscriptions are included in the baseline schema.

Revision ID: fde1cad00b52
Revises: 6ac0662e4244
"""

from typing import Sequence, Union

revision: str = "fde1cad00b52"
down_revision: Union[str, Sequence[str], None] = "6ac0662e4244"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
