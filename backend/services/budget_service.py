from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Optional, List
from uuid import UUID

from models import ExpenseLimit
from schemas import ExpenseLimitCreate, ExpenseLimitUpdate
from auth import AuthenticatedUser

def create_budget(db: Session, budget_data: ExpenseLimitCreate, current_user: AuthenticatedUser) -> ExpenseLimit:
    """
    Creates a new expense limit securely belonging to the authenticated user.
    """
    new_budget = ExpenseLimit(
        **budget_data.model_dump(),
        user_id=current_user.id
    )
    
    try:
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the budget."
        )

def get_budgets(
    db: Session, 
    current_user: AuthenticatedUser,
    limit: int = 20,
    offset: int = 0,
    month: Optional[str] = None
) -> List[ExpenseLimit]:
    """
    Retrieves a paginated list of budgets securely belonging to the authenticated user.
    """
    try:
        stmt = select(ExpenseLimit).where(ExpenseLimit.user_id == current_user.id)
        
        if month:
            stmt = stmt.where(ExpenseLimit.month == month)
            
        stmt = stmt.order_by(ExpenseLimit.created_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        
        result = db.execute(stmt)
        return list(result.scalars().all())
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving budgets."
        )

def _get_budget_or_404(db: Session, budget_id: UUID, current_user: AuthenticatedUser) -> ExpenseLimit:
    """
    Private helper to securely fetch a budget by ID ensuring user ownership.
    """
    stmt = select(ExpenseLimit).where(
        ExpenseLimit.id == budget_id,
        ExpenseLimit.user_id == current_user.id
    )
    budget = db.execute(stmt).scalars().first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    return budget

def get_budget(db: Session, budget_id: UUID, current_user: AuthenticatedUser) -> ExpenseLimit:
    """
    Retrieves a single budget by ID, securely scoped to the authenticated user.
    """
    return _get_budget_or_404(db, budget_id, current_user)

def update_budget(
    db: Session, 
    budget_id: UUID, 
    budget_data: ExpenseLimitUpdate, 
    current_user: AuthenticatedUser
) -> ExpenseLimit:
    """
    Updates an existing budget securely.
    """
    budget = _get_budget_or_404(db, budget_id, current_user)
    
    update_data = budget_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)
        
    try:
        db.commit()
        db.refresh(budget)
        return budget
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the budget."
        )

def delete_budget(db: Session, budget_id: UUID, current_user: AuthenticatedUser) -> None:
    """
    Deletes a single budget securely.
    """
    budget = _get_budget_or_404(db, budget_id, current_user)
    
    try:
        db.delete(budget)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the budget."
        )
