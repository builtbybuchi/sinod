"""
AI service-related Pydantic models
"""

from pydantic import BaseModel, Field
from typing import Optional


class GenerateCityDescriptionRequest(BaseModel):
    """Request model for generating city description"""
    city_name: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")
    max_words: int = Field(default=150, description="Maximum words for description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "city_name": "Lagos",
                "country": "Nigeria",
                "max_words": 150
            }
        }


class GenerateCityDescriptionResponse(BaseModel):
    """Response model for city description generation"""
    success: bool
    description: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "description": "Lagos is the largest city in Nigeria and one of the fastest-growing cities in the world..."
            }
        }


class GenerateImageRequest(BaseModel):
    """Request model for AI image generation"""
    prompt: str = Field(..., description="Image generation prompt")
    style: Optional[str] = Field(default="realistic", description="Image style")
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A vibrant tech conference in Lagos with diverse attendees",
                "style": "realistic"
            }
        }


class GenerateImageResponse(BaseModel):
    """Response model for image generation"""
    success: bool
    image_url: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "image_url": "https://example.com/generated-image.png"
            }
        }
