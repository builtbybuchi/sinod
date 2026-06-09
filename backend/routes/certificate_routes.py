"""
Certificate API routes - Generation, Sending, and Verification
"""

from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
import logging

from models.certificate_models import (
    GenerateCertificateRequest,
    GenerateCertificateResponse,
    SendCertificateRequest,
    SendCertificateResponse,
    SendBulkCertificatesRequest,
    SendBulkCertificatesResponse,
    CertificateResult
)
from services.certificate_service import certificate_service
from services.email_service import email_service
from services.appwrite_service import get_appwrite_service
from appwrite.query import Query

logger = logging.getLogger(__name__)

router = APIRouter()

CERTIFICATES_COLLECTION = "certificates"


@router.post("/generate", response_model=GenerateCertificateResponse)
async def generate_certificate(request: GenerateCertificateRequest):
    """
    Generate a PDF certificate
    """
    try:
        certificate_base64, cert_id = certificate_service.generate_certificate(
            attendee_name=request.attendee_name,
            event_name=request.event_name,
            event_date=request.event_date,
            completion_date=request.completion_date
        )
        
        return GenerateCertificateResponse(
            success=True,
            message="Certificate generated successfully",
            certificate_base64=certificate_base64,
            certificate_id=cert_id
        )
            
    except Exception as e:
        logger.error(f"Error in generate_certificate endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send", response_model=SendCertificateResponse)
async def send_certificate(request: SendCertificateRequest):
    """
    Generate, save to DB, and send a certificate via email
    """
    try:
        appwrite = get_appwrite_service()

        # Prevent duplicate sends for the same attendee & event
        try:
            queries = [
                Query.equal("recipient_email", request.to_email),
            ]
            if request.event_id:
                queries.append(Query.equal("event_id", request.event_id))
            else:
                queries.append(Query.equal("event_name", request.event_name))

            existing = appwrite.list_documents(
                collection_id=CERTIFICATES_COLLECTION,
                queries=queries
            )

            if existing.get("total", 0) > 0:
                return SendCertificateResponse(
                    success=False,
                    message="Certificate already sent to this recipient for this event",
                    error="duplicate"
                )
        except Exception as check_err:
            logger.warning(f"Duplicate check failed, continuing: {check_err}")

        # Generate certificate with unique ID
        certificate_base64, cert_id = certificate_service.generate_certificate(
            attendee_name=request.attendee_name,
            event_name=request.event_name,
            event_date=request.event_date
        )
        
        # Save certificate record to database for future verification
        try:
            appwrite.create_document(
                collection_id=CERTIFICATES_COLLECTION,
                data={
                    "certificate_id": cert_id,
                    "recipient_name": request.attendee_name,
                    "recipient_email": request.to_email,
                    "event_name": request.event_name,
                    "event_date": request.event_date,
                    "issued_at": datetime.now(timezone.utc).isoformat(),
                    "issued_by": "Sinod Platform",
                    "event_id": request.event_id or "",
                }
            )
            logger.info(f"Certificate {cert_id} saved to database")
        except Exception as db_error:
            logger.error(f"Failed to save certificate to DB (continuing anyway): {db_error}")
        
        # Send certificate via email with cert_id
        result = await email_service.send_certificate_email(
            to_email=request.to_email,
            attendee_name=request.attendee_name,
            event_name=request.event_name,
            certificate_base64=certificate_base64,
            certificate_id=cert_id
        )
        
        if result["success"]:
            return SendCertificateResponse(
                success=True,
                message=result["message"],
                email_id=result.get("email_id"),
                certificate_id=cert_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send certificate")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_certificate endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send-bulk", response_model=SendBulkCertificatesResponse)
