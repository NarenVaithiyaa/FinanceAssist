from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import insert

from models import UserProfile
from schemas import ProfileUpdate, ProfileResponse
from auth import AuthenticatedUser


def get_profile(db: Session, current_user: AuthenticatedUser) -> UserProfile:
    """
    Retrieves the authenticated user's profile, creating one if it doesn't exist.
    """
    stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = db.execute(stmt).scalars().first()

    if not profile:
        # Auto-create a profile row for new users
        profile = UserProfile(
            user_id=current_user.id,
            full_name=current_user.email.split("@")[0] if current_user.email else "User",
        )
        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)
        except SQLAlchemyError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating the user profile.",
            )

    return profile


def update_profile(
    db: Session, profile_data: ProfileUpdate, current_user: AuthenticatedUser
) -> UserProfile:
    """
    Updates (or upserts) the authenticated user's profile atomically.
    """
    update_fields = profile_data.model_dump(exclude_unset=True)

    if not update_fields:
        # Nothing to update — just return the current profile
        return get_profile(db, current_user)

    # Build an atomic UPSERT so we never race on the first update
    insert_values = {
        "user_id": current_user.id,
        "full_name": update_fields.get("full_name", ""),
        "bio": update_fields.get("bio", ""),
        "avatar_url": update_fields.get("avatar_url", ""),
    }

    stmt = insert(UserProfile).values(**insert_values)

    # On conflict, only update fields that were explicitly provided
    set_clause = {k: getattr(stmt.excluded, k) for k in update_fields}
    set_clause["updated_at"] = func.now()

    upsert_stmt = stmt.on_conflict_do_update(
        index_elements=["user_id"],
        set_=set_clause,
    ).returning(UserProfile)

    try:
        result = db.execute(upsert_stmt)
        db.commit()
        profile = result.scalars().first()
        if not profile:
            raise ValueError("UPSERT failed to return a row")
        return profile
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the user profile.",
        )
