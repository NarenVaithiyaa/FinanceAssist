from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from pydantic import BaseModel
from uuid import UUID

from config import settings

# Initialize the Supabase client for the backend.
# We securely use the SERVICE_ROLE_KEY here since this code only runs on the server.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value())

# HTTPBearer automatically checks for the 'Authorization: Bearer <token>' header
# and rejects requests (401) if it is missing or malformed.
security = HTTPBearer()

class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthenticatedUser:
    """
    FastAPI dependency that validates a Supabase JWT and returns the user ID.
    """
    token = credentials.credentials
    try:
        # Ask Supabase to validate the token and return the user details.
        # This securely verifies the JWT signature and expiration against the live auth state.
        auth_response = supabase.auth.get_user(token)
        user = auth_response.user
        
        if not user:
            raise ValueError("No user found in token")
            
        return AuthenticatedUser(
            id=UUID(user.id),
            email=user.email
        )
    except Exception:
        # If token is expired, tampered with, or invalid, catch the error and return a clean 401.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
