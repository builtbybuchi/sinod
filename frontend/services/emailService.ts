const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SendRegistrationEmailParams {
  registrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  eventName: string;
  eventTime: string;
  eventEndTime?: string;
  eventAddress?: string;
  eventUrl?: string;
  isVirtual: boolean;
  isPaid: boolean;
  amount?: number;
  city?: string;
  eventPageUrl: string;
}

/**
 * Send registration confirmation email via Python backend
 * Backend handles QR code generation and email sending securely
 */
export const sendRegistrationEmail = async (
  params: SendRegistrationEmailParams
): Promise<{ success: boolean; message: string; emailId?: string; error?: string }> => {
  try {
    // Format the event location
    const eventLocation = params.isVirtual 
      ? 'Virtual Event' 
      : params.eventAddress || 'Address to be announced';

    // Prepare request payload for backend
    const payload = {
      to_email: params.email,
      attendee_name: `${params.firstName} ${params.lastName}`,
      event_name: params.eventName,
      event_time: new Date(params.eventTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      event_location: eventLocation,
      registration_id: params.registrationId,
      event_page_url: params.eventPageUrl,
      price_paid: params.amount || null,
      is_paid_event: params.isPaid || false,
    };

    console.log('Sending email via backend:', payload);

    const response = await fetch(`${BACKEND_URL}/email/send-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('Email sent successfully via backend:', data);
      return {
        success: true,
        message: data.message || 'Registration email sent successfully',
        emailId: data.email_id,
      };
    } else {
      console.error('Failed to send email:', data);
      return {
        success: false,
        message: data.error || 'Failed to send registration email',
        error: data.error,
      };
    }
  } catch (error: any) {
    console.error('Error sending registration email:', error);
    return {
      success: false,
      message: 'Network error. Please check if backend is running.',
      error: error.message,
    };
  }
};

interface WelcomeEmailParams {
  email: string;
  name: string;
}

/**
 * Send welcome email to new users via Python backend
 */
export const sendWelcomeEmail = async (
  params: WelcomeEmailParams
): Promise<{ success: boolean; message: string; emailId?: string; error?: string }> => {
  try {
    const payload = {
      to_email: params.email,
      user_name: params.name,
    };

    console.log('Sending welcome email via backend:', payload);

    const response = await fetch(`${BACKEND_URL}/email/send-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('Welcome email sent successfully:', data);
      return {
        success: true,
        message: data.message || 'Welcome email sent successfully',
        emailId: data.email_id,
      };
    } else {
      console.error('Failed to send welcome email:', data);
      return {
        success: false,
        message: data.error || 'Failed to send welcome email',
        error: data.error,
      };
    }
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      message: 'Network error. Please check if backend is running.',
      error: error.message,
    };
  }
};

export default {
  sendRegistrationEmail,
  sendWelcomeEmail,
};
