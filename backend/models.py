from typing import Optional
from uuid import UUID
from datetime import date as dt_date, datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, text, CheckConstraint, DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from sqlalchemy import Table, Column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

# Define the external Supabase auth.users table so SQLAlchemy foreign keys can reference it
Table(
    "users",
    Base.metadata,
    Column("id", PGUUID(as_uuid=True), primary_key=True),
    schema="auth"
)

class AccountBalance(Base):
    __tablename__ = "account_balances"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bank: Mapped[Optional[Decimal]] = mapped_column(Numeric, server_default=text("0"))
    wallet: Mapped[Optional[Decimal]] = mapped_column(Numeric, server_default=text("0"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

class Transaction(Base):
    __tablename__ = "transactions"
    
    __table_args__ = (
        CheckConstraint("type = ANY (ARRAY['income'::text, 'expense'::text])", name="transactions_type_check"),
        CheckConstraint("source = ANY (ARRAY['bank'::text, 'wallet'::text])", name="transactions_source_check"),
        CheckConstraint("destination = ANY (ARRAY['bank'::text, 'wallet'::text])", name="transactions_destination_check")
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, server_default=text("''::text"))
    date: Mapped[dt_date] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[Optional[str]] = mapped_column(Text)
    destination: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

class ExpenseLimit(Base):
    __tablename__ = "expense_limits"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), index=True, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    limit_amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    month: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    __table_args__ = (
        CheckConstraint("category = ANY (ARRAY['goal'::text, 'investment'::text])", name="savings_goals_category_check"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    current_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric, server_default=text("0"))
    category: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'goal'::text"))
    color: Mapped[Optional[str]] = mapped_column(Text)
    deadline: Mapped[Optional[dt_date]]
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

class EMI(Base):
    __tablename__ = "emis"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    principal: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    months: Mapped[int] = mapped_column(nullable=False)
    emi_amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    interest_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric)
    start_date: Mapped[dt_date] = mapped_column(nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("auth.users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(Text, server_default=text("''::text"))
    bio: Mapped[Optional[str]] = mapped_column(Text, server_default=text("''::text"))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, server_default=text("''::text"))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