async def send_bulk_certificates(request: SendBulkCertificatesRequest):
    """
    Generate and send certificates to multiple attendees, saving each to DB
    """
    try:
        results = []
        sent_count = 0
        failed_count = 0
        appwrite = get_appwrite_service()
        
        for attendee in request.attendees:
            try:
                # Skip if already sent to this attendee for this event
                try:
                    queries = [
                        Query.equal("recipient_email", attendee.email),
                    ]
                    if attendee.event_id or request.event_id:
                        queries.append(Query.equal("event_id", attendee.event_id or request.event_id))
                    else:
                        queries.append(Query.equal("event_name", request.event_name))

                    existing = appwrite.list_documents(
                        collection_id=CERTIFICATES_COLLECTION,
                        queries=queries
                    )
                    if existing.get("total", 0) > 0:
                        results.append(CertificateResult(
                            email=attendee.email,
                            success=False,
                            error="Certificate already sent"
                        ))
                        failed_count += 1
                        continue
                except Exception as check_err:
                    logger.warning(f"Duplicate check failed for {attendee.email}: {check_err}")

                # Generate certificate with unique ID
                certificate_base64, cert_id = certificate_service.generate_certificate(
                    attendee_name=attendee.name,
                    event_name=request.event_name,
                    event_date=attendee.event_date
                )
                
                # Save certificate record to database
                try:
                    appwrite.create_document(
                        collection_id=CERTIFICATES_COLLECTION,
                        data={
                            "certificate_id": cert_id,
                            "recipient_name": attendee.name,
                            "recipient_email": attendee.email,
                            "event_name": request.event_name,
                            "event_date": attendee.event_date,
                            "issued_at": datetime.now(timezone.utc).isoformat(),
                            "issued_by": "Sinod Platform",
                            "event_id": attendee.event_id or request.event_id or "",
                        }
                    )
                except Exception as db_error:
                    logger.error(f"Failed to save certificate {cert_id} to DB: {db_error}")
                
                # Send certificate via email with cert_id
                result = await email_service.send_certificate_email(
                    to_email=attendee.email,
                    attendee_name=attendee.name,
                    event_name=request.event_name,
                    certificate_base64=certificate_base64,
                    certificate_id=cert_id
                )
                
                if result["success"]:
                    sent_count += 1
                    results.append(CertificateResult(
                        email=attendee.email,
                        success=True,
                        message=f"Certificate sent (ID: {cert_id})"
                    ))
                else:
                    failed_count += 1
                    results.append(CertificateResult(
                        email=attendee.email,
                        success=False,
                        error=result.get("error", "Failed to send certificate")
                    ))
                    
            except Exception as e:
                failed_count += 1
                results.append(CertificateResult(
                    email=attendee.email,
                    success=False,
                    error=str(e)
                ))
                logger.error(f"Error sending certificate to {attendee.email}: {str(e)}")
        
        return SendBulkCertificatesResponse(
            success=True,
            message=f"Processed {len(request.attendees)} certificates",
            sent_count=sent_count,
            failed_count=failed_count,
            results=results
        )
            
    except Exception as e:
        logger.error(f"Error in send_bulk_certificates endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/verify/{certificate_id}")
async def verify_certificate(certificate_id: str):
    """
    Verify a certificate by its ID. Returns certificate details if found.
    This works even if the event has been deleted since certificate records are stored independently.
    """
    try:
        appwrite = get_appwrite_service()
        result = appwrite.list_documents(
            collection_id=CERTIFICATES_COLLECTION,
            queries=[
                Query.equal("certificate_id", certificate_id)
            ]
        )
        
        documents = result.get('documents', [])
        if not documents:
            return {
                "verified": False,
                "message": "Certificate not found. Please check the certificate ID and try again."
            }
        
        cert = documents[0]
        return {
            "verified": True,
            "message": "Certificate verified successfully",
            "certificate": {
                "certificate_id": cert.get("certificate_id"),
                "recipient_name": cert.get("recipient_name"),
                "recipient_email": cert.get("recipient_email"),
                "event_name": cert.get("event_name"),
                "event_date": cert.get("event_date"),
                "issued_at": cert.get("issued_at"),
                "issued_by": cert.get("issued_by", "Sinod Platform"),
            }
        }
        
    except Exception as e:
        logger.error(f"Error verifying certificate {certificate_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def certificate_health():
    """Check certificate service health"""
    return {
        "service": "certificate",
        "status": "healthy",
        "reportlab_available": True
    }

