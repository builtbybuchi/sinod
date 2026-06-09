"""
AI API routes
"""

from fastapi import APIRouter, HTTPException, status
import logging

from models.ai_models import (
    GenerateCityDescriptionRequest,
    GenerateCityDescriptionResponse,
    GenerateImageRequest,
    GenerateImageResponse
)
from services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/city-description", response_model=GenerateCityDescriptionResponse)
async def generate_city_description(request: GenerateCityDescriptionRequest):
    """
    Generate a descriptive text about a city using AI
    
    - **city_name**: Name of the city
    - **country**: Country name
    - **max_words**: Maximum words for description (default: 150)
    """
    try:
        result = await ai_service.generate_city_description(
            city_name=request.city_name,
            country=request.country,
            max_words=request.max_words
        )
        
        if result["success"]:
            return GenerateCityDescriptionResponse(
                success=True,
                description=result.get("description")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate city description")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_city_description endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/generate-image", response_model=GenerateImageResponse)
async def generate_image(request: GenerateImageRequest):
    """
    Generate enhanced image prompt using AI
    Note: Returns enhanced prompt, not actual image
    
    - **prompt**: Original image generation prompt
    - **style**: Desired image style (default: realistic)
    """
    try:
        result = await ai_service.generate_image_prompt(
            prompt=request.prompt,
            style=request.style or "realistic"
        )
        
        if result["success"]:
            return GenerateImageResponse(
                success=True,
                image_url=result.get("enhanced_prompt")  # Using image_url field for enhanced prompt
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate image prompt")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_image endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def ai_health():
    """Check AI service health"""
    return {
        "service": "ai",
        "status": "healthy",
        "gemini_configured": ai_service.api_key is not None
    }
