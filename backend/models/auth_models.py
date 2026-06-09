"""
Authentication Models
User model with password hashing and JWT token management
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import bcrypt


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    account_type: str = "Free"  # Default account type


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    prefs: Optional[dict] = None


class UserInDB(UserBase):
    id: str
    hashed_password: str
    avatar: Optional[str] = None
    unique_id: Optional[str] = None
    qr_code: Optional[str] = None
    prefs: Optional[dict] = {}
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    account_type: str = "Free"  # Default account type

    class Config:
        json_schema_extra = {
            "example": {
                "id": "user_123",
                "email": "user@example.com",
                "name": "John Doe",
                "avatar": "https://example.com/avatar.jpg",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "account_type": "Free"
            }
        }


class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    unique_id: Optional[str] = None
    qr_code: Optional[str] = None
    prefs: Optional[dict] = {}
    account_type: str = "Free"  # Default account type

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    expires_at: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordHash:
    """Utility class for password hashing"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
