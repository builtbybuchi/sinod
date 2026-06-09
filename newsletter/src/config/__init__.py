from pydantic_settings import BaseSettings
from typing import Union, List
import os


class Settings(BaseSettings):
    """Newsletter microservice settings"""

    # Environment
    ENVIRONMENT: str = "development"
    PORT: int = 8002

    # Auth - shared secret between main backend and this service
    SERVICE_SECRET: str = "sinod-newsletter-secret-key-change-in-production"

    # URLs
    MAIN_BACKEND_URL: str = "http://localhost:8001"
    NEWSLETTER_SERVICE_URL: str = "http://localhost:8002"
    FRONTEND_URL: str = "https://sinod.app"

    # SMTP (Alibaba Cloud Direct Mail)
    SMTP_HOST: str = "smtpdm-ap-southeast-1.aliyun.com"
    SMTP_PORT: int = 80
    SMTP_USERNAME: str = "no-reply@mail.sinod.app"
    SMTP_PASSWORD: str = ""
    EMAIL_NEWSLETTER_SENDER: str = "news@mail.sinod.app"

    # Appwrite (shared DB with main backend)
    APPWRITE_ENDPOINT: str = "https://nyc.cloud.appwrite.io/v1"
    APPWRITE_PROJECT_ID: str = "sinod"
    APPWRITE_API_KEY: str = ""
    APPWRITE_DATABASE_ID: str = "sinod-db"

    # Queue tuning
    MAX_CONCURRENT_CAMPAIGNS: int = 3
    EMAILS_PER_SECOND: float = 5
    SCHEDULER_POLL_INTERVAL_SECONDS: int = 30

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        case_sensitive = True
        extra = "ignore"


settings = Settings()
