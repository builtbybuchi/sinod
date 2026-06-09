"""
Sinod Newsletter Microservice
=============================
Standalone email-sending service with async job queue and scheduler.

Architecture:
- FastAPI app for HTTP API
- In-memory async queue with configurable worker count
- Scheduler polls Appwrite for due scheduled campaigns
- SMTP sending with connection reuse and port fallback
- Updates Appwrite (recipients, campaigns, analytics) directly

Local:  http://localhost:8002
Prod:   https://newsletter.sinod.app
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.api.router import health_router, campaign_router
from src.services.queue_manager import queue_manager
from src.services.scheduler_service import scheduler
from src.services.reminder_service import reminder_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Reduce noisy loggers
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start queue workers, scheduler, and reminder service on startup."""
    logger.info("Starting Newsletter Microservice...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Main backend: {settings.MAIN_BACKEND_URL}")
    logger.info(f"SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}")

    await queue_manager.start()
    await scheduler.start()
    await reminder_service.start()

    yield

    logger.info("Shutting down Newsletter Microservice...")
    await reminder_service.stop()
    await scheduler.stop()
    await queue_manager.shutdown()


app = FastAPI(
    title="Sinod Newsletter Service",
    description="Microservice for queued newsletter/campaign email sending",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow main backend and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8001",
        "https://sinod.app",
        "https://www.sinod.app",
        "https://my.sinod.app",
        "https://sinod.leapcell.app",
        "https://newsletter.sinod.app",
        "https://sinod-notadmin.onrender.com",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(campaign_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
