"""
Email sending service for the newsletter microservice.
Ported from backend/services/campaign_email_service.py with
SMTP connection reuse, fallback, and retry logic.
"""

import smtplib
import ssl
import hashlib
import re
import logging
import time
from typing import Dict, Any
from urllib.parse import quote
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr, make_msgid, formatdate

from src.config import settings

logger = logging.getLogger(__name__)

# SMTP connection timeout per attempt (seconds)
SMTP_TIMEOUT = 15
# Max retries for the full connection cycle
MAX_RETRIES = 1
# Delay between retries (seconds)
RETRY_DELAY = 2


class EmailService:
    """
    Handles SMTP email sending with connection reuse, port fallback,
    tracking pixel injection, link wrapping, and personalization.
    """

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.EMAIL_NEWSLETTER_SENDER
        self.password = settings.SMTP_PASSWORD
        self.main_backend_url = settings.MAIN_BACKEND_URL
        self.frontend_url = settings.FRONTEND_URL

        self._smtp_client = None

    # ------------------------------------------------------------------
    # Content preparation
    # ------------------------------------------------------------------

    def _get_recipient_hash(self, email: str) -> str:
        return hashlib.md5(email.lower().encode()).hexdigest()

    def _personalize_content(self, content: str, email: str, name: str) -> str:
        name = name.strip() if name else ""
        parts = name.split(None, 1)
        first = parts[0] if parts else ""
        last = parts[1] if len(parts) > 1 else ""

        for src, val in [
            ("{{name}}", name), ("{{Name}}", name),
            ("{{first_name}}", first), ("{{First_name}}", first),
            ("{{last_name}}", last), ("{{Last_name}}", last),
            ("{{email}}", email or ""), ("{{Email}}", email or ""),
        ]:
            content = content.replace(src, val)
        return content

    def _add_tracking_pixel(self, html: str, campaign_id: str, rhash: str) -> str:
        url = f"{self.main_backend_url}/api/campaigns/track/open/{campaign_id}/{rhash}"
        pixel = f'<img src="{url}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />'
        if "</body>" in html.lower():
            return re.sub(r"</body>", f"{pixel}</body>", html, flags=re.IGNORECASE)
        return html + pixel

    def _wrap_links(self, html: str, campaign_id: str, rhash: str) -> str:
        def _replace(m):
            orig = m.group(1)
            if any(s in orig for s in ["/track/click/", "/unsubscribe/"]):
                return m.group(0)
            if orig.startswith(("mailto:", "tel:", "#")):
                return m.group(0)
            t = f"{self.main_backend_url}/api/campaigns/track/click/{campaign_id}/{rhash}?url={quote(orig, safe='')}"
            return f'href="{t}"'
        return re.sub(r'href="([^"]+)"', _replace, html, flags=re.IGNORECASE)

    def _add_footer(self, html: str, campaign_id: str, list_id: str, email: str) -> str:
        unsub = f"https://sinod.app/unsubscribe?email={quote(email, safe='')}"
        footer = f'''
        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e5e5;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;">
                <a href="{unsub}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="margin:0;font-size:11px;color:#9ca3af;">
                <a href="https://sinod.app" style="color:#9ca3af;text-decoration:none;" target="_blank">POWERED BY SINOD'</a>
            </p>
        </div>'''
        if "</body>" in html.lower():
            return re.sub(r"</body>", f"{footer}</body>", html, flags=re.IGNORECASE)
        return html + footer

    def prepare_email(
        self,
        html: str,
        campaign_id: str,
        list_id: str,
        email: str,
        name: str = "",
    ) -> str:
        """Prepare email body: personalize → footer → link-wrap → pixel."""
        content = self._personalize_content(html, email, name)
        content = self._add_footer(content, campaign_id, list_id, email)
        rhash = self._get_recipient_hash(email)
        content = self._wrap_links(content, campaign_id, rhash)
        content = self._add_tracking_pixel(content, campaign_id, rhash)
        return content

    # ------------------------------------------------------------------
    # SMTP connection management
    # ------------------------------------------------------------------

    def get_smtp_connection(self) -> smtplib.SMTP:
        """
        Get a working SMTP connection with automatic port/protocol fallback.

        Alibaba Cloud Direct Mail supports:
        - Port 80/25  – plain SMTP (recommended)
        - Port 465    – implicit SSL (needs cipher fix for Python 3.10+)
        - Port 587    – STARTTLS
        """
        if self._smtp_client:
            try:
                if self._smtp_client.noop()[0] == 250:
                    return self._smtp_client
            except Exception:
                self._close()

        attempts = []
        if self.smtp_port == 465:
            attempts.append(("ssl", 465))
        elif self.smtp_port == 587:
            attempts.append(("tls", 587))
        elif self.smtp_port in (80, 25):
            attempts.append(("plain", self.smtp_port))
        else:
            attempts.append(("plain", self.smtp_port))

        for method, port in [("plain", 80), ("plain", 25), ("tls", 587), ("ssl", 465)]:
            if (method, port) not in attempts:
                attempts.append((method, port))

        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT")

        last_err = None
        for method, port in attempts:
            client = None
            try:
                logger.info(f"SMTP: trying {method}:{port} -> {self.smtp_host}")
                if method == "ssl":
                    client = smtplib.SMTP_SSL(self.smtp_host, port, timeout=SMTP_TIMEOUT, context=ctx)
                else:
                    client = smtplib.SMTP(self.smtp_host, port, timeout=SMTP_TIMEOUT)
                    if method == "tls":
                        client.starttls(context=ctx)
                client.set_debuglevel(0)
                client.login(self.username, self.password)
                logger.info(f"SMTP: connected via {method}:{port}")
                self._smtp_client = client
                return client
            except Exception as e:
                last_err = e
                logger.warning(f"SMTP: {method}:{port} failed – {type(e).__name__}: {e}")
                if client:
                    try:
                        client.quit()
                    except Exception:
                        pass
        raise smtplib.SMTPConnectError(0, f"All SMTP methods failed. Last: {last_err}")

    def _close(self):
        if self._smtp_client:
            try:
                self._smtp_client.quit()
            except Exception:
                pass
            self._smtp_client = None

    def close(self):
        """Public shutdown."""
        self._close()

    # ------------------------------------------------------------------
    # Send a single email (synchronous – called from worker thread)
    # ------------------------------------------------------------------

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        sender_name: str,
        reply_to_email: str = "",
        sender_logo_url: str = "",
    ) -> Dict[str, Any]:
        """Send one email with retry + connection reuse."""
        for attempt in range(MAX_RETRIES + 1):
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = Header(subject, "utf-8")
                msg["From"] = formataddr([sender_name, self.username])
                msg["To"] = to_email
                msg["Reply-to"] = reply_to_email or self.username
                msg["Return-Path"] = self.username
                msg["Message-id"] = make_msgid()
                msg["Date"] = formatdate()

                enc = quote(to_email, safe="")
                msg["List-Unsubscribe"] = (
                    f"<https://sinod.app/unsubscribe?email={enc}>, "
                    f"<mailto:{self.username}?subject=unsubscribe>"
                )

                if sender_logo_url and sender_logo_url.strip():
                    msg["BIMI-Indicator"] = f"<{sender_logo_url.strip()}>"
                    msg["BIMI-Location"] = f"v=BIMI1; l={sender_logo_url.strip()}"

                msg.attach(MIMEText(html_content, _subtype="html", _charset="UTF-8"))

                client = self.get_smtp_connection()
                client.sendmail(self.username, [to_email], msg.as_string())

                logger.info(f"Sent to {to_email}")
                return {"success": True}

            except (
                smtplib.SMTPServerDisconnected,
                smtplib.SMTPConnectError,
                ConnectionError,
                OSError,
                TimeoutError,
                ssl.SSLError,
            ) as e:
                self._close()
                if attempt < MAX_RETRIES:
                    logger.warning(f"Retry {attempt+1} for {to_email}: {e}")
                    time.sleep(RETRY_DELAY)
                    continue
                return {"success": False, "error": f"Connection failed: {e}"}

            except smtplib.SMTPAuthenticationError as e:
                return {"success": False, "error": f"Auth error: {e.smtp_code}"}

            except smtplib.SMTPRecipientsRefused:
                return {"success": False, "error": f"Recipient refused: {to_email}"}

            except smtplib.SMTPException as e:
                self._close()
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                    continue
                return {"success": False, "error": f"SMTP error: {e}"}

            except Exception as e:
                return {"success": False, "error": str(e)}

        return {"success": False, "error": "Max retries exceeded"}
