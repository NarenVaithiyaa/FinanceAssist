from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Literal, Optional, List
from uuid import UUID

from models import Transaction, AccountBalance
from schemas import TransactionCreate, TransactionUpdate
from auth import AuthenticatedUser
from sqlalchemy.dialects.postgresql import insert
from decimal import Decimal

def _adjust_balance(db: Session, user_id: UUID, transaction: Transaction, revert: bool = False) -> None:
    """
    Adjusts the user's account balance based on the transaction.
    If revert=True, it applies the opposite effect (used for updates/deletes).
    """
    amount = transaction.amount if not revert else -transaction.amount
    
    bank_delta = Decimal(0)
    wallet_delta = Decimal(0)
    
    if transaction.type == "income" and transaction.destination:
        if transaction.destination == "bank":
            bank_delta += amount
        elif transaction.destination == "wallet":
            wallet_delta += amount
            
    elif transaction.type == "expense" and transaction.source:
        if transaction.source == "bank":
            bank_delta -= amount
        elif transaction.source == "wallet":
            wallet_delta -= amount
            
    if bank_delta == 0 and wallet_delta == 0:
        return
        
    stmt = insert(AccountBalance).values(
        user_id=user_id,
        bank=bank_delta,
        wallet=wallet_delta
    )
    upsert_stmt = stmt.on_conflict_do_update(
        index_elements=['user_id'],
        set_={
            'bank': AccountBalance.bank + stmt.excluded.bank,
            'wallet': AccountBalance.wallet + stmt.excluded.wallet
        }
    )
    db.execute(upsert_stmt)

def create_transaction(db: Session, transaction_data: TransactionCreate, current_user: AuthenticatedUser) -> Transaction:
    """
    Creates a new transaction securely belonging to the authenticated user.
    """
    new_transaction = Transaction(
        **transaction_data.model_dump(),
        user_id=current_user.id
    )
    
    try:
        db.add(new_transaction)
        db.flush()
        _adjust_balance(db, current_user.id, new_transaction)
        db.commit()
        db.refresh(new_transaction)
        return new_transaction
    except SQLAlchemyError as e:
        db.rollback()
        print("🔥 CREATE TRANSACTION DB ERROR:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the transaction."
        )

def get_transactions(
    db: Session, 
    current_user: AuthenticatedUser,
    limit: int = 20,
    offset: int = 0,
    type_filter: Optional[Literal["income", "expense"]] = None,
    category_filter: Optional[str] = None
) -> List[Transaction]:
    """
    Retrieves a paginated, filtered list of transactions securely belonging to the authenticated user.
    """
    try:
        stmt = select(Transaction).where(Transaction.user_id == current_user.id)
        
        if type_filter:
            stmt = stmt.where(Transaction.type == type_filter)
        if category_filter:
            stmt = stmt.where(Transaction.category == category_filter)
            
        stmt = stmt.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        
        result = db.execute(stmt)
        return list(result.scalars().all())
        
    except SQLAlchemyError as e:
        db.rollback()
        print("🔥 TRANSACTION DB ERROR:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving transactions."
    )

def _get_transaction_or_404(db: Session, transaction_id: UUID, current_user: AuthenticatedUser) -> Transaction:
    """
    Private helper to securely fetch a transaction by ID ensuring user ownership.
    Raises a 404 Not Found if the transaction does not exist or belongs to someone else.
    """
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    transaction = db.execute(stmt).scalars().first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction

def get_transaction(db: Session, transaction_id: UUID, current_user: AuthenticatedUser) -> Transaction:
    """
    Retrieves a single transaction by ID, securely scoped to the authenticated user.
    """
    return _get_transaction_or_404(db, transaction_id, current_user)

def update_transaction(
    db: Session, 
    transaction_id: UUID, 
    transaction_data: TransactionUpdate, 
    current_user: AuthenticatedUser
) -> Transaction:
    """
    Updates an existing transaction securely.
    """
    # Verify existence and ownership BEFORE attempting update
    transaction = _get_transaction_or_404(db, transaction_id, current_user)
    
    # Extract only the fields explicitly provided in the request body
    update_data = transaction_data.model_dump(exclude_unset=True)
    
    # Revert the old transaction's impact
    _adjust_balance(db, current_user.id, transaction, revert=True)
    
    # Update the SQLAlchemy object
    for key, value in update_data.items():
        setattr(transaction, key, value)
        
    # Apply the new transaction's impact
    _adjust_balance(db, current_user.id, transaction, revert=False)
        
    try:
        db.commit()
        db.refresh(transaction)
        return transaction
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the transaction."
        )

def delete_transaction(db: Session, transaction_id: UUID, current_user: AuthenticatedUser) -> None:
    """
    Deletes a single transaction securely.
    """
    transaction = _get_transaction_or_404(db, transaction_id, current_user)
    
    try:
        _adjust_balance(db, current_user.id, transaction, revert=True)
        db.delete(transaction)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the transaction."
        )
