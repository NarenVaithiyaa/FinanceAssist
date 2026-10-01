from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas import AICoachRequest, AICoachResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import ai_service

router = APIRouter(tags=["AI Coach"])

@router.post("/coach", response_model=AICoachResponse)
def finance_coach(
    request: AICoachRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Securely requests AI financial advice using the authenticated user's financial snapshot.
    """
    return ai_service.get_financial_advice(
        db=db,
        current_user=current_user,
        question=request.question
    )
