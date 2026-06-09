"""
Certificate generation service using ReportLab
"""

import base64
import hashlib
import uuid
from io import BytesIO
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)


class CertificateService:
    """Service for generating PDF certificates with modern Sinod branding"""
    
    def __init__(self):
        # Certificate dimensions (landscape letter)
        self.width, self.height = landscape(letter)
        
        # Brand colors - Sky blue gradient theme
        self.sky_500 = HexColor('#0ea5e9')      # Primary sky blue
        self.blue_600 = HexColor('#2563eb')     # Darker blue
        self.sky_400 = HexColor('#38bdf8')      # Lighter sky
        self.blue_700 = HexColor('#1d4ed8')     # Deep blue
        self.gray_900 = HexColor('#111827')     # Dark text
        self.gray_700 = HexColor('#374151')     # Medium gray
        self.gray_300 = HexColor('#d1d5db')     # Light gray
        self.white = HexColor('#ffffff')        # White
    
    @staticmethod
    def generate_certificate_id(attendee_name: str, event_name: str) -> str:
        """
        Generate a short, unique, deterministic certificate ID.
        Format: CERT-XXXXXXXX (8-char hex based on UUID + name/event hash)
        """
        unique_seed = f"{attendee_name}|{event_name}|{uuid.uuid4().hex[:8]}"
        hash_digest = hashlib.sha256(unique_seed.encode()).hexdigest()[:8].upper()
        return f"CERT-{hash_digest}"
        
    def _draw_gradient_background(self, c, width, height):
        """Draw a subtle gradient background"""
        # Create gradient effect with overlapping rectangles
        steps = 50
        for i in range(steps):
            alpha = 0.02 + (i / steps) * 0.03
            y = height - (i * height / steps)
            c.setFillColor(self.sky_500)
            c.setFillAlpha(alpha)
            c.rect(0, y, width, height/steps, stroke=0, fill=1)
        c.setFillAlpha(1)  # Reset alpha
        
    def _draw_decorative_corner(self, c, x, y, size, flip_x=False, flip_y=False):
        """Draw decorative corner flourish"""
        c.saveState()
        c.translate(x, y)
        if flip_x:
            c.scale(-1, 1)
        if flip_y:
            c.scale(1, -1)
            
        # Draw curved corner design
        c.setStrokeColor(self.sky_500)
        c.setLineWidth(2)
        c.setLineCap(1)  # Round cap
        
        # Outer arc
        path = c.beginPath()
        path.moveTo(0, size)
        path.curveTo(0, size*0.6, size*0.6, 0, size, 0)
        c.drawPath(path, stroke=1, fill=0)
        
        # Inner arc
        c.setStrokeColor(self.sky_400)
        c.setLineWidth(1)
        path = c.beginPath()
        path.moveTo(0, size*0.7)
        path.curveTo(0, size*0.45, size*0.45, 0, size*0.7, 0)
        c.drawPath(path, stroke=1, fill=0)
        
        c.restoreState()
        
    def generate_certificate(
        self,
        attendee_name: str,
        event_name: str,
        event_date: str,
        completion_date: str = None,
        certificate_id: str = None
    ) -> tuple:
        """
        Generate a modern, branded certificate PDF and return as base64 string
        
        Args:
            attendee_name: Full name of the attendee
            event_name: Name of the event
            event_date: Date of the event
            completion_date: Date of certificate generation (defaults to today)
            certificate_id: Optional pre-generated certificate ID
            
        Returns:
            Tuple of (base64 encoded PDF certificate, certificate_id)
        """
        try:
            # Generate or use provided certificate ID
            cert_id = certificate_id or self.generate_certificate_id(attendee_name, event_name)
            
            # Create PDF in memory
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=landscape(letter))
            
            width, height = landscape(letter)
            
            # === Background ===
            # Subtle gradient background
            self._draw_gradient_background(c, width, height)
            
            # === Decorative Corners ===
            corner_size = 1.2 * inch
            margin = 0.4 * inch
            
            # Top-left corner
            self._draw_decorative_corner(c, margin, height - margin, corner_size, flip_y=True)
            # Top-right corner  
            self._draw_decorative_corner(c, width - margin, height - margin, corner_size, flip_x=True, flip_y=True)
            # Bottom-left corner
            self._draw_decorative_corner(c, margin, margin, corner_size)
            # Bottom-right corner
            self._draw_decorative_corner(c, width - margin, margin, corner_size, flip_x=True)
            
            # === Main Border ===
            # Outer border with gradient effect
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(3)
            c.roundRect(0.5*inch, 0.5*inch, width-inch, height-inch, 15, stroke=1, fill=0)
            
            # Inner accent line
            c.setStrokeColor(self.sky_400)
            c.setLineWidth(1)
            c.roundRect(0.6*inch, 0.6*inch, width-1.2*inch, height-1.2*inch, 12, stroke=1, fill=0)
            
            # === Header Section ===
            # Brand name with modern styling
            c.setFillColor(self.sky_500)
            c.setFont("Helvetica-Bold", 48)
            c.drawCentredString(width/2, height-1.3*inch, "Sinod'")
            
            # Tagline
            c.setFillColor(self.gray_700)
            c.setFont("Helvetica", 11)
            c.drawCentredString(width/2, height-1.6*inch, "A new way to event, meet and converse")
            
            # Decorative line under header
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(2)
            gradient_line_y = height - 1.85*inch
            c.line(width/2 - 3*inch, gradient_line_y, width/2 + 3*inch, gradient_line_y)
            
            # Small accent circles on the line
            c.setFillColor(self.sky_500)
            c.circle(width/2 - 3*inch, gradient_line_y, 4, stroke=0, fill=1)
            c.circle(width/2 + 3*inch, gradient_line_y, 4, stroke=0, fill=1)
            c.setFillColor(self.sky_400)
            c.circle(width/2, gradient_line_y, 6, stroke=0, fill=1)
            
            # === Certificate Title ===
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 40)
            c.drawCentredString(width/2, height-2.6*inch, "CERTIFICATE")
            
            c.setFont("Helvetica", 18)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, height-2.95*inch, "of Attendance")
            
            # === Body Content ===
            # "Presented to" text
            c.setFont("Helvetica", 15)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, height-3.5*inch, "This certificate is proudly presented to")
            
            # Attendee name - Featured prominently
            c.setFont("Helvetica-Bold", 38)
            c.setFillColor(self.sky_500)
            c.drawCentredString(width/2, height-4.15*inch, attendee_name)
            
            # Decorative underline for name
            name_width = c.stringWidth(attendee_name, "Helvetica-Bold", 38)
            underline_y = height - 4.3*inch
            c.setStrokeColor(self.sky_400)
            c.setLineWidth(1.5)
            c.line(width/2 - name_width/2 - 20, underline_y, 
                   width/2 + name_width/2 + 20, underline_y)
            
            # "For attending" text
            c.setFont("Helvetica", 15)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, height-4.75*inch, "for successfully attending")
            
            # Event name - Styled box
            event_y = height - 5.35*inch
            c.setFont("Helvetica-Bold", 22)
            c.setFillColor(self.gray_900)
            c.drawCentredString(width/2, event_y, event_name)
            
            # Subtle box around event name
            event_width = c.stringWidth(event_name, "Helvetica-Bold", 22)
            box_padding = 30
            c.setStrokeColor(self.sky_400)
            c.setFillColor(self.sky_500)
            c.setFillAlpha(0.05)
            c.roundRect(width/2 - event_width/2 - box_padding, 
                       event_y - 15, 
                       event_width + 2*box_padding, 
                       40, 
                       8, stroke=1, fill=1)
            c.setFillAlpha(1)
            
            # Re-draw event name on top of box
            c.setFillColor(self.gray_900)
            c.drawCentredString(width/2, event_y, event_name)
            
            # Event date
            c.setFont("Helvetica", 13)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, height-5.85*inch, f"Event Date: {event_date}")
            
            # === Footer Section ===
            if not completion_date:
                completion_date = datetime.now().strftime("%B %d, %Y")
            
            footer_y = height - 7.1*inch
            
            # Date section (left)
            date_x = 2.8*inch
            c.setFont("Helvetica", 13)
            c.setFillColor(self.gray_900)
            c.drawCentredString(date_x, footer_y + 0.1*inch, completion_date)
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(1.5)
            c.line(date_x - 0.9*inch, footer_y, date_x + 0.9*inch, footer_y)
            c.setFont("Helvetica", 10)
            c.setFillColor(self.gray_700)
            c.drawCentredString(date_x, footer_y - 0.25*inch, "Issue Date")
            
            # Signature section (right)
            sig_x = width - 2.8*inch
            c.setFont("Helvetica-BoldOblique", 18)
            c.setFillColor(self.sky_500)
            c.drawCentredString(sig_x, footer_y + 0.1*inch, "Sinod' Team")
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(1.5)
            c.line(sig_x - 0.9*inch, footer_y, sig_x + 0.9*inch, footer_y)
            c.setFont("Helvetica", 10)
            c.setFillColor(self.gray_700)
            c.drawCentredString(sig_x, footer_y - 0.25*inch, "Authorized Signature")
            
            # === Bottom Footer ===
            # Certificate ID with icon
            c.setFont("Helvetica", 8)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, 0.7*inch, f"Certificate ID: {cert_id}")
            
            # Copyright
            c.setFont("Helvetica", 7)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, 0.5*inch, 
                              "© 2025 Sinod Software Solutions Ltd. • All rights reserved • Powered by Lexrunit")
            
            # Small badge/seal
            badge_x = width - 1.2*inch
            badge_y = 0.9*inch
            badge_radius = 0.35*inch
            
            # Outer circle
            c.setStrokeColor(self.sky_500)
            c.setFillColor(self.sky_500)
            c.setFillAlpha(0.1)
            c.circle(badge_x, badge_y, badge_radius, stroke=1, fill=1)
            c.setFillAlpha(1)
            
            # Inner circle
            c.setStrokeColor(self.sky_400)
            c.circle(badge_x, badge_y, badge_radius * 0.7, stroke=1, fill=0)
            
            # Badge text
            c.setFont("Helvetica-Bold", 7)
            c.setFillColor(self.sky_500)
            c.drawCentredString(badge_x, badge_y + 5, "VERIFIED")
            c.setFont("Helvetica", 6)
            c.drawCentredString(badge_x, badge_y - 5, "2025")
            
            # Finalize PDF
            c.showPage()
            c.save()
            
            # Get PDF bytes and encode to base64
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            certificate_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            logger.info(f"Certificate generated for {attendee_name} - Event: {event_name} - ID: {cert_id}")
            return certificate_base64, cert_id
            
        except Exception as e:
            logger.error(f"Error generating certificate: {str(e)}", exc_info=True)
            raise


# Singleton instance
certificate_service = CertificateService()

