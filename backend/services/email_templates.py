"""
Sinod Email Templates - Elegant, Glassy Design
Professional and joyful email templates aligned with brand identity
"""

def get_base_email_styles() -> str:
    """
    Get base CSS styles for all Sinod emails
    Glassy, elegant design with dark primary and sky-blue accents
    """
    return """
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
                padding: 40px 20px;
                margin: 0;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.4),
                    0 0 1px rgba(255, 255, 255, 0.1),
                    inset 0 1px 1px rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .header {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                padding: 48px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.15) 0%, transparent 50%);
                pointer-events: none;
            }
            
            .logo {
                font-size: 42px;
                font-weight: 800;
                color: white;
                margin-bottom: 12px;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
            }
            
            .tagline {
                font-size: 14px;
                color: rgba(14, 165, 233, 0.9);
                font-weight: 500;
                letter-spacing: 0.5px;
                position: relative;
                z-index: 1;
            }
            
            .content {
                padding: 48px 40px;
            }
            
            .greeting {
                font-size: 28px;
                font-weight: 700;
                color: #0a0a0a;
                margin-bottom: 16px;
                line-height: 1.3;
            }
            
            .message {
                font-size: 16px;
                color: #4b5563;
                line-height: 1.8;
                margin-bottom: 32px;
            }
            
            .highlight {
                color: #0ea5e9;
                font-weight: 600;
            }
            
            .card {
                background: linear-gradient(135deg, rgba(10, 10, 10, 0.03) 0%, rgba(26, 26, 26, 0.05) 100%);
                border: 1.5px solid rgba(10, 10, 10, 0.15);
                border-radius: 16px;
                padding: 28px;
                margin: 28px 0;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            
            .card-title {
                font-size: 18px;
                font-weight: 700;
                color: #0a0a0a;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 0;
                border-bottom: 1px solid rgba(10, 10, 10, 0.08);
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }
            
            .detail-value {
                font-size: 15px;
                color: #0a0a0a;
                font-weight: 600;
            }
            
            .button {
                display: inline-block;
                padding: 16px 32px;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                color: white !important;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                border: none;
            }
            
            .button:hover {
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                transform: translateY(-2px);
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            }
            
            .button-secondary {
                background: white;
                color: #0a0a0a !important;
                border: 2px solid #0a0a0a;
                box-shadow: none;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, rgba(10, 10, 10, 0.2) 50%, transparent 100%);
                margin: 32px 0;
            }
            
            .info-box {
                background: rgba(14, 165, 233, 0.08);
                border-left: 4px solid #0ea5e9;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
            }
            
            .info-box p {
                margin: 0;
                font-size: 14px;
                color: #374151;
                line-height: 1.6;
            }
            
            .qr-container {
                text-align: center;
                padding: 24px;
                background: white;
                border-radius: 16px;
                border: 2px solid rgba(10, 10, 10, 0.1);
                margin: 24px 0;
            }
            
            .qr-code {
                width: 200px;
                height: 200px;
                margin: 0 auto;
                border-radius: 12px;
            }
            
            .footer {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                padding: 40px;
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .footer p {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                margin: 8px 0;
                line-height: 1.6;
            }
            
            .footer a {
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 500;
            }
            
            .social-links {
                margin-top: 24px;
                display: flex;
                gap: 16px;
                justify-content: center;
            }
            
            .social-link {
                display: inline-block;
                width: 40px;
                height: 40px;
                background: rgba(14, 165, 233, 0.15);
                border-radius: 50%;
                line-height: 40px;
                text-align: center;
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 600;
            }
            
            .badge {
                display: inline-block;
                padding: 6px 14px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.3px;
            }
            
            .badge-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }
            
            .badge-info {
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            }
            
            @media only screen and (max-width: 600px) {
                body {
                    padding: 20px 10px;
                }
                
                .content {
                    padding: 32px 24px;
                }
                
                .header {
                    padding: 36px 24px;
                }
                
                .footer {
                    padding: 32px 24px;
                }
                
                .greeting {
                    font-size: 24px;
                }
                
                .card {
                    padding: 20px;
                }
                
                .button {
                    display: block;
                    width: 100%;
                }
            }
        </style>
    """


def get_email_header(custom_title: str = None) -> str:
    """Get the standard email header"""
    return f"""
        <div class="header">
            <div class="logo">Sinod'</div>
            <div class="tagline">Engage effortlessly, every time!</div>
        </div>
    """


