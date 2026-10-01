from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from schemas import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import goal_service

router = APIRouter(tags=["Goals"])

@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new savings goal for the authenticated user.
    """
    return goal_service.create_goal(
        db=db, 
        goal_data=goal_in, 
        current_user=current_user
    )

@router.get("", response_model=List[SavingsGoalResponse])
def get_goals(
    limit: int = Query(default=20, ge=1, le=100, description="Number of goals to return"),
    offset: int = Query(default=0, ge=0, description="Number of goals to skip"),
    category: Optional[str] = Query(default=None, description="Filter by category (goal or investment)"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a paginated list of savings goals for the authenticated user.
    """
    return goal_service.get_goals(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
        category=category
    )

@router.get("/{goal_id}", response_model=SavingsGoalResponse)
def get_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a specific savings goal by ID for the authenticated user.
    """
    return goal_service.get_goal(
        db=db,
        goal_id=goal_id,
        current_user=current_user
    )

@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_goal(
    goal_id: UUID,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update a specific savings goal for the authenticated user.
    """
    return goal_service.update_goal(
        db=db,
        goal_id=goal_id,
        goal_data=goal_in,
        current_user=current_user
    )

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Delete a specific savings goal by ID for the authenticated user.
    """
    goal_service.delete_goal(
        db=db,
        goal_id=goal_id,
        current_user=current_user
    )
