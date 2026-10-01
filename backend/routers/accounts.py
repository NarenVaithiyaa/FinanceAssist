from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from schemas import AccountBalanceUpdate, AccountBalanceResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import account_service

router = APIRouter(tags=["Accounts"])

@router.get("/balances", response_model=AccountBalanceResponse)
def get_balance(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve the account balance for the authenticated user.
    """
    return account_service.get_balance(
        db=db, 
        current_user=current_user
    )

@router.put("/balances", response_model=AccountBalanceResponse)
def update_balance(
    balance_in: AccountBalanceUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update or create the account balance for the authenticated user using an atomic UPSERT.
    """
    return account_service.upsert_balance(
        db=db,
        balance_data=balance_in,
        current_user=current_user
    )