def get_email_footer(unsubscribe_email: str = None) -> str:
    """Get the standard email footer with optional unsubscribe link"""
    unsubscribe_link = ""
    if unsubscribe_email:
        unsubscribe_link = f"""
            <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">
                Don't want to receive these emails? 
                <a href="https://sinod.app/unsubscribe?email={unsubscribe_email}" style="color: #0ea5e9;">Unsubscribe</a>
            </p>
        """
    
    return f"""
        <div class="footer">
            <p style="font-weight: 600; color: #ffffff; font-size: 14px; margin-bottom: 16px;">
                Thank you for choosing Sinod'
            </p>
            <p>
                We're delighted to be part of your journey.<br>
                Our platform ensures every detail is perfectly orchestrated.
            </p>
            <div class="divider" style="margin: 24px auto; max-width: 200px;"></div>
            <p>
                Need assistance? Visit our <a href="https://www.sinod.app/resources/support">Help Center</a><br>
                or contact us at <a href="mailto:contact@sinod.app">contact@sinod.app</a>
            </p>
            {unsubscribe_link}
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                &copy; 2025 Sinod'<br>
                A product of <strong>Lexrunit</strong> &middot; All rights reserved
            </p>
        </div>
    """


def wrap_email_content(content: str, unsubscribe_email: str = None) -> str:
    """Wrap content in the base email structure"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        {get_base_email_styles()}
    </head>
    <body>
        <div class="email-container">
            {get_email_header()}
            <div class="content">
                {content}
            </div>
            {get_email_footer(unsubscribe_email)}
        </div>
    </body>
    </html>
    """


