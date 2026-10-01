from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Optional, List
from uuid import UUID

from models import EMI
from schemas import EMICreate, EMIUpdate
from auth import AuthenticatedUser

def create_emi(db: Session, emi_data: EMICreate, current_user: AuthenticatedUser) -> EMI:
    """
    Creates a new EMI securely belonging to the authenticated user.
    """
    new_emi = EMI(
        **emi_data.model_dump(),
        user_id=current_user.id
    )
    
    try:
        db.add(new_emi)
        db.commit()
        db.refresh(new_emi)
        return new_emi
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the EMI."
        )

def get_emis(
    db: Session, 
    current_user: AuthenticatedUser,
    limit: int = 20,
    offset: int = 0,
    name: Optional[str] = None
) -> List[EMI]:
    """
    Retrieves a paginated list of EMIs securely belonging to the authenticated user.
    """
    try:
        stmt = select(EMI).where(EMI.user_id == current_user.id)
        
        if name:
            stmt = stmt.where(EMI.name.ilike(f"%{name}%"))
            
        stmt = stmt.order_by(EMI.start_date.desc(), EMI.created_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        
        result = db.execute(stmt)
        return list(result.scalars().all())
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving EMIs."
        )

def _get_emi_or_404(db: Session, emi_id: UUID, current_user: AuthenticatedUser) -> EMI:
    """
    Private helper to securely fetch an EMI by ID ensuring user ownership.
    Raises a 404 Not Found if the EMI does not exist or belongs to someone else.
    """
    stmt = select(EMI).where(
        EMI.id == emi_id,
        EMI.user_id == current_user.id
    )
    emi = db.execute(stmt).scalars().first()
    
    if not emi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EMI not found"
        )
    return emi

def get_emi(db: Session, emi_id: UUID, current_user: AuthenticatedUser) -> EMI:
    """
    Retrieves a single EMI by ID, securely scoped to the authenticated user.
    """
    return _get_emi_or_404(db, emi_id, current_user)

def update_emi(
    db: Session, 
    emi_id: UUID, 
    emi_data: EMIUpdate, 
    current_user: AuthenticatedUser
) -> EMI:
    """
    Updates an existing EMI securely.
    """
    emi = _get_emi_or_404(db, emi_id, current_user)
    
    update_data = emi_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(emi, key, value)
        
    try:
        db.commit()
        db.refresh(emi)
        return emi
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the EMI."
        )

def delete_emi(db: Session, emi_id: UUID, current_user: AuthenticatedUser) -> None:
    """
    Deletes a single EMI securely.
    """
    emi = _get_emi_or_404(db, emi_id, current_user)
    
    try:
        db.delete(emi)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the EMI."
        )
