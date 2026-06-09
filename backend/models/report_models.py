"""
Report-related Pydantic models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional


class EventAnalyticsData(BaseModel):
    """Analytics data for report generation"""
    totalRegistrations: int = Field(..., description="Total number of registrations")
    approvedAttendees: int = Field(..., description="Number of approved attendees")
    attendedCount: int = Field(..., description="Number of attendees who checked in")
    registrationTrend: List[Dict[str, Any]] = Field(..., description="Registration trend data over time")
    eventName: str = Field(..., description="Name of the event")
    eventDate: str = Field(..., description="Date of the event")
    eventLocation: str = Field(..., description="Location of the event")


class GenerateReportRequest(BaseModel):
    """Request model for generating and emailing a report"""
    organizer_email: EmailStr = Field(..., description="Email address of the event organizer")
    organizer_name: str = Field(..., description="Name of the event organizer")
    analytics_data: EventAnalyticsData = Field(..., description="Analytics data for the report")

    class Config:
        json_schema_extra = {
            "example": {
                "organizer_email": "organizer@example.com",
                "organizer_name": "John Doe",
                "analytics_data": {
                    "totalRegistrations": 150,
                    "approvedAttendees": 120,
                    "attendedCount": 95,
                    "registrationTrend": [
                        {"date": "2024-01-01", "count": 10},
                        {"date": "2024-01-02", "count": 25}
                    ],
                    "eventName": "Tech Conference 2024",
                    "eventDate": "2024-03-15",
                    "eventLocation": "Lagos Convention Center"
                }
            }
        }


class ReportResponse(BaseModel):
    """Response model for report generation operations"""
    success: bool
    message: str
    report_id: Optional[str] = None
    email_id: Optional[str] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Report generated and emailed successfully",
                "report_id": "report_abc123",
                "email_id": "re_abc123xyz"
            }
        }