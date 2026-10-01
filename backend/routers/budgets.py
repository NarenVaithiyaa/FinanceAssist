from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from schemas import ExpenseLimitCreate, ExpenseLimitUpdate, ExpenseLimitResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import budget_service

router = APIRouter(tags=["Budgets"])

@router.post("", response_model=ExpenseLimitResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: ExpenseLimitCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new expense limit (budget) for the authenticated user.
    """
    return budget_service.create_budget(
        db=db, 
        budget_data=budget_in, 
        current_user=current_user
    )

@router.get("", response_model=List[ExpenseLimitResponse])
def get_budgets(
    limit: int = Query(default=20, ge=1, le=100, description="Number of budgets to return"),
    offset: int = Query(default=0, ge=0, description="Number of budgets to skip"),
    month: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$", description="Filter by YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a paginated list of budgets for the authenticated user.
    """
    return budget_service.get_budgets(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
        month=month
    )

@router.get("/{budget_id}", response_model=ExpenseLimitResponse)
def get_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a specific budget by ID for the authenticated user.
    """
    return budget_service.get_budget(
        db=db,
        budget_id=budget_id,
        current_user=current_user
    )

@router.put("/{budget_id}", response_model=ExpenseLimitResponse)
def update_budget(
    budget_id: UUID,
    budget_in: ExpenseLimitUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update a specific budget for the authenticated user.
    """
    return budget_service.update_budget(
        db=db,
        budget_id=budget_id,
        budget_data=budget_in,
        current_user=current_user
    )

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Delete a specific budget by ID for the authenticated user.
    """
    budget_service.delete_budget(
        db=db,
        budget_id=budget_id,
        current_user=current_user
    )
