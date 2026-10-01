from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import insert

from models import AccountBalance
from schemas import AccountBalanceUpdate
from auth import AuthenticatedUser

def get_balance(db: Session, current_user: AuthenticatedUser) -> AccountBalance:
    """
    Retrieves the authenticated user's account balance safely.
    """
    stmt = select(AccountBalance).where(AccountBalance.user_id == current_user.id)
    balance = db.execute(stmt).scalars().first()
    
    if not balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account balance not found"
        )
    return balance

def upsert_balance(db: Session, balance_data: AccountBalanceUpdate, current_user: AuthenticatedUser) -> AccountBalance:
    """
    Performs an atomic PostgreSQL UPSERT to safely update or create the user's account balance.
    """
    # 1. Build the base PostgreSQL INSERT statement
    stmt = insert(AccountBalance).values(
        user_id=current_user.id,
        bank=balance_data.bank,
        wallet=balance_data.wallet
    )
    
    # 2. Append the ON CONFLICT DO UPDATE clause targeting the unique user_id constraint
    upsert_stmt = stmt.on_conflict_do_update(
        index_elements=['user_id'],
        set_={
            'bank': stmt.excluded.bank,
            'wallet': stmt.excluded.wallet,
            'updated_at': func.now()
        }
    ).returning(AccountBalance)
    
    try:
        # 3. Execute the atomic query and fetch the resulting row in one trip
        result = db.execute(upsert_stmt)
        db.commit()
        
        # 4. Extract the updated object
        balance = result.scalars().first()
        if not balance:
            raise ValueError("UPSERT failed to return a row")
            
        return balance
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the account balance."
        )
