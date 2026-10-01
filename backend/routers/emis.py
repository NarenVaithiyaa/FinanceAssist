from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from schemas import EMICreate, EMIUpdate, EMIResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import emi_service

router = APIRouter(tags=["EMIs"])

@router.post("", response_model=EMIResponse, status_code=status.HTTP_201_CREATED)
def create_emi(
    emi_in: EMICreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new EMI for the authenticated user.
    """
    return emi_service.create_emi(
        db=db, 
        emi_data=emi_in, 
        current_user=current_user
    )

@router.get("", response_model=List[EMIResponse])
def get_emis(
    limit: int = Query(default=20, ge=1, le=100, description="Number of EMIs to return"),
    offset: int = Query(default=0, ge=0, description="Number of EMIs to skip"),
    name: Optional[str] = Query(default=None, description="Filter by EMI name"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a paginated list of EMIs for the authenticated user.
    """
    return emi_service.get_emis(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
        name=name
    )

@router.get("/{emi_id}", response_model=EMIResponse)
def get_emi(
    emi_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve a specific EMI by ID for the authenticated user.
    """
    return emi_service.get_emi(
        db=db,
        emi_id=emi_id,
        current_user=current_user
    )

@router.put("/{emi_id}", response_model=EMIResponse)
def update_emi(
    emi_id: UUID,
    emi_in: EMIUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update a specific EMI for the authenticated user.
    """
    return emi_service.update_emi(
        db=db,
        emi_id=emi_id,
        emi_data=emi_in,
        current_user=current_user
    )

@router.delete("/{emi_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emi(
    emi_id: UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Delete a specific EMI by ID for the authenticated user.
    """
    emi_service.delete_emi(
        db=db,
        emi_id=emi_id,
        current_user=current_user
    )
