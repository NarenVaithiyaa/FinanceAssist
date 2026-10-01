from fastapi import APIRouter, Depends, status, Query, Response
from sqlalchemy.orm import Session
from typing import Literal, Optional, List
from uuid import UUID

from schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import transaction_service

router = APIRouter(tags=["Transactions"])

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new transaction for the authenticated user.
    """
    return transaction_service.create_transaction(
        db=db, 
        transaction_data=transaction_in, 
        current_user=current_user
    )

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = Query(default=20, ge=1, le=100, description="Number of transactions to return"),
    offset: int = Query(default=0, ge=0, description="Number of transactions to skip"),
    type: Optional[Literal["income", "expense"]] = Query(default=None, description="Filter by transaction type"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a paginated list of transactions for the authenticated user.
    """
    return transaction_service.get_transactions(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
        type_filter=type,
        category_filter=category
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a specific transaction by ID for the authenticated user.
    """
    return transaction_service.get_transaction(
        db=db,
        transaction_id=transaction_id,
        current_user=current_user
    )

@router.put("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update a specific transaction for the authenticated user.
    """
    return transaction_service.update_transaction(
        db=db,
        transaction_id=transaction_id,
        transaction_data=transaction_in,
        current_user=current_user
    )

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Delete a specific transaction by ID for the authenticated user.
    """
    transaction_service.delete_transaction(
        db=db,
        transaction_id=transaction_id,
        current_user=current_user
    )
