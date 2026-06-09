import httpx
import logging
from typing import Dict, Any

from config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI operations using Google Gemini"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    async def generate_city_description(
        self,
        city_name: str,
        country: str,
        max_words: int = 150
    ) -> Dict[str, Any]:
        """
        Generate a descriptive text about a city
        
        Args:
            city_name: Name of the city
            country: Country name
            max_words: Maximum words for description
            
        Returns:
            Dictionary with generated description or error
        """
        try:
            prompt = f"""Write a compelling and informative description about {city_name}, {country} 
            that would be useful for event attendees visiting the city. Include interesting facts, 
            cultural highlights, and what makes it special. Keep it to around {max_words} words. 
            Make it engaging and welcoming."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}",
                    headers={
                        "Content-Type": "application/json"
                    },
                    json={
                        "contents": [{
                            "parts": [{
                                "text": prompt
                            }]
                        }]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract generated text
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts", [])
                        if parts and len(parts) > 0:
                            description = parts[0].get("text", "").strip()
                            
                            logger.info(f"Generated description for {city_name}, {country}")
                            
                            return {
                                "success": True,
                                "description": description
                            }
                    
                    error_msg = "No content generated"
                    logger.error(f"Gemini API error: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg
                    }
                else:
                    error_msg = f"Gemini API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"Error generating city description: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def generate_image_prompt(
        self,
        prompt: str,
        style: str = "realistic"
    ) -> Dict[str, Any]:
        """
        Generate an enhanced image prompt using AI
        Note: Gemini doesn't directly generate images, but can enhance prompts
        
        Args:
            prompt: Original image prompt
            style: Desired style
            
        Returns:
            Dictionary with enhanced prompt or error
        """
        try:
            enhancement_prompt = f"""Enhance this image generation prompt to be more detailed and vivid 
            for a {style} style. Original prompt: "{prompt}". 
            Return only the enhanced prompt, nothing else."""
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}",
                    headers={
                        "Content-Type": "application/json"
                    },
                    json={
                        "contents": [{
                            "parts": [{
                                "text": enhancement_prompt
                            }]
                        }]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts", [])
                        if parts and len(parts) > 0:
                            enhanced_prompt = parts[0].get("text", "").strip()
                            
                            logger.info(f"Generated enhanced image prompt")
                            
                            return {
                                "success": True,
                                "enhanced_prompt": enhanced_prompt
                            }
                    
                    error_msg = "No content generated"
                    logger.error(f"Gemini API error: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg
                    }
                else:
                    error_msg = f"Gemini API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"Error generating image prompt: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }


# Singleton instance
ai_service = AIService()
