from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import logging

from services.auth_service import auth_service
from services.email_service import email_service

from models.auth_models import UserCreate

router = APIRouter()
logger = logging.getLogger("routes.signup")


class SignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest):
    """Create a new user: 1) create auth user, 2) create DB record, 3) send welcome email.

    This endpoint does best-effort on non-critical steps (DB write, email). The critical
    step is creating the auth user; if that fails we return a 400/500 accordingly.
    """
    logger.info("Received signup request: %s", request.dict())

    # Basic validation (password length enforced by UserCreate pydantic model)
    try:
        user_create = UserCreate(
            email=request.email,
            name=f"{request.first_name} {request.last_name}",
            password=request.password,
        )
    except Exception as e:
        logger.warning("Validation error creating UserCreate model: %s", str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Check if user already exists
    try:
        existing = await auth_service.get_user_by_email(request.email)
        if existing:
            logger.info("Signup attempted for existing email: %s", request.email)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with that email already exists")
    except HTTPException:
        raise
    except Exception as e:
        # Non-fatal: log and continue (get_user_by_email might fail if DB misconfigured)
        logger.warning("Error checking existing user: %s", str(e))

    # Create auth user (critical)
    try:
        auth_result = await auth_service.create_user(user_create)
        logger.info("Auth user created: %s", getattr(auth_result.user, 'id', None))
    except Exception as e:
        logger.error("Failed to create auth user: %s", str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create user: {str(e)}")

    # Create DB record for the unique id (best-effort)
    unique_id = None
    try:
        from services.database_service import create_user_record

        unique_id = await create_user_record(
            first_name=request.first_name,
            last_name=request.last_name,
            email=request.email,
            password=request.password,
        )
        logger.info("Created user DB record, unique_id=%s", unique_id)
    except Exception as e:
        logger.warning("Failed to create user DB record (non-fatal): %s", str(e), exc_info=True)

    # Send welcome email (best-effort)
    try:
        await email_service.send_welcome_email(
            to_email=request.email,
            user_name=f"{request.first_name} {request.last_name}"
        )
        logger.info("Welcome email queued/sent to %s", request.email)
    except Exception as e:
        logger.warning("Failed to send welcome email (non-fatal): %s", str(e), exc_info=True)

    # Return structured response
    return {
        "success": True,
        "user": auth_result.user.dict() if hasattr(auth_result.user, 'dict') else auth_result.user,
        "token": auth_result.token,
        "expires_at": auth_result.expires_at,
        "unique_id": unique_id,
    }