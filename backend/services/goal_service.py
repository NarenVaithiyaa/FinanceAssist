from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Optional, List
from uuid import UUID

from models import SavingsGoal
from schemas import SavingsGoalCreate, SavingsGoalUpdate
from auth import AuthenticatedUser

def create_goal(db: Session, goal_data: SavingsGoalCreate, current_user: AuthenticatedUser) -> SavingsGoal:
    """
    Creates a new savings goal securely belonging to the authenticated user.
    """
    new_goal = SavingsGoal(
        **goal_data.model_dump(),
        user_id=current_user.id
    )
    
    try:
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        return new_goal
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the savings goal."
        )

def get_goals(
    db: Session, 
    current_user: AuthenticatedUser,
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None
) -> List[SavingsGoal]:
    """
    Retrieves a paginated list of savings goals securely belonging to the authenticated user.
    """
    try:
        stmt = select(SavingsGoal).where(SavingsGoal.user_id == current_user.id)
        
        if category:
            stmt = stmt.where(SavingsGoal.category == category)
            
        # Order by deadline ascending (closest first), nulls last, then by newest created
        stmt = stmt.order_by(SavingsGoal.deadline.asc().nulls_last(), SavingsGoal.created_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        
        result = db.execute(stmt)
        return list(result.scalars().all())
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving savings goals."
        )

def _get_goal_or_404(db: Session, goal_id: UUID, current_user: AuthenticatedUser) -> SavingsGoal:
    """
    Private helper to securely fetch a savings goal by ID ensuring user ownership.
    """
    stmt = select(SavingsGoal).where(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    )
    goal = db.execute(stmt).scalars().first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )
    return goal

def get_goal(db: Session, goal_id: UUID, current_user: AuthenticatedUser) -> SavingsGoal:
    """
    Retrieves a single savings goal by ID, securely scoped to the authenticated user.
    """
    return _get_goal_or_404(db, goal_id, current_user)

def update_goal(
    db: Session, 
    goal_id: UUID, 
    goal_data: SavingsGoalUpdate, 
    current_user: AuthenticatedUser
) -> SavingsGoal:
    """
    Updates an existing savings goal securely.
    """
    goal = _get_goal_or_404(db, goal_id, current_user)
    
    update_data = goal_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
        
    try:
        db.commit()
        db.refresh(goal)
        return goal
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the savings goal."
        )

def delete_goal(db: Session, goal_id: UUID, current_user: AuthenticatedUser) -> None:
    """
    Deletes a single savings goal securely.
    """
    goal = _get_goal_or_404(db, goal_id, current_user)
    
    try:
        db.delete(goal)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the savings goal."
        )
