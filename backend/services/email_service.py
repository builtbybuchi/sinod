"""
Email service implementation using basic SMTP (smtplib)
"""
import smtplib
import ssl
import logging
import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List
# Email modules
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.header import Header
from email.utils import formataddr, make_msgid, formatdate

# 3rd party
import qrcode
from io import BytesIO

# App imports
from config import settings
from services.email_templates import (
    wrap_email_content, 
    create_approval_email_content,
    create_certificate_email_content,
    create_rejection_email_content,
    create_document_invite_content,
    create_whiteboard_invite_content
)

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Settings imported from config which loads from .env
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.reply_to = getattr(settings, 'EMAIL_TRIGGERED_SENDER', '')
        
        self.frontend_url = getattr(settings, 'FRONTEND_URL', "https://sinod.app")
        self.sender_name = "Sinod' "

    def _send_smtp_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        sender_name: str = "Sinod' ",
        attachments: List[Dict[str, Any]] = None,
        inline_images: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Internal function to send email using smtplib based on the working testing-smtp.py sample.
        
        inline_images: list of dicts with keys:
            - content_id: str (the CID to reference in HTML as cid:content_id)
            - data: bytes (raw image bytes)
            - mime_type: str (e.g. 'image/png')
        """
        from email.mime.image import MIMEImage
        
        # Receivers list
        receivers = [to_email]
        
        # If we have inline images, use 'related' wrapping 'alternative'
        # so that CID-referenced images display inline in email clients.
        if inline_images:
            msg = MIMEMultipart('related')
        else:
            msg = MIMEMultipart('alternative')
        
        msg['Subject'] = Header(subject, 'utf-8')
        msg['From'] = formataddr([sender_name, self.username])
        msg['To'] = to_email
        msg['Reply-to'] = self.reply_to
        msg['Return-Path'] = self.username  # Used to receive bounce emails
        msg['Message-id'] = make_msgid()
        msg['Date'] = formatdate()
        
        # Add BIMI header for sender avatar in email clients (Gmail, etc.)
        msg['BIMI-Indicator'] = '<https://www.sinod.app/sinod-logo.png>'
        msg['BIMI-Location'] = 'v=BIMI1; l=https://www.sinod.app/sinod-logo.png'

        if inline_images:
            # Wrap HTML in an alternative sub-part inside the related container
            alt_part = MIMEMultipart('alternative')
            texthtml = MIMEText(html_content, _subtype='html', _charset='UTF-8')
            alt_part.attach(texthtml)
            msg.attach(alt_part)
            
            # Attach each inline image with its Content-ID
            for img in inline_images:
                mime_img = MIMEImage(img['data'], _subtype=img.get('mime_type', 'image/png').split('/')[-1])
                mime_img.add_header('Content-ID', f"<{img['content_id']}>")
                mime_img.add_header('Content-Disposition', 'inline', filename=f"{img['content_id']}.png")
                msg.attach(mime_img)
        else:
            # Build the text/html part
            texthtml = MIMEText(html_content, _subtype='html', _charset='UTF-8')
            msg.attach(texthtml)

        # Attachments if any
        if attachments:
            for attachment in attachments:
                try:
                    part = MIMEApplication(attachment['content'])
                    part.add_header('Content-Disposition', 'attachment', filename=attachment['filename'])
                    msg.attach(part)
                except Exception as e:
                    logger.error(f"Failed to attach file {attachment.get('filename')}: {e}")

        # Send the email with SMTP connection fallback and timeout
        try:
            # Try configured port first, then plain (80/25), then secure (587/465)
            # Alibaba Cloud Direct Mail recommends plain SMTP on port 80/25
            smtp_client = None
            last_error = None
            
            attempts = []
            if self.smtp_port == 465:
                attempts.append(("ssl", 465))
            elif self.smtp_port == 587:
                attempts.append(("tls", 587))
            else:
                attempts.append(("plain", self.smtp_port))
            
            for method, port in [("plain", 80), ("plain", 25), ("tls", 587), ("ssl", 465)]:
                if (method, port) not in attempts:
                    attempts.append((method, port))
            
            # Permissive SSL context for Alibaba Cloud (Python 3.10+ compatibility)
            ssl_context = ssl.create_default_context()
            ssl_context.set_ciphers('DEFAULT')
            
            for method, port in attempts:
                try:
                    if method == "ssl":
                        smtp_client = smtplib.SMTP_SSL(
                            self.smtp_host, port,
                            timeout=15,
                            context=ssl_context
                        )
                    else:
                        smtp_client = smtplib.SMTP(self.smtp_host, port, timeout=15)
                        if method == "tls":
                            smtp_client.starttls(context=ssl_context)
                    
                    smtp_client.set_debuglevel(0)
                    smtp_client.login(self.username, self.password)
                    logger.info(f"SMTP connected via {method}:{port}")
                    break
                except Exception as e:
                    last_error = e
                    logger.warning(f"SMTP {method}:{port} failed: {e}")
                    if smtp_client:
                        try:
                            smtp_client.quit()
                        except Exception:
                            pass
                    smtp_client = None
                    continue
            
            if smtp_client is None:
                error_msg = f"All SMTP connection methods failed. Last error: {last_error}"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            smtp_client.sendmail(self.username, receivers, msg.as_string())
            smtp_client.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return {"success": True, "message": "Email sent successfully"}
            
        except smtplib.SMTPConnectError as e:
            error_msg = f"Failed to send email. Connection failed: {e.smtp_code} {e.smtp_error}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"Failed to send email. Authentication error: {e.smtp_code} {e.smtp_error}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except smtplib.SMTPSenderRefused as e:
            error_msg = f"Failed to send email. Sender refused: {e.smtp_code} {e.smtp_error}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Failed to send email. Recipients refused: {e.smtp_code} {e.smtp_error}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except smtplib.SMTPDataError as e:
            error_msg = f"Failed to send email. Data reception refused: {e.smtp_code} {e.smtp_error}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except smtplib.SMTPException as e:
            error_msg = f"Failed to send email: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Exception occurred while sending email: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

    async def _send_async_wrapper(self, *args, **kwargs):
        """Helper to run blocking SMTP in a thread"""
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, lambda: self._send_smtp_email(*args, **kwargs))

    # --------------------------------------------------------------------------------
    # Public methods called by routes (Construct HTML -> Call _send_async_wrapper)
    # --------------------------------------------------------------------------------

    async def send_registration_email(self, to_email: str, attendee_name: str, event_name: str, 
                                      event_time: str, event_location: str, registration_id: str, 
                                      event_page_url: str, price_paid: float = None, is_paid_event: bool = False):
        try:
            qr_bytes = self.generate_qr_code_bytes(registration_id)
            qr_content_id = "qrcode_registration"
            html_content = self.create_registration_email_html(
                attendee_name, event_name, event_time, event_location, 
                qr_content_id, event_page_url, price_paid, is_paid_event,
                registration_id=registration_id
            )
            return await self._send_async_wrapper(
                to_email=to_email,
                subject=f"Registration Confirmed: {event_name}",
                html_content=html_content,
                sender_name=self.sender_name,
                inline_images=[{
                    'content_id': qr_content_id,
                    'data': qr_bytes,
                    'mime_type': 'image/png'
                }]
            )
        except Exception as e:
            logger.error(f"Error preparing registration email: {e}")
            return {"success": False, "error": str(e)}

    async def send_welcome_email(self, to_email: str, user_name: str):
        try:
            html_content = self.create_welcome_email_html(user_name)
            return await self._send_async_wrapper(
                to_email=to_email,
                subject="Welcome to Sinod'",
                html_content=html_content,
                sender_name=self.sender_name
            )
        except Exception as e:
            logger.error(f"Error preparing welcome email: {e}")
            return {"success": False, "error": str(e)}

    async def send_approval_email(
        self, 
        to_email: str, 
        attendee_name: str, 
        event_title: str, 
        event_date: str,
        event_time: str, 
        event_location: str, 
        registration_id: str, 
        qr_code_url: str = None,
        custom_message: str = None
    ):
        """
        Send approval email with full event details and QR code via CID embedding
        Includes optional custom message from event host
        """
        try:
            # Generate QR code as raw bytes for CID embedding
            qr_bytes = self.generate_qr_code_bytes(registration_id)
            qr_content_id = "qrcode_checkin"
            
            # Build custom message section
            custom_msg_html = ""
            if custom_message:
                custom_msg_html = f"""
                <div style="background: linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.04) 100%); 
                            border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
                        <strong>Message from the event host:</strong><br/>
                        {custom_message}
                    </p>
                </div>
                """
            
            # Use the branded template with CID reference for QR code
            content = f"""
                <h1 class="greeting">Great News, {attendee_name}!</h1>
                <p class="message">
                    Your registration for <span class="highlight">{event_title}</span> has been approved. 
                    We're looking forward to welcoming you!
                </p>
                
                {custom_msg_html}
                
                <div class="card">
                    <div class="card-title">
                        <span>Event Information</span>
                        <span class="badge">Approved</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Event</span>
                        <span class="detail-value">{event_title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">When</span>
                        <span class="detail-value">{event_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Where</span>
                        <span class="detail-value">{event_location or 'See event page'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Registration ID</span>
                        <span class="detail-value" style="font-family: monospace; color: #0ea5e9; letter-spacing: 0.5px;">{registration_id}</span>
                    </div>
                </div>
                
                <div class="qr-container">
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px; font-weight: 500;">
                        Your Check-in QR Code
                    </p>
                    <img src="cid:{qr_content_id}" alt="QR Code" class="qr-code" 
                         style="width: 200px; height: 200px; border-radius: 12px;" />
                    <p style="font-size: 13px; color: #9ca3af; margin-top: 16px;">
                        Present this code at the event entrance for quick check-in
                    </p>
                </div>
                
                <div class="info-box">
                    <p>
                        <strong>Can't scan the QR code?</strong><br>
                        Use your Registration ID at check-in instead: <strong style="font-family: monospace; color: #0ea5e9;">{registration_id}</strong>
                    </p>
                </div>
                
                <div class="info-box">
                    <p>
                        <strong>Next Steps:</strong><br>
                        • Add the event to your calendar<br>
                        • Review the event agenda and materials<br>
                        • Plan your journey to arrive on time
                    </p>
                </div>
                
                <p class="message" style="text-align: center; margin-top: 36px;">
                    See you at the event! 🎉
                </p>
            """
            
            wrapped_content = wrap_email_content(content, unsubscribe_email=to_email)
            
            return await self._send_async_wrapper(
                to_email=to_email, 
                subject=f"✅ Registration Approved: {event_title}", 
                html_content=wrapped_content,
                inline_images=[{
                    'content_id': qr_content_id,
                    'data': qr_bytes,
                    'mime_type': 'image/png'
                }]
            )
        except Exception as e:
            logger.error(f"Error sending approval email: {e}")
            return {"success": False, "error": str(e)}

    async def send_certificate_email(self, to_email: str, attendee_name: str, event_name: str, certificate_base64: str, certificate_id: str = None):
        try:
            cert_bytes = base64.b64decode(certificate_base64)
            safe_event = "".join(c if c.isalnum() else '' for c in event_name)
            filename = f"certificate_{safe_event}.pdf"
            
            # Using current date/time as placeholder for event_date
            import datetime
            today = datetime.date.today().strftime("%B %d, %Y")
            
            html_content = create_certificate_email_content(attendee_name, event_name, today, certificate_id=certificate_id, frontend_url=self.frontend_url)
            attachments = [{"filename": filename, "content": cert_bytes}]
            
            return await self._send_async_wrapper(
                to_email=to_email, 
                subject=f"🎉 Your Certificate: {event_name}", 
                html_content=html_content, 
                attachments=attachments
            )
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_rejection_email(self, to_email: str, attendee_name: str, event_name: str, rejection_reason: str = None):
        html_content = create_rejection_email_content(attendee_name, event_name, rejection_reason)
        return await self._send_async_wrapper(
            to_email=to_email, 
            subject=f"Registration Update - {event_name}", 
            html_content=html_content
        )

    async def send_document_invite_email(self, to_email: str, inviter_name: str, document_title: str, invite_token: str):
        invite_link = f"{self.frontend_url}/documents/invite/{invite_token}"
        html_content = create_document_invite_content(
            invitee_name="", # Not available in call usually
            inviter_name=inviter_name,
            document_name=document_title,
            document_url=invite_link
        )
        return await self._send_async_wrapper(
            to_email=to_email, 
            subject=f"Invite to collaborate: {document_title}", 
            html_content=html_content
        )

    async def send_whiteboard_invite_email(self, to_email: str, inviter_name: str, whiteboard_title: str, invite_token: str):
        invite_link = f"{self.frontend_url}/whiteboards/invite/{invite_token}"
        html_content = create_whiteboard_invite_content(
            invitee_name="",
            inviter_name=inviter_name,
            whiteboard_name=whiteboard_title,
            whiteboard_url=invite_link
        )
        return await self._send_async_wrapper(
            to_email=to_email, 
            subject=f"Invite to collaborate: {whiteboard_title}", 
            html_content=html_content
        )

    # --------------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------------

    def generate_qr_code(self, data: str) -> str:
        """Generate QR code and return as base64 string"""
        qr = qrcode.QRCode(
            version=getattr(settings, 'QR_CODE_VERSION', 1),
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=getattr(settings, 'QR_CODE_BOX_SIZE', 10),
            border=getattr(settings, 'QR_CODE_BORDER', 4),
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    def generate_qr_code_bytes(self, data: str) -> bytes:
        """Generate QR code and return raw PNG bytes (for CID embedding)"""
        qr = qrcode.QRCode(
            version=getattr(settings, 'QR_CODE_VERSION', 1),
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=getattr(settings, 'QR_CODE_BOX_SIZE', 10),
            border=getattr(settings, 'QR_CODE_BORDER', 4),
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return buffered.getvalue()

    def create_registration_email_html(self, attendee_name, event_name, event_time, event_location, qr_code_ref, event_page_url, price_paid, is_paid_event, registration_id=None):
        """
        Build registration confirmation HTML.
        qr_code_ref: either a CID name (used as cid:xxx) or a base64 string.
        """
        price_section = ""
        if is_paid_event and price_paid is not None:
            price_section = f"""
                <div class="detail-row">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value" style="color: #10b981;">₦{price_paid:,.2f}</span>
                </div>
            """
        
        reg_id_section = ""
        if registration_id:
            reg_id_section = f"""
                <div class="detail-row">
                    <span class="detail-label">Registration ID</span>
                    <span class="detail-value" style="font-family: monospace; color: #0ea5e9; letter-spacing: 0.5px;">{registration_id}</span>
                </div>
            """
        
        # Determine image src: if it looks like a CID name (no / or + typical of base64), use cid:
        if qr_code_ref and len(qr_code_ref) < 100 and '/' not in qr_code_ref and '+' not in qr_code_ref:
            qr_img_src = f"cid:{qr_code_ref}"
        else:
            qr_img_src = f"data:image/png;base64,{qr_code_ref}"
        
        content = f"""
            <h1 class="greeting">Welcome, {attendee_name}!</h1>
            <p class="message">
                Your registration has been <span class="highlight">successfully confirmed</span>.
            </p>
            
            <div class="card">
                <div class="card-title">
                    <span>Event Details</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Event Name</span>
                    <span class="detail-value">{event_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date & Time</span>
                    <span class="detail-value">{event_time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">{event_location}</span>
                </div>
                {reg_id_section}
                {price_section}
            </div>
            
            <div class="qr-container">
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px; font-weight: 500;">
                    Your Check-in QR Code
                </p>
                <img src="{qr_img_src}" alt="QR Code" class="qr-code" 
                     style="width: 200px; height: 200px; border-radius: 12px;" />
                <p style="font-size: 13px; color: #9ca3af; margin-top: 12px;">
                    Present this code at the event for quick check-in
                </p>
            </div>
            
            {f'''<div class="info-box">
                <p>
                    <strong>Can't scan the QR code?</strong><br>
                    Use your Registration ID at check-in instead: <strong style="font-family: monospace; color: #0ea5e9;">{registration_id}</strong>
                </p>
            </div>''' if registration_id else ''}
            
            <div style="text-align: center; margin: 36px 0;">
                <a href="{event_page_url}" class="button">View Event Details</a>
            </div>
        """
        return wrap_email_content(content)

    def create_welcome_email_html(self, user_name):
        content = f"""
            <h1 class="greeting">Welcome to Sinod', {user_name}!</h1>
            <p class="message">
                We're absolutely delighted to have you join our community. Your journey to 
                <span class="highlight">flawless event experiences</span> begins here.
            </p>
            <div style="text-align: center; margin: 36px 0;">
                <a href="{self.frontend_url}/dashboard" class="button">
                    Get Started Now
                </a>
            </div>
        """
        return wrap_email_content(content)

# Initialize service instance
email_service = EmailService()

# Standalone helper functions for common operations
async def send_approval_email(
    to_email: str,
    attendee_name: str,
    event_title: str,
    event_date: str,
    event_time: str,
    event_location: str,
    registration_id: str,
    qr_code_url: str = None,
    custom_message: str = None
):
    """Standalone function to send approval email"""
    return await email_service.send_approval_email(
        to_email=to_email,
        attendee_name=attendee_name,
        event_title=event_title,
        event_date=event_date,
        event_time=event_time,
        event_location=event_location,
        registration_id=registration_id,
        qr_code_url=qr_code_url,
        custom_message=custom_message
    )

async def send_pending_approval_email(
    to_email: str,
    attendee_name: str,
    event_title: str
):
    """Send email informing user their registration is pending approval"""
    html_content = f"""
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); 
                    padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏳ Registration Pending Approval</h1>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #333; margin-bottom: 16px;">
                Hi <strong>{attendee_name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
                Thank you for registering for <strong>{event_title}</strong>!
            </p>
            
            <div style="background: #fff3e0; border-left: 4px solid #ffa726; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="font-size: 16px; color: #e65100; margin: 0;">
                    <strong>⏳ Awaiting Approval</strong><br/>
                    Your registration is currently under review by the event organizer. 
                    You will receive another email with full event details and your QR code once your registration is approved.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #888; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
                This usually takes 24-48 hours. Thank you for your patience!
            </p>
        </div>
    </div>
    """
    
    wrapped_content = wrap_email_content(html_content)
    
    return await email_service._send_async_wrapper(
        to_email=to_email,
        subject=f"⏳ Registration Pending: {event_title}",
        html_content=wrapped_content
    )
