"""
Authentication Routes
API endpoints for user authentication and management
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Query as QueryParam
from typing import Optional

from models.auth_models import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    AuthResponse, ChangePasswordRequest, PasswordResetRequest
)
from services.auth_service import auth_service


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Dependency to get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = auth_service.verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload.get("sub")  # Returns user_id


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    """
    Register a new user
    
    - **email**: User email address
    - **password**: User password (min 6 characters)
    - **name**: User full name
    """
    try:
        result = await auth_service.create_user(user_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """
    Login with email and password
    
    - **email**: User email address
    - **password**: User password
    """
    try:
        result = await auth_service.authenticate_user(
            credentials.email,
            credentials.password
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user)):
    """
    Logout current user
    
    Note: With JWT, logout is handled client-side by removing the token.
    This endpoint is provided for consistency and can be used for logging purposes.
    """
    # In JWT-based auth, we don't invalidate tokens on the server
    # The client should remove the token
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """
    Get current user information
    
    Requires authentication token in header: Authorization: Bearer <token>
    """
    try:
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update user profile
    
    - **name**: New name (optional)
    - **avatar**: Avatar URL (optional)
    - **prefs**: User preferences dictionary (optional)
    """
    try:
        updated_user = await auth_service.update_user(user_id, updates)
        return updated_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Change user password
    
    - **old_password**: Current password
    - **new_password**: New password (min 6 characters)
    """
    try:
        success = await auth_service.change_password(
            user_id,
            request.old_password,
            request.new_password
        )
        
        return {"success": success, "message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")


@router.post("/reset-password")
async def request_password_reset(request: PasswordResetRequest):
    """
    Request password reset (sends email with reset link)
    
    - **email**: User email address
    
    Note: This is a placeholder. You need to implement email sending service.
    """
    try:
        user = await auth_service.get_user_by_email(request.email)
        
        if not user:
            # Don't reveal whether email exists
            return {"success": True, "message": "If the email exists, a reset link will be sent"}
        
        # TODO: Generate reset token and send email
        # For now, return success
        return {"success": True, "message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")


@router.get("/users/lookup/email")
async def lookup_user_by_email(
    email: str = QueryParam(..., description="Email to look up"),
):
    """
    Look up a user by email. Returns basic user info if found.
    Used for chat invite system to check if a user exists on the platform.
    """
    try:
        user = await auth_service.get_user_by_email(email.strip().lower())
        if not user:
            return {"found": False, "email": email}
        return {
            "found": True,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lookup failed: {str(e)}")


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get user by ID
    
    Requires authentication
    """
    try:
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")
