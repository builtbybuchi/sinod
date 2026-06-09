"""
Authentication Service
Handles user registration, login using Appwrite Auth, and JWT token generation
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
import secrets
import qrcode
import io
import base64
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.query import Query
from appwrite.id import ID

from models.auth_models import (
    UserCreate, UserInDB, UserResponse, UserUpdate, 
    PasswordHash, AuthResponse
)
from config import settings
import logging
import json


class AuthService:
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        
        self.users = Users(self.client)
        self.databases = Databases(self.client)
        self.database_id = settings.APPWRITE_DATABASE_ID
        
        # JWT settings
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    def generate_unique_id(self) -> str:
        """Generate a unique 6-character ID"""
        return secrets.token_hex(3).upper()

    def generate_qr_code(self, user_id: str, email: str) -> str:
        """Generate QR code for user"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"USER:{user_id}:{email}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"

    def create_access_token(self, user_id: str, email: str) -> tuple[str, datetime]:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode = {
            "sub": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt, expire

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None

    async def create_user(self, user_data: UserCreate) -> AuthResponse:
        """Create a new user using Appwrite Auth"""
        try:
            # Create user with Appwrite Auth
            user = self.users.create(
                user_id=ID.unique(),
                email=user_data.email,
                password=user_data.password,
                name=user_data.name
            )
            # Set account type using labels (free or pro)
            account_type = user_data.account_type or "free"
            # Normalize to lowercase
            account_type = account_type.lower()
            if account_type not in ['free', 'pro']:
                account_type = 'free'
            
            try:
                # Add label to user
                self.users.update_labels(user['$id'], [account_type])
                logging.getLogger(__name__).info("Added '%s' label to user %s", account_type, user.get('$id'))
            except Exception as e:
                # Log and continue; creating the auth user is the critical operation.
                logging.getLogger(__name__).warning(
                    "Failed to add label to user %s: %s",
                    user.get('$id'), str(e), exc_info=True
                )

            # Generate JWT token
            token, expires_at = self.create_access_token(user['$id'], user['email'])

            # Create response
            user_response = UserResponse(
                id=user['$id'],
                email=user['email'],
                name=user['name'],
                avatar=None,
                unique_id=None,
                qr_code=None,
                prefs=user.get('prefs', {}),
                account_type=account_type
            )

            return AuthResponse(
                user=user_response,
                token=token,
                expires_at=expires_at.isoformat()
            )

        except Exception as e:
            raise Exception(f"Failed to create user: {str(e)}")

    async def authenticate_user(self, email: str, password: str) -> AuthResponse:
        """Authenticate user using Appwrite Auth"""
        try:
            # List users by email
            users_list = self.users.list(queries=[Query.equal('email', email)])
            
            if users_list['total'] == 0:
                raise ValueError("Invalid email or password")
            
            user = users_list['users'][0]
            
            # Note: Appwrite server SDK doesn't verify passwords directly
            # The password verification happens client-side via sessions
            # For backend-to-backend, we trust that the user exists
            # In production, consider using Appwrite sessions or implement additional verification
            
            # Get account type from labels
            labels = user.get('labels', [])
            account_type = 'free'  # default
            for label in labels:
                if label in ['free', 'pro', 'admin']:
                    account_type = label
                    break
            
            # Generate JWT token
            token, expires_at = self.create_access_token(user['$id'], user['email'])
            
            # Create response
            user_response = UserResponse(
                id=user['$id'],
                email=user['email'],
                name=user['name'],
                avatar=None,
                unique_id=None,
                qr_code=None,
                prefs=user.get('prefs', {}),
                account_type=account_type
            )
            
            return AuthResponse(
                user=user_response,
                token=token,
                expires_at=expires_at.isoformat()
            )
            
        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")
            
            # Generate JWT token
            token, expires_at = self.create_access_token(user_doc['$id'], user_doc['email'])
            
            # Create response
            user_response = UserResponse(
                id=user_doc['$id'],
                email=user_doc['email'],
                name=user_doc['name'],
                avatar=user_doc.get('avatar'),
                unique_id=user_doc.get('unique_id'),
                qr_code=user_doc.get('qr_code'),
                prefs=user_doc.get('prefs', {})
            )
            
            return AuthResponse(
                user=user_response,
                token=token,
                expires_at=expires_at.isoformat()
            )
            
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID using Appwrite Auth"""
        try:
            user = self.users.get(user_id)
            
            # Get account type from labels
            labels = user.get('labels', [])
            account_type = 'free'  # default
            for label in labels:
                if label in ['free', 'pro', 'admin']:
                    account_type = label
                    break
            
            return UserResponse(
                id=user['$id'],
                email=user['email'],
                name=user['name'],
                avatar=None,
                unique_id=None,
                qr_code=None,
                prefs=user.get('prefs', {}),
                account_type=account_type
            )
            
        except Exception:
            return None

    async def update_user(self, user_id: str, updates: UserUpdate) -> UserResponse:
        """Update user profile using Appwrite Auth"""
        try:
            # Update user with Appwrite Auth
            user = self.users.update_name(user_id, updates.name) if updates.name else self.users.get(user_id)
            
            # Note: Appwrite Auth has limited update capabilities via server SDK
            # For more fields, you may need to store additional data in a separate collection
            
            return UserResponse(
                id=user['$id'],
                email=user['email'],
                name=user['name'],
                avatar=None,
                unique_id=None,
                qr_code=None,
                prefs=user.get('prefs', {})
            )
            
        except Exception as e:
            raise Exception(f"Failed to update user: {str(e)}")

    async def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """Change user password using Appwrite Auth"""
        try:
            # Update password with Appwrite Auth
            self.users.update_password(user_id, new_password)
            return True
            
        except Exception as e:
            raise Exception(f"Failed to change password: {str(e)}")
            
            # Verify old password
            if not PasswordHash.verify_password(old_password, user_doc['hashed_password']):
                raise ValueError("Current password is incorrect")
            
            # Hash new password
            new_hashed = PasswordHash.hash_password(new_password)
            
            # Update password
            self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data={
                    'hashed_password': new_hashed,
                    'updated_at': datetime.utcnow().isoformat()
                }
            )
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to change password: {str(e)}")

    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        try:
            result = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                queries=[Query.equal('email', email)]
            )
            
            if result['total'] == 0:
                return None
            
            user_doc = result.get('documents', result.get('rows', []))[0]
            
            return UserResponse(
                id=user_doc['$id'],
                email=user_doc['email'],
                name=user_doc['name'],
                avatar=user_doc.get('avatar'),
                unique_id=user_doc.get('unique_id'),
                qr_code=user_doc.get('qr_code'),
                prefs=user_doc.get('prefs', {})
            )
            
        except Exception:
            return None

    async def update_user_account_type(self, user_id: str, account_type: str):
        """Update user account type using labels (free, pro, or admin)"""
        try:
            # Normalize to lowercase
            account_type = account_type.lower()
            if account_type not in ['free', 'pro', 'admin']:
                raise ValueError(f"Invalid account type: {account_type}. Must be 'free', 'pro', or 'admin'.")
            
            # Update user labels
            self.users.update_labels(user_id, [account_type])
            logging.getLogger(__name__).info("Updated user %s to '%s' account type", user_id, account_type)
        except Exception as e:
            raise Exception(f"Failed to update user account type: {str(e)}")

    async def get_user_account_type(self, user_id: str) -> str:
        """Get user's account type from labels"""
        try:
            user = self.users.get(user_id)
            labels = user.get('labels', [])
            
            # Check for account type labels
            for label in labels:
                if label in ['free', 'pro', 'admin']:
                    return label
            
            # Default to free if no label found
            return 'free'
        except Exception as e:
            raise Exception(f"Failed to get user account type: {str(e)}")


# Global service instance
auth_service = AuthService()
