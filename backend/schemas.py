from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

# Base response configuration for serializing SQLAlchemy objects
class ResponseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ----------------- Account Balances -----------------
# We do not have a standard "Create" because Account Balances are typically upserted.
class AccountBalanceUpdate(BaseModel):
    bank: Optional[Decimal] = Field(default=None)
    wallet: Optional[Decimal] = Field(default=None)

class AccountBalanceResponse(ResponseBase):
    id: UUID
    user_id: UUID
    bank: Optional[Decimal]
    wallet: Optional[Decimal]
    updated_at: Optional[datetime]


# ----------------- Transactions -----------------
class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0, description="Transaction amount must be strictly positive")
    category: str = Field(min_length=1)
    description: Optional[str] = ""
    date: date
    type: Literal["income", "expense"]
    source: Optional[Literal["bank", "wallet"]] = None
    destination: Optional[Literal["bank", "wallet"]] = None

class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    date: Optional[date] = None
    type: Optional[Literal["income", "expense"]] = None
    source: Optional[Literal["bank", "wallet"]] = None
    destination: Optional[Literal["bank", "wallet"]] = None

class TransactionResponse(ResponseBase):
    id: UUID
    user_id: UUID
    amount: Decimal
    category: str
    description: Optional[str]
    date: date
    type: str
    source: Optional[str]
    destination: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


# ----------------- Expense Limits (Budgets) -----------------
class ExpenseLimitCreate(BaseModel):
    category: str = Field(min_length=1)
    limit_amount: Decimal = Field(gt=0)
    month: str = Field(pattern=r"^\d{4}-\d{2}$", description="Month must be in YYYY-MM format")

class ExpenseLimitUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1)
    limit_amount: Optional[Decimal] = Field(default=None, gt=0)
    month: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}$")

class ExpenseLimitResponse(ResponseBase):
    id: UUID
    user_id: UUID
    category: str
    limit_amount: Decimal
    month: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


# ----------------- Savings Goals -----------------
class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1)
    target_amount: Decimal = Field(gt=0)
    current_amount: Optional[Decimal] = Field(default=Decimal("0.0"), ge=0)
    category: Optional[Literal["goal", "investment"]] = "goal"
    color: Optional[str] = None
    deadline: Optional[date] = None

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    target_amount: Optional[Decimal] = Field(default=None, gt=0)
    current_amount: Optional[Decimal] = Field(default=None, ge=0)
    category: Optional[Literal["goal", "investment"]] = None
    color: Optional[str] = None
    deadline: Optional[date] = None

class SavingsGoalResponse(ResponseBase):
    id: UUID
    user_id: UUID
    name: str
    target_amount: Decimal
    current_amount: Optional[Decimal]
    category: Optional[str]
    color: Optional[str]
    deadline: Optional[date]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


# ----------------- EMIs -----------------
class EMICreate(BaseModel):
    name: str = Field(min_length=1)
    principal: Decimal = Field(gt=0)
    months: int = Field(gt=0)
    emi_amount: Decimal = Field(gt=0)
    interest_rate: Optional[Decimal] = Field(default=None, ge=0)
    start_date: date

class EMIUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    principal: Optional[Decimal] = Field(default=None, gt=0)
    months: Optional[int] = Field(default=None, gt=0)
    emi_amount: Optional[Decimal] = Field(default=None, gt=0)
    interest_rate: Optional[Decimal] = Field(default=None, ge=0)
    start_date: Optional[date] = None

class EMIResponse(ResponseBase):
    id: UUID
    user_id: UUID
    name: str
    principal: Decimal
    months: int
    emi_amount: Decimal
    interest_rate: Optional[Decimal]
    start_date: date
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

# ----------------- AI Coach -----------------
class AICoachRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

class AICoachResponse(BaseModel):
    answer: str

# ----------------- User Profile -----------------
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=500)
    avatar_url: Optional[str] = Field(default=None, max_length=2000)

class ProfileResponse(ResponseBase):
    id: UUID
    user_id: UUID
    full_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    email: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
