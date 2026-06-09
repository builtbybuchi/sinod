from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8001
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: Union[List[str], str] = "*"
    
    # API Base URL (used for tracking links in emails)
    API_BASE_URL: str = "https://sinod.leapcell.app"
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # Email Service (Alibaba Cloud Direct Mail)
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    
    # API Settings
    ALIBABA_CLOUD_ACCESS_KEY_ID: str = ""
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: str = ""
    ALIBABA_CLOUD_REGION_ID: str = ""
    
    # Sender Addresses
    EMAIL_TRIGGERED_SENDER: str
    EMAIL_BATCH_SENDER: str
    EMAIL_NEWSLETTER_SENDER: str
    
    # Squadco Payment Service
    SQUADCO_SECRET_KEY: str
    SQUADCO_PUBLIC_KEY: str
    SQUADCO_BASE_URL: str = "https://api-d.squadco.com"
    
    # Gemini AI Service
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash-lite"
    
    # Appwrite Configuration
    APPWRITE_ENDPOINT: str = "https://storage.lexrunit.com/v1"
    APPWRITE_PROJECT_ID: str
    APPWRITE_API_KEY: str
    
    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # File Storage
    APPWRITE_BUCKET_ID: str = "default-bucket"
    MAX_FILE_SIZE_MB: int = 20
    UPLOAD_DIR: str = "./uploads"
    
    # Appwrite Collection IDs
    APPWRITE_DATABASE_ID: str
    APPWRITE_EVENTS_COLLECTION_ID: str
    APPWRITE_ATTENDEES_COLLECTION_ID: str
    APPWRITE_DOCUMENTS_COLLECTION_ID: str
    APPWRITE_INVITES_COLLECTION_ID: str
    APPWRITE_DOCUMENT_PRESENCE_COLLECTION_ID: str
    APPWRITE_WHITEBOARDS_COLLECTION_ID: str
    APPWRITE_WHITEBOARD_INVITES_COLLECTION_ID: str
    APPWRITE_WHITEBOARD_PRESENCE_COLLECTION_ID: str
    APPWRITE_CONVERSATIONS_COLLECTION_ID: str
    APPWRITE_MESSAGES_COLLECTION_ID: str
    APPWRITE_USER_PRESENCE_COLLECTION_ID: str
    APPWRITE_TASKS_COLLECTION_ID: str
    APPWRITE_UNIQUE_ID_COLLECTION_ID: str
    
    # New Collections for Backend Services (optional with defaults)
    APPWRITE_USERS_COLLECTION_ID: str = "users"
    APPWRITE_PRESENCE_COLLECTION_ID: str = "presence"
    APPWRITE_NOTIFICATIONS_COLLECTION_ID: str = "notifications"
    APPWRITE_NOTIFICATION_PREFERENCES_COLLECTION_ID: str = "notification_preferences"
    APPWRITE_FILES_COLLECTION_ID: str = "files_metadata"
    APPWRITE_FORMS_COLLECTION_ID: str = "forms"
    APPWRITE_FORM_RESPONSES_COLLECTION_ID: str = "form-responses"
    APPWRITE_QUIZZES_COLLECTION_ID: str = "quizzes"
    APPWRITE_QUIZ_RESPONSES_COLLECTION_ID: str = "quiz-responses"
    
    # Optional Collections
    APPWRITE_CHATS_COLLECTION: str = "chats"
    APPWRITE_PARTICIPANTS_COLLECTION: str = "participants"
    
    # Appwrite Buckets
    VITE_EVENT_MEDIA_BUCKET_ID: str
    APPWRITE_CHAT_FILES_BUCKET_ID: str = "chat-files"
    
    # QR Code Settings
    QR_CODE_VERSION: int = 1
    QR_CODE_BOX_SIZE: int = 10
    QR_CODE_BORDER: int = 4
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Newsletter Microservice
    NEWSLETTER_SERVICE_URL: str = "http://localhost:8002"
    NEWSLETTER_SERVICE_SECRET: str = "sinod-newsletter-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file


# Initialize settings
settings = Settings()
