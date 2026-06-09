from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager
import os

from config import settings
from routes import email_routes, payment_routes, ai_routes, certificate_routes, report_routes, document_routes, whiteboard_routes, withdrawal_routes, events_routes, documents_routes, whiteboards_routes, chat_routes, auth_routes, storage_routes, presence_routes, notification_routes, websocket_routes, newsletter_routes, contact_messages_routes, form_routes, quiz_routes, campaign_routes, reminder_routes, sitemap_routes, refund_routes
from routes.signup import router as signup_router
from routes.websocket_routes import router as websocket_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce uvicorn access log verbosity
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Sinod' Python Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
    yield
    logger.info("Shutting down Sinod' Python Backend...")


# Initialize FastAPI app
app = FastAPI(
    title="Sinod'",
    description="An event management and collaboration platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# CORS: when credentials=True, origins must be explicit (not "*")
cors_origins = settings.CORS_ORIGINS
if cors_origins == ["*"] or cors_origins == "*":
    # Fallback to explicit origins if wildcard used with credentials
    cors_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3003",
        "https://sinod.app",
        "https://www.sinod.app",
        "https://my.sinod.app",
        "https://sinod-notadmin.onrender.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, tags=["Authentication"])
app.include_router(storage_routes.router, tags=["File Storage"])
app.include_router(presence_routes.router, tags=["Presence"])
app.include_router(notification_routes.router, tags=["Notifications"])
app.include_router(websocket_routes.router, tags=["WebSocket"])  # WebSocket for real-time chat
app.include_router(email_routes.router, prefix="/email", tags=["Email"])
app.include_router(payment_routes.router, prefix="/payment", tags=["Payment"])
app.include_router(withdrawal_routes.router, prefix="/withdrawal", tags=["Withdrawal"])
app.include_router(refund_routes.router, prefix="/refund", tags=["Refund"])
app.include_router(events_routes.router, tags=["Events"])
app.include_router(documents_routes.router, prefix="/api", tags=["Documents"])
app.include_router(whiteboards_routes.router, prefix="/api", tags=["Whiteboards"])
app.include_router(chat_routes.router, prefix="/api", tags=["Chat"])
app.include_router(certificate_routes.router, prefix="/certificate", tags=["Certificate"])
app.include_router(report_routes.router, prefix="/report", tags=["Report"])
app.include_router(newsletter_routes.router, prefix="/newsletter", tags=["Newsletter"])
app.include_router(contact_messages_routes.router, tags=["Contact Messages"])
app.include_router(form_routes.router, prefix="/api", tags=["Forms"])
app.include_router(quiz_routes.router, prefix="/api", tags=["Quizzes"])
app.include_router(campaign_routes.router, prefix="/api", tags=["Campaigns"])
app.include_router(reminder_routes.router, prefix="/api", tags=["Reminders"])
app.include_router(signup_router, prefix="/api")  # New signup route
app.include_router(websocket_router)
app.include_router(sitemap_routes.router, tags=["Sitemap"])

# AI Routes
from routes.ai import router as ai_router
app.include_router(ai_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sinod Python Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "services": {
            "authentication": settings.SECRET_KEY is not None,
            "storage": settings.APPWRITE_ENDPOINT is not None,
            "email": settings.SMTP_HOST is not None,
            "payment": settings.SQUADCO_SECRET_KEY is not None,
            "ai": settings.GEMINI_API_KEY is not None
        }
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
