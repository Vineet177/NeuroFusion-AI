"""Add dob, phone, and address to patients table

Revision ID: a1b2c3d4e5f6
Revises: 9c0d1e2f3a4b
Create Date: 2026-07-24 12:36:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9c0d1e2f3a4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('dob', sa.String(length=50), nullable=True))
    op.add_column('patients', sa.Column('phone', sa.String(length=50), nullable=True))
    op.add_column('patients', sa.Column('address', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('patients', 'address')
    op.drop_column('patients', 'phone')
    op.drop_column('patients', 'dob')