def create_approval_email_content(attendee_name: str, event_name: str, event_time: str, 
                                  event_location: str, qr_code_base64: str, event_page_url: str,
                                  registration_id: str = None) -> str:
    """Create content for approval confirmation email"""
    
    reg_id_row = ""
    if registration_id:
        reg_id_row = f"""
            <div class="detail-row">
                <span class="detail-label">Registration ID</span>
                <span class="detail-value" style="font-family: monospace; color: #0ea5e9; letter-spacing: 0.5px;">{registration_id}</span>
            </div>
        """
    
    qr_fallback = ""
    if registration_id:
        qr_fallback = f"""
        <div class="info-box">
            <p>
                <strong>Can't scan the QR code?</strong><br>
                Use your Registration ID at check-in instead: <strong style="font-family: monospace; color: #0ea5e9;">{registration_id}</strong>
            </p>
        </div>
        """
    
    return f"""
        <h1 class="greeting">Great News, {attendee_name}!</h1>
        <p class="message">
            Your registration for <span class="highlight">{event_name}</span> has been approved. 
            We're looking forward to welcoming you!
        </p>
        
        <div class="card">
            <div class="card-title">
                <span>Event Information</span>
                <span class="badge">Approved</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">{event_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">When</span>
                <span class="detail-value">{event_time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Where</span>
                <span class="detail-value">{event_location}</span>
            </div>
            {reg_id_row}
        </div>
        
        <div class="qr-container">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px; font-weight: 500;">
                Your Check-in QR Code
            </p>
            <img src="cid:{qr_code_base64}" alt="QR Code" class="qr-code" 
                 style="width: 200px; height: 200px; border-radius: 12px;" />
            <p style="font-size: 13px; color: #9ca3af; margin-top: 16px;">
                Present this code at the event for quick check-in
            </p>
        </div>
        
        {qr_fallback}
        
        <div style="text-align: center; margin: 36px 0;">
            <a href="{event_page_url}" class="button">
                Prepare for the Event
            </a>
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


def create_certificate_email_content(attendee_name: str, event_name: str, event_date: str, certificate_id: str = None, frontend_url: str = "https://sinod.app") -> str:
    """Create content for certificate delivery email with verification code"""
    cert_id_display = certificate_id or "N/A"
    verify_url = f"{frontend_url}/verify-certificate/{certificate_id}" if certificate_id else "#"
    
    return f"""
        <h1 class="greeting">Congratulations, {attendee_name}!</h1>
        <p class="message">
            Thank you for attending <span class="highlight">{event_name}</span>. 
            Your participation made the event truly special.
        </p>
        
        <div class="card">
            <div class="card-title">
                <span>Event Summary</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Event Name</span>
                <span class="detail-value">{event_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date Attended</span>
                <span class="detail-value">{event_date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Certificate ID</span>
                <span class="detail-value" style="font-family: monospace; color: #0ea5e9;">{cert_id_display}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Certificate Status</span>
                <span class="badge">Verified ✓</span>
            </div>
        </div>
        
        <div class="info-box" style="background: rgba(16, 185, 129, 0.08); border-left-color: #10b981; text-align: center;">
            <p style="color: #059669; font-weight: 600; margin-bottom: 8px;">
                Your Certificate is Attached
            </p>
            <p style="color: #047857; font-size: 14px;">
                Download and share your achievement with your network
            </p>
        </div>
        
        <div class="info-box" style="background: rgba(14, 165, 233, 0.08); border-left-color: #0ea5e9; text-align: center;">
            <p style="color: #0369a1; font-weight: 600; margin-bottom: 4px;">
                🔒 Verification Code
            </p>
            <p style="color: #0284c7; font-size: 20px; font-weight: 700; font-family: monospace; letter-spacing: 2px; margin: 8px 0;">
                {cert_id_display}
            </p>
            <p style="color: #0369a1; font-size: 12px;">
                Anyone can verify this certificate at <a href="{verify_url}" style="color: #0ea5e9;">{frontend_url}/verify-certificate</a>
            </p>
        </div>
        
        <div style="text-align: center; margin: 36px 0;">
            <a href="{verify_url}" class="button">
                Verify Certificate Online
            </a>
        </div>
        
        <p class="message" style="text-align: center; margin-top: 36px;">
            We hope to see you at future events!
        </p>
    """


def create_rejection_email_content(attendee_name: str, event_name: str, reason: str = None) -> str:
    """Create content for registration rejection email"""
    reason_section = ""
    if reason:
        reason_section = f"""
            <div class="info-box">
                <p>
                    <strong>Additional Information:</strong><br>
                    {reason}
                </p>
            </div>
        """
    
    return f"""
        <h1 class="greeting">Hello, {attendee_name}</h1>
        <p class="message">
            Thank you for your interest in <span class="highlight">{event_name}</span>. 
            We regret to inform you that we're unable to approve your registration at this time.
        </p>
        
        {reason_section}
        
        <p class="message">
            We understand this may be disappointing, and we sincerely appreciate your understanding.
        </p>
        
        <div class="card">
            <div class="card-title">
                <span>Explore Other Opportunities</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
                Discover more exciting events on our platform that might interest you.
            </p>
        </div>
        
        <div style="text-align: center; margin: 36px 0;">
            <a href="https://sinod.lexrunit.com/explore" class="button">
                Browse Events
            </a>
        </div>
        
        <p class="message" style="text-align: center; margin-top: 36px;">
            If you have any questions, our support team is here to help.
        </p>
    """


def create_document_invite_content(invitee_name: str, inviter_name: str, 
                                   document_name: str, document_url: str, 
                                   access_level: str = "Edit") -> str:
    """Create content for document collaboration invite"""
    return f"""
        <h1 class="greeting">Hello, {invitee_name}!</h1>
        <p class="message">
            <span class="highlight">{inviter_name}</span> has invited you to collaborate 
            on a document. Join the collaboration and contribute your expertise.
        </p>
        
        <div class="card">
            <div class="card-title">
                <span>Document Details</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Document</span>
                <span class="detail-value">{document_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invited By</span>
                <span class="detail-value">{inviter_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Your Access</span>
                <span class="badge badge-info">{access_level}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 36px 0;">
            <a href="{document_url}" class="button">
                Open Document
            </a>
        </div>
        
        <div class="info-box">
            <p>
                <strong>Collaboration Features:</strong><br>
                • Real-time editing with team members<br>
                • Comment and suggest changes<br>
                • Track document history and versions
            </p>
        </div>
        
        <p class="message" style="text-align: center; margin-top: 36px;">
            Great things happen when we work together!
        </p>
    """


def create_whiteboard_invite_content(invitee_name: str, inviter_name: str, 
                                     whiteboard_name: str, whiteboard_url: str) -> str:
    """Create content for whiteboard collaboration invite"""
    return f"""
        <h1 class="greeting">Hello, {invitee_name}!</h1>
        <p class="message">
            <span class="highlight">{inviter_name}</span> has invited you to collaborate 
            on a whiteboard. Let's brainstorm and create amazing ideas together!
        </p>
        
        <div class="card">
            <div class="card-title">
                <span>Whiteboard Details</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Whiteboard</span>
                <span class="detail-value">{whiteboard_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invited By</span>
                <span class="detail-value">{inviter_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="badge">Active Session</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 36px 0;">
            <a href="{whiteboard_url}" class="button">
                Join Whiteboard
            </a>
        </div>
        
        <div class="info-box">
            <p>
                <strong>What You Can Do:</strong><br>
                • Draw, sketch, and diagram ideas in real-time<br>
                • Add sticky notes, shapes, and text<br>
                • Collaborate simultaneously with team members
            </p>
        </div>
        
        <p class="message" style="text-align: center; margin-top: 36px;">
            Creativity thrives in collaboration!
        </p>
    """
