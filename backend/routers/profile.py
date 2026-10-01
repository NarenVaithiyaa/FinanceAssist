from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas import ProfileUpdate, ProfileResponse
from auth import get_current_user, AuthenticatedUser
from database import get_db
from services import profile_service

router = APIRouter(tags=["Profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retrieve the authenticated user's profile. Auto-creates one if it doesn't exist.
    """
    profile = profile_service.get_profile(db=db, current_user=current_user)
    # Attach email from the JWT so the frontend has it without an extra Supabase call
    response = ProfileResponse.model_validate(profile)
    response.email = current_user.email
    return response


@router.put("", response_model=ProfileResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Update the authenticated user's profile (name, bio, avatar).
    """
    profile = profile_service.update_profile(
        db=db, profile_data=profile_in, current_user=current_user
    )
    response = ProfileResponse.model_validate(profile)
    response.email = current_user.email
    return response
