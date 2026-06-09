"""
Campaign Email Service for sending bulk newsletter emails.
Uses news@mail.sinod.app as the sender address.
Includes tracking pixel and link wrapping for analytics.
"""

import smtplib
import ssl
import hashlib
import re
import logging
import asyncio
import time
from typing import Dict, Any, Optional
from urllib.parse import urlencode, quote
from concurrent.futures import ThreadPoolExecutor
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr, make_msgid, formatdate

from config import settings

logger = logging.getLogger(__name__)

# SMTP connection timeout in seconds (per attempt - keep short so fallback chain is fast)
SMTP_TIMEOUT = 15
# Max retries for the full connection cycle (each retry tries all ports)
MAX_RETRIES = 1
# Delay between retries in seconds
RETRY_DELAY = 2


class CampaignEmailService:
    """
    Email service specifically for campaign/newsletter emails.
    Sends from news@mail.sinod.app with tracking capabilities.
    """
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.EMAIL_NEWSLETTER_SENDER  # news@mail.sinod.app
        self.password = settings.SMTP_PASSWORD
        self.api_base_url = settings.API_BASE_URL
        self.frontend_url = settings.FRONTEND_URL
        
        # Thread pool for async sending
        self._executor = ThreadPoolExecutor(max_workers=3)
        # Reusable SMTP connection (per thread)
        self._smtp_client = None
    
    def _get_recipient_hash(self, email: str) -> str:
        """Generate MD5 hash for recipient email (for tracking URLs)"""
        return hashlib.md5(email.lower().encode()).hexdigest()

    def _personalize_content(self, content: str, recipient_email: str, recipient_name: str) -> str:
        """
        Replace personalization placeholders in content.
        Supports: {{name}}, {{first_name}}, {{last_name}}, {{email}}
        Falls back to empty string if data is missing.
        """
        name = recipient_name.strip() if recipient_name else ""
        parts = name.split(None, 1)  # Split on first whitespace
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""

        content = content.replace("{{name}}", name)
        content = content.replace("{{first_name}}", first_name)
        content = content.replace("{{last_name}}", last_name)
        content = content.replace("{{email}}", recipient_email or "")
        # Also handle uppercase/mixed case variants
        content = content.replace("{{Name}}", name)
        content = content.replace("{{First_name}}", first_name)
        content = content.replace("{{Last_name}}", last_name)
        content = content.replace("{{Email}}", recipient_email or "")

        return content
    
    def _add_tracking_pixel(
        self, 
        html_content: str, 
        campaign_id: str, 
        recipient_hash: str
    ) -> str:
        """
        Add invisible tracking pixel to email HTML.
        Pixel is a 1x1 transparent GIF that logs when loaded.
        """
        tracking_url = f"{self.api_base_url}/api/campaigns/track/open/{campaign_id}/{recipient_hash}"
        pixel_html = f'<img src="{tracking_url}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />'
        
        # Add pixel just before closing body tag
        if '</body>' in html_content.lower():
            html_content = re.sub(
                r'</body>',
                f'{pixel_html}</body>',
                html_content,
                flags=re.IGNORECASE
            )
        else:
            # If no body tag, append at the end
            html_content += pixel_html
        
        return html_content
    
    def _wrap_links(
        self, 
        html_content: str, 
        campaign_id: str, 
        recipient_hash: str
    ) -> str:
        """
        Wrap all links in email to track clicks.
        Excludes unsubscribe links to avoid double-wrapping.
        """
        def replace_link(match):
            original_url = match.group(1)
            
            # Skip if already a tracking link or unsubscribe link
            if '/track/click/' in original_url or '/unsubscribe/' in original_url:
                return match.group(0)
            
            # Skip mailto and tel links
            if original_url.startswith('mailto:') or original_url.startswith('tel:'):
                return match.group(0)
            
            # Skip anchor links
            if original_url.startswith('#'):
                return match.group(0)
            
            # Create tracking URL - use safe='' to fully encode, 
            # the track/click endpoint handles decoding
            tracking_url = f"{self.api_base_url}/api/campaigns/track/click/{campaign_id}/{recipient_hash}?url={quote(original_url, safe='')}"
            return f'href="{tracking_url}"'
        
        # Match href attributes - handle both double and single quotes
        pattern = r'href="([^"]+)"'
        wrapped_content = re.sub(pattern, replace_link, html_content, flags=re.IGNORECASE)
        
        return wrapped_content
    
    def _add_powered_by_footer(
        self, 
        html_content: str, 
        campaign_id: str,
        list_id: str,
        recipient_email: str
    ) -> str:
        """
        Add non-intrusive "Powered by Sinod'" footer with unsubscribe link.
        Unsubscribe link goes to https://sinod.app/unsubscribe with email pre-filled.
        """
        encoded_email = quote(recipient_email, safe='')
        unsubscribe_url = f"https://sinod.app/unsubscribe?email={encoded_email}"
        
        footer_html = f'''
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #9ca3af;">
                <a href="{unsubscribe_url}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                <a href="https://sinod.app" style="color: #9ca3af; text-decoration: none;" target="_blank">POWERED BY SINOD'</a>
            </p>
        </div>
        '''
        
        # Add footer before closing body tag
        if '</body>' in html_content.lower():
            html_content = re.sub(
                r'</body>',
                f'{footer_html}</body>',
                html_content,
                flags=re.IGNORECASE
            )
        else:
            html_content += footer_html
        
        return html_content
    
    def _prepare_email_content(
        self,
        html_content: str,
        campaign_id: str,
        list_id: str,
        recipient_email: str,
        recipient_name: str = ""
    ) -> str:
        """
        Prepare email content with personalization, tracking and footer.
        Subject personalization is done separately in send_campaign_email.
        """
        recipient_hash = self._get_recipient_hash(recipient_email)
        
        # Personalize content with recipient name/email
        content = self._personalize_content(html_content, recipient_email, recipient_name)
        
        # Add powered by footer with unsubscribe (do this first)
        content = self._add_powered_by_footer(content, campaign_id, list_id, recipient_email)
        
        # Wrap links for click tracking
        content = self._wrap_links(content, campaign_id, recipient_hash)
        
        # Add tracking pixel
        content = self._add_tracking_pixel(content, campaign_id, recipient_hash)
        
        return content
    
    def _get_smtp_connection(self) -> smtplib.SMTP:
        """
        Get a working SMTP connection with automatic port/protocol fallback.
        
        Alibaba Cloud Direct Mail supports:
        - Port 80/25: Plain SMTP (standard, recommended by Alibaba docs)
        - Port 465: Implicit SSL (requires ssl context with set_ciphers for Python 3.10+)
        - Port 587: STARTTLS
        
        Tries configured port first, then all fallbacks. Each attempt has a short
        timeout so the full chain completes quickly even if some ports are blocked.
        """
        # Try to reuse existing connection
        if self._smtp_client:
            try:
                status = self._smtp_client.noop()
                if status[0] == 250:
                    return self._smtp_client
            except Exception:
                try:
                    self._smtp_client.quit()
                except Exception:
                    pass
                self._smtp_client = None
        
        # Build ordered list of connection attempts
        # Priority: configured port first, then Alibaba-recommended plain ports, then secure ports
        attempts = []
        
        # First: whatever is configured
        if self.smtp_port == 465:
            attempts.append(("ssl", 465))
        elif self.smtp_port == 587:
            attempts.append(("tls", 587))
        elif self.smtp_port in (80, 25):
            attempts.append(("plain", self.smtp_port))
        else:
            attempts.append(("plain", self.smtp_port))
        
        # Then: all other options (Alibaba recommends plain 80/25; SSL 465 needs cipher fix)
        for method, port in [("plain", 80), ("plain", 25), ("tls", 587), ("ssl", 465)]:
            if (method, port) not in attempts:
                attempts.append((method, port))
        
        # Create a permissive SSL context for Alibaba Cloud (Python 3.10+ compatibility)
        ssl_context = ssl.create_default_context()
        ssl_context.set_ciphers('DEFAULT')
        
        last_error = None
        for method, port in attempts:
            client = None
            try:
                logger.info(f"SMTP: Trying {method}:{port} -> {self.smtp_host}")
                
                if method == "ssl":
                    client = smtplib.SMTP_SSL(
                        self.smtp_host, port,
                        timeout=SMTP_TIMEOUT,
                        context=ssl_context
                    )
                else:
                    client = smtplib.SMTP(self.smtp_host, port, timeout=SMTP_TIMEOUT)
                    if method == "tls":
                        client.starttls(context=ssl_context)
                
                client.set_debuglevel(0)
                client.login(self.username, self.password)
                
                logger.info(f"SMTP: Connected successfully via {method}:{port}")
                self._smtp_client = client
                return client
                
            except Exception as e:
                last_error = e
                logger.warning(f"SMTP: Failed {method}:{port} - {type(e).__name__}: {e}")
                if client:
                    try:
                        client.quit()
                    except Exception:
                        pass
                continue
        
        raise smtplib.SMTPConnectError(
            0, f"All SMTP connection methods failed. Last error: {last_error}"
        )
    
    def _close_smtp_connection(self):
        """Close the SMTP connection."""
        if self._smtp_client:
            try:
                self._smtp_client.quit()
            except Exception:
                pass
            self._smtp_client = None

    def _send_email_sync(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        sender_name: str,
        reply_to_email: str = "",
        sender_logo_url: str = ""
    ) -> Dict[str, Any]:
        """
        Synchronous email sending using SMTP with retry and connection reuse.
        """
        for attempt in range(MAX_RETRIES + 1):
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = Header(subject, 'utf-8')
                msg['From'] = formataddr([sender_name, self.username])
                msg['To'] = to_email
                msg['Reply-to'] = reply_to_email if reply_to_email else self.username
                msg['Return-Path'] = self.username
                msg['Message-id'] = make_msgid()
                msg['Date'] = formatdate()
                
                # Add List-Unsubscribe header for email clients
                encoded_email = quote(to_email, safe='')
                msg['List-Unsubscribe'] = f'<https://sinod.app/unsubscribe?email={encoded_email}>, <mailto:{self.username}?subject=unsubscribe>'
                
                # Add BIMI header for sender avatar in email clients (Gmail, etc.)
                if sender_logo_url and sender_logo_url.strip():
                    msg['BIMI-Indicator'] = f'<{sender_logo_url.strip()}>'
                    msg['BIMI-Location'] = f'v=BIMI1; l={sender_logo_url.strip()}'
                
                # Build HTML part
                texthtml = MIMEText(html_content, _subtype='html', _charset='UTF-8')
                msg.attach(texthtml)
                
                # Get or create SMTP connection (with auto-fallback)
                client = self._get_smtp_connection()
                client.sendmail(self.username, [to_email], msg.as_string())
                
                logger.info(f"Campaign email sent to {to_email}")
                return {"success": True, "message": "Email sent successfully"}
                
            except (smtplib.SMTPServerDisconnected, smtplib.SMTPConnectError, 
                    ConnectionError, OSError, TimeoutError, ssl.SSLError) as e:
                # Connection-level error - reset connection and retry
                self._close_smtp_connection()
                
                if attempt < MAX_RETRIES:
                    logger.warning(f"SMTP connection error for {to_email} (attempt {attempt+1}/{MAX_RETRIES+1}): {e}. Retrying in {RETRY_DELAY}s...")
                    time.sleep(RETRY_DELAY)
                    continue
                else:
                    error_msg = f"Connection failed after {MAX_RETRIES+1} attempts: {e}"
                    logger.error(f"SMTP error for {to_email}: {error_msg}")
                    return {"success": False, "error": error_msg}
                    
            except smtplib.SMTPAuthenticationError as e:
                error_msg = f"Authentication error: {e.smtp_code} {e.smtp_error}"
                logger.error(f"SMTP auth error for {to_email}: {error_msg}")
                return {"success": False, "error": error_msg}
            except smtplib.SMTPRecipientsRefused as e:
                error_msg = f"Recipient refused: {to_email}"
                logger.error(f"SMTP recipient refused: {error_msg}")
                return {"success": False, "error": error_msg}
            except smtplib.SMTPException as e:
                # Other SMTP errors - reset connection for safety
                self._close_smtp_connection()
                
                if attempt < MAX_RETRIES:
                    logger.warning(f"SMTP error for {to_email} (attempt {attempt+1}): {e}. Retrying...")
                    time.sleep(RETRY_DELAY)
                    continue
                    
                error_msg = f"SMTP error: {str(e)}"
                logger.error(f"SMTP error for {to_email}: {error_msg}")
                return {"success": False, "error": error_msg}
            except Exception as e:
                error_msg = f"Unknown error: {str(e)}"
                logger.error(f"Email send error for {to_email}: {error_msg}")
                return {"success": False, "error": error_msg}
        
        return {"success": False, "error": "Max retries exceeded"}
    
    async def send_campaign_email(
        self,
        campaign_id: str,
        recipient_email: str,
        recipient_name: str,
        subject: str,
        html_content: str,
        sender_name: str,
        list_id: str,
        sender_logo_url: str = "",
        reply_to_email: str = ""
    ) -> Dict[str, Any]:
        """
        Send a single campaign email with tracking.
        
        Args:
            campaign_id: ID of the campaign
            recipient_email: Recipient's email address
            recipient_name: Recipient's name (for personalization if needed)
            subject: Email subject
            html_content: HTML content of the email
            sender_name: Name to show as sender (organization name)
            list_id: Mailing list ID for unsubscribe link
            sender_logo_url: Optional logo URL for BIMI sender avatar in email clients
            reply_to_email: Optional reply-to email address for the campaign
            
        Returns:
            Dict with success status and message/error
        """
        # Personalize subject with recipient name/email
        personalized_subject = self._personalize_content(subject, recipient_email, recipient_name)
        
        # Prepare content with personalization, tracking and footer
        prepared_content = self._prepare_email_content(
            html_content,
            campaign_id,
            list_id,
            recipient_email,
            recipient_name
        )
        
        # Send in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                self._executor,
                self._send_email_sync,
                recipient_email,
                personalized_subject,
                prepared_content,
                sender_name,
                reply_to_email,
                sender_logo_url
            )
        except Exception as e:
            logger.error(f"Executor error sending to {recipient_email}: {e}")
            result = {"success": False, "error": f"Executor error: {str(e)}"}
        
        return result
    
    def close(self):
        """Clean up SMTP connection and thread pool."""
        self._close_smtp_connection()
        self._executor.shutdown(wait=False)
    
    async def send_bulk_campaign(
        self,
        campaign_id: str,
        recipients: list,  # List of {email, name} dicts
        subject: str,
        html_content: str,
        sender_name: str,
        list_id: str,
        sender_logo_url: str = "",
        reply_to_email: str = "",
        batch_size: int = 50,
        delay_between_batches: float = 1.0
    ) -> Dict[str, Any]:
        """
        Send campaign to multiple recipients in batches.
        
        Args:
            campaign_id: ID of the campaign
            recipients: List of recipient dicts with 'email' and 'name' keys
            subject: Email subject
            html_content: HTML content of the email
            sender_name: Name to show as sender
            list_id: Mailing list ID for unsubscribe
            sender_logo_url: Optional logo URL for BIMI sender avatar
            reply_to_email: Optional reply-to email for the campaign
            batch_size: Number of emails to send per batch
            delay_between_batches: Seconds to wait between batches
            
        Returns:
            Dict with success count, failed count, and errors
        """
        sent_count = 0
        failed_count = 0
        errors = []
        
        # Process in batches
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i:i + batch_size]
            
            for recipient in batch:
                result = await self.send_campaign_email(
                    campaign_id=campaign_id,
                    recipient_email=recipient['email'],
                    recipient_name=recipient.get('name', ''),
                    subject=subject,
                    html_content=html_content,
                    sender_name=sender_name,
                    list_id=list_id,
                    sender_logo_url=sender_logo_url,
                    reply_to_email=reply_to_email
                )
                
                if result.get('success'):
                    sent_count += 1
                else:
                    failed_count += 1
                    errors.append({
                        'email': recipient['email'],
                        'error': result.get('error', 'Unknown error')
                    })
            
            # Delay between batches to avoid rate limiting
            if i + batch_size < len(recipients):
                await asyncio.sleep(delay_between_batches)
        
        return {
            'success': True,
            'sent_count': sent_count,
            'failed_count': failed_count,
            'errors': errors[:50]  # Limit errors returned
        }


# Singleton instance
_campaign_email_service = None

def get_campaign_email_service() -> CampaignEmailService:
    """Get or create the campaign email service singleton"""
    global _campaign_email_service
    if _campaign_email_service is None:
        _campaign_email_service = CampaignEmailService()
    return _campaign_email_service
