"""
Pydantic models for certificate-related requests and responses
"""

from pydantic import BaseModel, EmailStr
from typing import List, Optional


class GenerateCertificateRequest(BaseModel):
    """Request model for generating a certificate"""
    attendee_name: str
    event_name: str
    event_date: str
    completion_date: Optional[str] = None


class GenerateCertificateResponse(BaseModel):
    """Response model for certificate generation"""
    success: bool
    message: str
    certificate_base64: Optional[str] = None
    certificate_id: Optional[str] = None
    error: Optional[str] = None


class SendCertificateRequest(BaseModel):
    """Request model for sending a single certificate"""
    to_email: EmailStr
    attendee_name: str
    event_name: str
    event_date: str
    event_id: Optional[str] = None


class SendCertificateResponse(BaseModel):
    """Response model for sending certificate"""
    success: bool
    message: str
    email_id: Optional[str] = None
    certificate_id: Optional[str] = None
    error: Optional[str] = None


class AttendeeForCertificate(BaseModel):
    """Model for attendee in bulk certificate sending"""
    email: EmailStr
    name: str
    event_date: str
    event_id: Optional[str] = None


class SendBulkCertificatesRequest(BaseModel):
    """Request model for sending multiple certificates"""
    event_name: str
    attendees: List[AttendeeForCertificate]
    event_id: Optional[str] = None


class CertificateResult(BaseModel):
    """Result for individual certificate in bulk send"""
    email: str
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


class SendBulkCertificatesResponse(BaseModel):
    """Response model for bulk certificate sending"""
    success: bool
    message: str
    sent_count: int
    failed_count: int
    results: List[CertificateResult]

