"""
Report API routes
"""

from fastapi import APIRouter, HTTPException, status
import logging

from models.report_models import GenerateReportRequest, ReportResponse
from services.report_service import report_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate-and-email", response_model=ReportResponse)
async def generate_and_email_report(request: GenerateReportRequest):
    """
    Generate event analytics report with charts and email to organizer
    
    - **organizer_email**: Email address of the event organizer
    - **organizer_name**: Name of the event organizer
    - **analytics_data**: Complete analytics data including metrics and trends
    """
    try:
        result = await report_service.generate_and_email_report(
            organizer_email=request.organizer_email,
            organizer_name=request.organizer_name,
            analytics_data=request.analytics_data.dict()
        )
        
        if result["success"]:
            return ReportResponse(
                success=True,
                message=result["message"],
                report_id=result.get("report_id"),
                email_id=result.get("email_id")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate and email report")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_and_email_report endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def report_health():
    """Check report service health"""
    return {
        "service": "report",
        "status": "healthy",
        "matplotlib_available": True,  # We'll assume it's available if the service loads
        "email_service_available": True
    }