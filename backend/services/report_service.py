"""
Report generation service using matplotlib and ReportLab
"""

import base64
from io import BytesIO
import logging
from datetime import datetime
from typing import Dict, Any, List

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.patches import Circle
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

from config import settings

logger = logging.getLogger(__name__)


class ReportService:
    """Service for generating PDF reports with charts"""

    def __init__(self):
        # Report dimensions (portrait letter)
        self.width, self.height = letter
        
        # Brand colors - Sky blue gradient theme
        self.sky_500 = HexColor('#0ea5e9')      # Primary sky blue
        self.blue_600 = HexColor('#2563eb')     # Darker blue
        self.sky_400 = HexColor('#38bdf8')      # Lighter sky
        self.blue_700 = HexColor('#1d4ed8')     # Deep blue
        self.gray_900 = HexColor('#111827')     # Dark text
        self.gray_700 = HexColor('#374151')     # Medium gray
        self.gray_300 = HexColor('#d1d5db')     # Light gray
        self.success = HexColor('#10b981')      # Green
        self.warning = HexColor('#f59e0b')      # Yellow
        self.white = HexColor('#ffffff')        # White

    def generate_registration_trend_chart(self, trend_data: List[Dict[str, Any]]) -> str:
        """
        Generate registration trend line chart with brand colors

        Args:
            trend_data: List of dicts with 'date' and 'count' keys

        Returns:
            Base64 encoded PNG chart
        """
        try:
            # Set up the plot with brand styling
            plt.figure(figsize=(10, 6))
            plt.style.use('default')
            
            # Set background color
            fig = plt.gcf()
            fig.patch.set_facecolor('white')
            ax = plt.gca()
            ax.set_facecolor('#f9fafb')

            # Extract data
            dates = [datetime.strptime(item['date'], '%Y-%m-%d') for item in trend_data]
            counts = [item['count'] for item in trend_data]

            # Create gradient effect with area fill
            plt.fill_between(dates, counts, alpha=0.3, color='#0ea5e9')
            
            # Create the line plot with brand colors
            plt.plot(dates, counts, 'o-', linewidth=3, markersize=10,
                    color='#0ea5e9', markerfacecolor='#0ea5e9',
                    markeredgecolor='white', markeredgewidth=2.5,
                    label='Registrations')

            # Styling
            plt.title('Registration Trend Over Time', fontsize=18, fontweight='bold', 
                     pad=20, color='#111827')
            plt.xlabel('Date', fontsize=13, fontweight='500', color='#374151')
            plt.ylabel('Number of Registrations', fontsize=13, fontweight='500', color='#374151')
            
            # Enhanced grid
            plt.grid(True, alpha=0.2, linestyle='--', linewidth=0.8)

            # Format x-axis dates
            plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
            plt.gcf().autofmt_xdate()
            
            # Style tick labels
            ax.tick_params(colors='#6b7280', which='both')

            # Add value labels on points with better styling
            for i, (date, count) in enumerate(zip(dates, counts)):
                plt.annotate(f'{count}', (date, count),
                           xytext=(0, 12), textcoords='offset points',
                           ha='center', fontsize=11, fontweight='bold',
                           color='#0ea5e9',
                           bbox=dict(boxstyle='round,pad=0.4', 
                                   facecolor='white', 
                                   edgecolor='#0ea5e9', 
                                   linewidth=1.5))

            plt.tight_layout()

            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                       facecolor='white', edgecolor='none')
            buffer.seek(0)
            chart_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            buffer.close()
            plt.close()

            return chart_base64

        except Exception as e:
            logger.error(f"Error generating registration trend chart: {str(e)}")
            raise

    def generate_attendance_pie_chart(self, total: int, approved: int, attended: int) -> str:
        """
        Generate attendance status pie chart with brand colors

        Args:
            total: Total registrations
            approved: Number approved
            attended: Number who attended

        Returns:
            Base64 encoded PNG chart
        """
        try:
            # Calculate values
            pending = total - approved
            approved_not_attended = approved - attended

            # Data for pie chart with brand colors
            labels = ['Attended', 'Approved (Not Attended)', 'Pending Approval']
            sizes = [attended, approved_not_attended, pending]
            colors = ['#10b981', '#0ea5e9', '#f59e0b']  # Green, Sky Blue, Yellow

            # Only show non-zero values
            filtered_labels = []
            filtered_sizes = []
            filtered_colors = []

            for label, size, color in zip(labels, sizes, colors):
                if size > 0:
                    filtered_labels.append(label)
                    filtered_sizes.append(size)
                    filtered_colors.append(color)

            # Create pie chart with modern styling
            plt.figure(figsize=(8, 8))
            fig = plt.gcf()
            fig.patch.set_facecolor('white')

            # Create donut chart effect
            wedges, texts, autotexts = plt.pie(filtered_sizes,
                                             labels=filtered_labels,
                                             colors=filtered_colors,
                                             autopct=lambda pct: f'{pct:.1f}%\n({int(pct/100.*sum(filtered_sizes))})',
                                             startangle=90,
                                             wedgeprops={'edgecolor': 'white', 
                                                        'linewidth': 3,
                                                        'width': 0.7})  # Donut effect

            # Style the text
            for text in texts:
                text.set_fontsize(13)
                text.set_fontweight('bold')
                text.set_color('#111827')

            for autotext in autotexts:
                autotext.set_fontsize(11)
                autotext.set_color('white')
                autotext.set_fontweight('bold')

            plt.title('Attendance Status Distribution', fontsize=18, fontweight='bold', 
                     pad=20, color='#111827')
            
            # Add center circle for donut effect
            centre_circle = plt.Circle((0, 0), 0.30, fc='white', linewidth=0)
            fig.gca().add_artist(centre_circle)
            
            # Add total count in center
            plt.text(0, 0, f'{total}\nTotal', ha='center', va='center',
                    fontsize=16, fontweight='bold', color='#0ea5e9')
            
            plt.axis('equal')

            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                       facecolor='white', edgecolor='none')
            buffer.seek(0)
            chart_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            buffer.close()
            plt.close()

            return chart_base64

        except Exception as e:
            logger.error(f"Error generating attendance pie chart: {str(e)}")
            raise

    def generate_report_pdf(
        self,
        organizer_name: str,
        analytics_data: Dict[str, Any],
        trend_chart_b64: str,
        pie_chart_b64: str
    ) -> str:
        """
        Generate a comprehensive PDF report with modern Sinod branding

        Args:
            organizer_name: Name of the event organizer
            analytics_data: Analytics data dictionary
            trend_chart_b64: Base64 encoded trend chart
            pie_chart_b64: Base64 encoded pie chart

        Returns:
            Base64 encoded PDF report
        """
        try:
            # Create PDF in memory
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)

            width, height = letter

            # === HEADER SECTION ===
            # Gradient background effect for header
            header_height = 2.2 * inch
            steps = 30
            for i in range(steps):
                alpha = 0.15 - (i / steps) * 0.15
                c.setFillColor(self.sky_500)
                c.setFillAlpha(alpha)
                c.rect(0, height - header_height + (i * header_height / steps), 
                      width, header_height / steps, stroke=0, fill=1)
            c.setFillAlpha(1)
            
            # Brand logo/name
            c.setFillColor(self.sky_500)
            c.setFont("Helvetica-Bold", 44)
            c.drawCentredString(width/2, height - 0.8*inch, "Sinod'")
            
            # Subtitle
            c.setFillColor(self.gray_700)
            c.setFont("Helvetica", 12)
            c.drawCentredString(width/2, height - 1.05*inch, "Event Analytics Report")
            
            # Date generated
            c.setFillColor(self.gray_700)
            c.setFont("Helvetica", 10)
            c.drawCentredString(width/2, height - 1.3*inch, 
                              f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
            
            # Decorative line
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(2)
            c.line(width/2 - 2.5*inch, height - 1.5*inch, 
                  width/2 + 2.5*inch, height - 1.5*inch)
            
            # Accent dots on line
            for x_offset in [-2.5, 0, 2.5]:
                c.setFillColor(self.sky_500 if x_offset == 0 else self.sky_400)
                c.circle(width/2 + x_offset*inch, height - 1.5*inch, 
                        5 if x_offset == 0 else 3, stroke=0, fill=1)

            # === EVENT DETAILS CARD ===
            card_y = height - 3.8*inch
            
            # Card background with gradient border
            c.setFillColor(self.white)
            c.setFillAlpha(0.95)
            c.roundRect(0.7*inch, card_y, width - 1.4*inch, 1.6*inch, 12, stroke=0, fill=1)
            c.setFillAlpha(1)
            
            # Card border
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(2)
            c.roundRect(0.7*inch, card_y, width - 1.4*inch, 1.6*inch, 12, stroke=1, fill=0)
            
            # Event icon/badge
            c.setFillColor(self.sky_500)
            c.setFillAlpha(0.1)
            c.circle(1.2*inch, card_y + 0.8*inch, 0.35*inch, stroke=0, fill=1)
            c.setFillAlpha(1)
            c.setFont("Helvetica-Bold", 20)
            c.setFillColor(self.sky_500)
            c.drawCentredString(1.2*inch, card_y + 0.7*inch, "📅")
            
            # Event details
            c.setFont("Helvetica-Bold", 18)
            c.setFillColor(self.gray_900)
            event_name = analytics_data['eventName']
            if len(event_name) > 50:
                event_name = event_name[:47] + "..."
            c.drawString(1.7*inch, card_y + 1.2*inch, event_name)
            
            c.setFont("Helvetica", 12)
            c.setFillColor(self.gray_700)
            c.drawString(1.7*inch, card_y + 0.85*inch, f"📍 {analytics_data['eventLocation']}")
            c.drawString(1.7*inch, card_y + 0.55*inch, f"📆 {analytics_data['eventDate']}")
            c.drawString(1.7*inch, card_y + 0.25*inch, f"👤 Organized by {organizer_name}")

            # === KEY METRICS SECTION ===
            metrics_y = card_y - 0.5*inch
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 16)
            c.drawString(0.7*inch, metrics_y, "📊 Key Performance Metrics")

            # Calculate metrics
            total = analytics_data['totalRegistrations']
            approved = analytics_data['approvedAttendees']
            attended = analytics_data['attendedCount']
            pending = total - approved
            
            conversion_rate = (attended / total * 100) if total > 0 else 0
            approval_rate = (approved / total * 100) if total > 0 else 0
            checkin_rate = (attended / approved * 100) if approved > 0 else 0

            # Metrics grid (2x2)
            metrics_data = [
                ("Total Registrations", total, self.sky_500, "👥"),
                ("Attended Event", attended, self.success, "✅"),
                ("Approved", approved, self.blue_600, "👍"),
                ("Pending", pending, self.warning, "⏳")
            ]
            
            metric_box_width = 3.2*inch
            metric_box_height = 0.85*inch
            spacing = 0.15*inch
            
            for idx, (label, value, color, icon) in enumerate(metrics_data):
                row = idx // 2
                col = idx % 2
                x = 0.7*inch + col * (metric_box_width + spacing)
                y = metrics_y - 0.5*inch - row * (metric_box_height + spacing)
                
                # Metric box with subtle shadow
                c.setFillColor(color)
                c.setFillAlpha(0.08)
                c.roundRect(x, y - metric_box_height, metric_box_width, metric_box_height, 8, stroke=0, fill=1)
                c.setFillAlpha(1)
                
                # Border
                c.setStrokeColor(color)
                c.setLineWidth(1.5)
                c.roundRect(x, y - metric_box_height, metric_box_width, metric_box_height, 8, stroke=1, fill=0)
                
                # Icon
                c.setFont("Helvetica", 16)
                c.setFillColor(color)
                c.drawString(x + 0.15*inch, y - 0.5*inch, icon)
                
                # Value
                c.setFont("Helvetica-Bold", 24)
                c.setFillColor(color)
                c.drawString(x + 0.5*inch, y - 0.5*inch, str(value))
                
                # Label
                c.setFont("Helvetica", 10)
                c.setFillColor(self.gray_700)
                c.drawString(x + 0.15*inch, y - 0.75*inch, label)

            # === CHARTS SECTION ===
            chart_y = metrics_y - 2.4*inch

            # Registration Trend Chart
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 15)
            c.drawString(0.7*inch, chart_y + 1.5*inch, "📈 Registration Trend Over Time")

            # Convert base64 trend chart to image
            trend_img_data = base64.b64decode(trend_chart_b64)
            trend_img = ImageReader(BytesIO(trend_img_data))
            c.drawImage(trend_img, 0.7*inch, chart_y - 2.3*inch, width=6.6*inch, height=2.2*inch, mask='auto')

            # === PAGE 2: ATTENDANCE & INSIGHTS ===
            c.showPage()  # New page
            
            # Page 2 Header
            c.setFillColor(self.sky_500)
            c.setFont("Helvetica-Bold", 20)
            c.drawString(0.7*inch, height - 0.7*inch, "Sinod' Event Analytics")
            
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(1.5)
            c.line(0.7*inch, height - 0.85*inch, width - 0.7*inch, height - 0.85*inch)

            # Attendance Pie Chart
            pie_chart_y = height - 1.5*inch
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 15)
            c.drawString(0.7*inch, pie_chart_y, "🎯 Attendance Status Distribution")

            # Convert base64 pie chart to image
            pie_img_data = base64.b64decode(pie_chart_b64)
            pie_img = ImageReader(BytesIO(pie_img_data))
            c.drawImage(pie_img, 0.7*inch, pie_chart_y - 2.8*inch, width=6.6*inch, height=2.5*inch, mask='auto')

            # === ENHANCED INSIGHTS SECTION ===
            insights_y = pie_chart_y - 3.5*inch
            
            # Insights header with background
            c.setFillColor(self.sky_500)
            c.setFillAlpha(0.08)
            c.roundRect(0.7*inch, insights_y - 3*inch, width - 1.4*inch, 3.2*inch, 10, stroke=0, fill=1)
            c.setFillAlpha(1)
            
            c.setStrokeColor(self.sky_500)
            c.setLineWidth(1.5)
            c.roundRect(0.7*inch, insights_y - 3*inch, width - 1.4*inch, 3.2*inch, 10, stroke=1, fill=0)
            
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 16)
            c.drawString(0.9*inch, insights_y - 0.15*inch, "💡 Key Insights & Recommendations")

            # Calculate advanced metrics
            if total > 0:
                # Performance indicators with colors
                perf_metrics = [
                    {
                        "label": "Overall Conversion Rate",
                        "value": f"{conversion_rate:.1f}%",
                        "description": f"{attended} of {total} registered attendees showed up",
                        "color": self.success if conversion_rate >= 70 else self.warning if conversion_rate >= 50 else self.gray_700,
                        "recommendation": "Excellent engagement!" if conversion_rate >= 70 else "Good turnout" if conversion_rate >= 50 else "Consider follow-up reminders"
                    },
                    {
                        "label": "Approval Efficiency",
                        "value": f"{approval_rate:.1f}%",
                        "description": f"{approved} registrations approved out of {total}",
                        "color": self.blue_600,
                        "recommendation": "Fast approval process" if approval_rate >= 80 else "Some registrations pending review"
                    },
                    {
                        "label": "Check-in Success Rate",
                        "value": f"{checkin_rate:.1f}%",
                        "description": f"{attended} attended out of {approved} approved",
                        "color": self.success if checkin_rate >= 80 else self.warning if checkin_rate >= 60 else self.gray_700,
                        "recommendation": "Great turnout!" if checkin_rate >= 80 else "Consider reminder emails" if checkin_rate >= 60 else "Improve engagement strategies"
                    }
                ]
                
                current_y = insights_y - 0.6*inch
                for metric in perf_metrics:
                    # Metric label
                    c.setFont("Helvetica-Bold", 12)
                    c.setFillColor(metric["color"])
                    c.drawString(0.9*inch, current_y, f"• {metric['label']}: {metric['value']}")
                    
                    # Description
                    c.setFont("Helvetica", 10)
                    c.setFillColor(self.gray_700)
                    c.drawString(1.1*inch, current_y - 0.18*inch, metric['description'])
                    
                    # Recommendation
                    c.setFont("Helvetica-Oblique", 9)
                    c.setFillColor(self.gray_700)
                    c.drawString(1.1*inch, current_y - 0.34*inch, f"→ {metric['recommendation']}")
                    
                    current_y -= 0.65*inch

            # === ACTION ITEMS SECTION ===
            action_y = insights_y - 3.7*inch
            
            c.setFillColor(self.gray_900)
            c.setFont("Helvetica-Bold", 16)
            c.drawString(0.7*inch, action_y, "✅ Recommended Next Steps")
            
            # Action items based on data
            actions = []
            if pending > 0:
                actions.append(f"Review {pending} pending registration(s) for approval")
            if approved > attended:
                no_shows = approved - attended
                actions.append(f"Follow up with {no_shows} approved attendees who didn't check in")
            if conversion_rate < 70:
                actions.append("Send reminder emails 24 hours before future events")
            if checkin_rate < 80:
                actions.append("Simplify check-in process to improve attendance rate")
            
            actions.append("Download detailed attendee list for post-event engagement")
            actions.append("Share event highlights with attendees via email campaign")
            
            c.setFont("Helvetica", 11)
            c.setFillColor(self.gray_900)
            current_action_y = action_y - 0.3*inch
            for idx, action in enumerate(actions[:6]):  # Limit to 6 actions
                c.drawString(0.9*inch, current_action_y, f"{idx + 1}. {action}")
                current_action_y -= 0.22*inch

            # === FOOTER (on both pages) ===
            # Page 1 footer
            c.setFillColor(self.gray_700)
            c.setFont("Helvetica", 8)
            c.drawCentredString(width/2, 0.7*inch, 
                              f"© 2025 Sinod Software Solutions Ltd. • Powered by Lexrunit")
            c.setFont("Helvetica", 7)
            c.setFillColor(self.gray_700)
            c.drawCentredString(width/2, 0.5*inch, 
                              f"Report generated for {organizer_name} • ID: {datetime.now().strftime('%Y%m%d_%H%M%S')}")
            
            # Page number
            c.setFont("Helvetica", 8)
            c.drawString(width - 0.9*inch, 0.5*inch, "Page 2 of 2")
            
            # Add Sinod logo badge on page 2
            badge_x = 0.9*inch
            badge_y = 0.7*inch
            c.setStrokeColor(self.sky_500)
            c.setFillColor(self.sky_500)
            c.setFillAlpha(0.1)
            c.circle(badge_x, badge_y, 0.22*inch, stroke=1, fill=1)
            c.setFillAlpha(1)
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(self.sky_500)
            c.drawCentredString(badge_x, badge_y - 0.03*inch, "S")

            # Finalize PDF
            c.showPage()
            c.save()

            # Get PDF bytes and encode to base64
            pdf_bytes = buffer.getvalue()
            buffer.close()

            report_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            logger.info(f"Report PDF generated for {organizer_name} - Event: {analytics_data['eventName']}")
            return report_base64

        except Exception as e:
            logger.error(f"Error generating report PDF: {str(e)}", exc_info=True)
            raise

    async def generate_and_email_report(
        self,
        organizer_email: str,
        organizer_name: str,
        analytics_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate charts, create PDF report, and email to organizer

        Args:
            organizer_email: Email address of the organizer
            organizer_name: Name of the organizer
            analytics_data: Analytics data dictionary

        Returns:
            Dictionary with success status and details
        """
        try:
            # Generate charts
            trend_chart_b64 = self.generate_registration_trend_chart(analytics_data['registrationTrend'])
            pie_chart_b64 = self.generate_attendance_pie_chart(
                analytics_data['totalRegistrations'],
                analytics_data['approvedAttendees'],
                analytics_data['attendedCount']
            )

            # Generate PDF report
            report_b64 = self.generate_report_pdf(
                organizer_name, analytics_data, trend_chart_b64, pie_chart_b64
            )

            # Email the report (we'll use the email service)
            from services.email_service import email_service

            # Create report email HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body {{
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        line-height: 1.6; color: #1f2937; background-color: #f9fafb; padding: 20px; margin: 0;
                    }}
                    .email-container {{
                        max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                        color: white; padding: 40px 30px; text-align: center;
                    }}
                    .header-title {{ font-size: 28px; font-weight: 700; margin: 0 0 10px 0; }}
                    .content {{ padding: 40px 30px; text-align: center; }}
                    .chart-icon {{
                        width: 80px; height: 80px; margin: 0 auto 20px;
                        background: #fef3c7; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center; font-size: 40px;
                    }}
                    .message {{ font-size: 18px; color: #4b5563; margin-bottom: 30px; line-height: 1.8; }}
                    .highlight {{ color: #6366f1; font-weight: 700; }}
                    .stats-grid {{
                        display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;
                    }}
                    .stat-box {{
                        background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;
                    }}
                    .stat-value {{ font-size: 24px; font-weight: 700; color: #6366f1; }}
                    .stat-label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }}
                    .button {{
                        display: inline-block; padding: 16px 40px; background: #6366f1; color: white !important;
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 20px;
                    }}
                    .footer {{ background: #f9fafb; padding: 30px; text-align: center; }}
                    .footer p {{ font-size: 13px; color: #6b7280; margin: 8px 0; }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1 class="header-title">📊 Event Analytics Report</h1>
                        <p style="font-size: 16px; opacity: 0.9; margin: 0;">{analytics_data['eventName']}</p>
                    </div>

                    <div class="content">
                        <div class="chart-icon">📈</div>

                        <h2 style="font-size: 24px; color: #111827; margin-bottom: 20px;">
                            Hello {organizer_name}!
                        </h2>

                        <div class="message">
                            Your comprehensive event analytics report is ready!
                            This detailed report includes registration trends, attendance statistics,
                            and key insights about your event's performance.
                        </div>

                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-value">{analytics_data['totalRegistrations']}</div>
                                <div class="stat-label">Total Registrations</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{analytics_data['attendedCount']}</div>
                                <div class="stat-label">Attended Event</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{analytics_data['approvedAttendees']}</div>
                                <div class="stat-label">Approved</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{((analytics_data['attendedCount'] / analytics_data['totalRegistrations']) * 100):.1f}%</div>
                                <div class="stat-label">Conversion Rate</div>
                            </div>
                        </div>

                        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
                            <p style="font-size: 14px; color: #6b7280; margin: 0;">
                                📎 <strong>Your detailed report is attached as a PDF file.</strong>
                                <br>
                                It includes interactive charts, key metrics, and actionable insights.
                            </p>
                        </div>

                        <a href="https://sinod.lexrunit.com/dashboard" class="button">
                            View Dashboard
                        </a>

                        <div style="margin-top: 40px; font-size: 15px; color: #4b5563;">
                            Best regards,<br>
                            <strong style="color: #6366f1;">The Sinod' Team</strong>
                        </div>
                    </div>

                    <div class="footer">
                        <p>&copy; 2025 Sinod Software Solutions Ltd. All rights reserved.</p>
                        <p>Thank you for using Sinod' to power your events!</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Create filename
            safe_event_name = "".join(c if c.isalnum() or c in (' ', '-') else '' for c in analytics_data['eventName']).replace(' ', '_')
            report_filename = f"Event_Report_{safe_event_name}_{datetime.now().strftime('%Y%m%d')}.pdf"

            # Send email with report attachment
            email_result = await email_service.send_raw_email(
                to_email=organizer_email,
                subject=f"📊 Event Analytics Report - {analytics_data['eventName']}",
                html_content=html_content,
                attachments=[{
                    "filename": report_filename,
                    "content": report_b64
                }]
            )

            if email_result["success"]:
                report_id = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                logger.info(f"Event analytics report sent to {organizer_email} for event: {analytics_data['eventName']}")
                return {
                    "success": True,
                    "message": "Event analytics report generated and emailed successfully",
                    "report_id": report_id,
                    "email_id": email_result.get("email_id")
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to send report email: {email_result.get('error', 'Unknown error')}"
                }

        except Exception as e:
            error_msg = f"Error generating and emailing report: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }


# Singleton instance
report_service = ReportService()