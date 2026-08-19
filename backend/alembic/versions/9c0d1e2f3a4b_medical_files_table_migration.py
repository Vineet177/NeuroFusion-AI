"""Medical files table migration

Revision ID: 9c0d1e2f3a4b
Revises: 8b9c0d1e2f3a
Create Date: 2026-07-24 12:07:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c0d1e2f3a4b'
down_revision: Union[str, None] = '8b9c0d1e2f3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'medical_files',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('upload_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ml_status', sa.String(length=50), server_default='PENDING_ANALYSIS', nullable=False),
        sa.Column('ml_results', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medical_files_id'), 'medical_files', ['id'], unique=False)
    op.create_index(op.f('ix_medical_files_patient_id'), 'medical_files', ['patient_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_medical_files_patient_id'), table_name='medical_files')
    op.drop_index(op.f('ix_medical_files_id'), table_name='medical_files')
    op.drop_table('medical_files')
