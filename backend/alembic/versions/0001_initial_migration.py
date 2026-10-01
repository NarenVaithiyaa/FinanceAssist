"""initial migration

Revision ID: 0001
Revises: 
Create Date: 2026-08-22 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Account Balances
    op.create_table('account_balances',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('bank', sa.Numeric(), server_default=sa.text('0'), nullable=True),
        sa.Column('wallet', sa.Numeric(), server_default=sa.text('0'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Transactions
    op.create_table('transactions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(), nullable=False),
        sa.Column('category', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), server_default=sa.text("''::text"), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('type', sa.Text(), nullable=False),
        sa.Column('source', sa.Text(), nullable=True),
        sa.Column('destination', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint("destination = ANY (ARRAY['bank'::text, 'wallet'::text])", name='transactions_destination_check'),
        sa.CheckConstraint("source = ANY (ARRAY['bank'::text, 'wallet'::text])", name='transactions_source_check'),
        sa.CheckConstraint("type = ANY (ARRAY['income'::text, 'expense'::text])", name='transactions_type_check'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Expense Limits
    op.create_table('expense_limits',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('category', sa.Text(), nullable=False),
        sa.Column('limit_amount', sa.Numeric(), nullable=False),
        sa.Column('month', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Savings Goals
    op.create_table('savings_goals',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('target_amount', sa.Numeric(), nullable=False),
        sa.Column('current_amount', sa.Numeric(), server_default=sa.text('0'), nullable=True),
        sa.Column('category', sa.Text(), server_default=sa.text("'goal'::text"), nullable=True),
        sa.Column('color', sa.Text(), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint("category = ANY (ARRAY['goal'::text, 'investment'::text])", name='savings_goals_category_check'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # EMIs
    op.create_table('emis',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('principal', sa.Numeric(), nullable=False),
        sa.Column('months', sa.Integer(), nullable=False),
        sa.Column('emi_amount', sa.Numeric(), nullable=False),
        sa.Column('interest_rate', sa.Numeric(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('emis')
    op.drop_table('savings_goals')
    op.drop_table('expense_limits')
    op.drop_table('transactions')
    op.drop_table('account_balances')
