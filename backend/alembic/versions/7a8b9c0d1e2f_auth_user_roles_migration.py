"""Auth user roles and updated fields migration

Revision ID: 7a8b9c0d1e2f
Revises: 39cc3fd2a0d1
Create Date: 2026-07-24 11:42:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, None] = '39cc3fd2a0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename full_name -> name or add name
    op.add_column('users', sa.Column('name', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL")
    op.execute("UPDATE users SET name = 'User' WHERE name IS NULL")
    op.alter_column('users', 'name', nullable=False)

    # Rename hashed_password -> password_hash
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET password_hash = hashed_password WHERE password_hash IS NULL AND hashed_password IS NOT NULL")
    op.execute("UPDATE users SET password_hash = '' WHERE password_hash IS NULL")
    op.alter_column('users', 'password_hash', nullable=False)

    # Add role column
    op.add_column('users', sa.Column('role', sa.String(length=50), server_default='Doctor', nullable=False))

    # Drop old columns if present
    try:
        op.drop_column('users', 'full_name')
    except Exception:
        pass
    try:
        op.drop_column('users', 'hashed_password')
    except Exception:
        pass


def downgrade() -> None:
    op.add_column('users', sa.Column('full_name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET full_name = name")
    op.execute("UPDATE users SET hashed_password = password_hash")
    op.drop_column('users', 'role')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'name')
