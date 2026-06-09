"""
Email service implementation using basic SMTP (smtplib)
"""
import smtplib
import logging
import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional
from io import BytesIO

# Email modules
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.header import Header
from email.utils import formataddr, make_msgid, formatdate

# 3rd party
import qrcode

# App imports
from config import settings
from services.email_templates import wrap_email_content

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Settings
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.reply_to = settings.EMAIL_TRIGGERED_SENDER
        
        self.frontend_url = getattr(settings, 'FRONTEND_URL', "https://sinod.app")
        self.sender_name = "Sinod"

    def _send_smtp_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        sender_name: str = "Sinod",
        attachments: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Internal function to send email using smtplib based on the provided sample.
        """
        # Receivers list
        receivers = [to_email]
        
        # Build the alternative structure.
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header(subject, 'utf-8')
        msg['From'] = formataddr([sender_name, self.username])
        msg['To'] = to_email
        msg['Reply-to'] = self.reply_to
        msg['Message-id'] = make_msgid()
        msg['Date'] = formatdate()

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

        # Send the email
        try:
            # Determine connection type based on port
            if self.smtp_port == 465:
                # SSL connection
                client = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            else:
                # Standard connection (likely port 25 or 80)
                client = smtplib.SMTP(self.smtp_host, self.smtp_port)
            
            # Debug level
            client.set_debuglevel(0)
            
            # Login
            client.login(self.username, self.password)
            
            # Send
            client.sendmail(self.username, receivers, msg.as_string())
            client.quit()
            
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
            qr_code_base64 = self.generate_qr_code(registration_id)
            html_content = self.create_registration_email_html(
                attendee_name, event_name, event_time, event_location, 
                qr_code_base64, event_page_url, price_paid, is_paid_event
            )
            return await self._send_async_wrapper(
                to_email=to_email,
                subject=f"Registration Confirmed: {event_name}",
                html_content=html_content,
                sender_name=self.sender_name
            )
        except Exception as e:
            logger.error(f"Error preparing registration email: {e}")
            return {"success": False, "error": str(e)}

    async def send_welcome_email(self, to_email: str, user_name: str):
        try:
            html_content = self.create_welcome_email_html(user_name)
            return await self._send_async_wrapper(
                to_email=to_email,
                subject="Welcome to Sinod",
                html_content=html_content,
                sender_name=self.sender_name
            )
        except Exception as e:
            logger.error(f"Error preparing welcome email: {e}")
            return {"success": False, "error": str(e)}

    async def send_approval_email(self, to_email: str, attendee_name: str, event_name: str, 
                                  event_time: str, event_location: str, registration_id: str, event_page_url: str):
        try:
            qr_code_base64 = self.generate_qr_code(registration_id)
            html_content = f"""
            <!DOCTYPE html>
            <html><body>
                <h1>✅ Registration Approved!</h1>
                <p>Great news, {attendee_name}!</p>
                <p>Your registration for <strong>{event_name}</strong> has been approved.</p>
                <div style="text-align: center;"><img src="data:image/png;base64,{qr_code_base64}" style="max-width: 250px;"></div>
            </body></html>
            """
            return await self._send_async_wrapper(to_email=to_email, subject=f"✅ Registration Approved: {event_name}", html_content=html_content)
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_certificate_email(self, to_email: str, attendee_name: str, event_name: str, certificate_base64: str):
        try:
            cert_bytes = base64.b64decode(certificate_base64)
            safe_event = "".join(c if c.isalnum() else '' for c in event_name)
            filename = f"certificate_{safe_event}.pdf"
            html_content = f"""<!DOCTYPE html><html><body><h1>🎉 Congratulations!</h1><p>Hello {attendee_name},</p><p>Thank you for attending <strong>{event_name}</strong>. Your certificate is attached.</p></body></html>"""
            attachments = [{"filename": filename, "content": cert_bytes}]
            return await self._send_async_wrapper(to_email=to_email, subject=f"🎉 Your Certificate: {event_name}", html_content=html_content, attachments=attachments)
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_rejection_email(self, to_email: str, attendee_name: str, event_name: str, rejection_reason: str = None):
        reason = rejection_reason or "The event host has reviewed your registration and decided not to approve it at this time."
        html_content = f"<!DOCTYPE html><html><body><h1>❌ Registration Not Approved</h1><p>Hi {attendee_name},</p><p>Registration for <strong>{event_name}</strong> has not been approved.</p><p>Reason: {reason}</p></body></html>"
        return await self._send_async_wrapper(to_email=to_email, subject=f"Registration Not Approved - {event_name}", html_content=html_content)

    async def send_document_invite_email(self, to_email: str, inviter_name: str, document_title: str, invite_token: str):
        link = f"{self.frontend_url}/documents/invite/{invite_token}"
        html_content = f"<!DOCTYPE html><html><body><h1>📄 Document Info</h1><p>{inviter_name} invited you to collaborate on '{document_title}'.</p><a href='{link}'>Accept Invitation</a></body></html>"
        return await self._send_async_wrapper(to_email=to_email, subject=f"Invite: {document_title}", html_content=html_content)

    async def send_whiteboard_invite_email(self, to_email: str, inviter_name: str, whiteboard_title: str, invite_token: str):
        link = f"{self.frontend_url}/whiteboards/invite/{invite_token}"
        html_content = f"<!DOCTYPE html><html><body><h1>🎨 Whiteboard Invite</h1><p>{inviter_name} invited you to collaborate on '{whiteboard_title}'.</p><a href='{link}'>Accept Invitation</a></body></html>"
        return await self._send_async_wrapper(to_email=to_email, subject=f"Invite: {whiteboard_title}", html_content=html_content)

    # --------------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------------

    def generate_qr_code(self, data: str) -> str:
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

    def create_registration_email_html(self, attendee_name, event_name, event_time, event_location, qr_code_base64, event_page_url, price_paid, is_paid_event):
        # Brief implementation to keep file size small but functional
        price_html = ""
        if is_paid_event:
            price_html = f"<p>Price Paid: ₦{price_paid:,.2f}</p>" if price_paid else "<p>Status: Pending Payment</p>"
        
        content = f"""
            <h1>Welcome, {attendee_name}!</h1>
            <p>Your registration for {event_name} is confirmed.</p>
            <p><strong>Time:</strong> {event_time}<br><strong>Location:</strong> {event_location}</p>
            {price_html}
            <div style="margin: 20px 0;"><img src="data:image/png;base64,{qr_code_base64}" alt="Check-in QR"></div>
            <p><a href="{event_page_url}">View Event</a></p>
        """
        return wrap_email_content(content)

    def create_welcome_email_html(self, user_name):
        content = f"""
            <h1>Welcome to Sinod, {user_name}!</h1>
            <p>We're delighted to have you.</p>
            <p><a href="{self.frontend_url}/dashboard">Go to Dashboard</a></p>
        """
        return wrap_email_content(content)

email_service = EmailService()
