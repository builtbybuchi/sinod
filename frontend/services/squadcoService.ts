/**
 * Squadco Payment Service
 * Integration with Squadco (GTBank) for payment processing via Python backend
 */

const PYTHON_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SquadcoInitiatePaymentParams {
  amount: number; // Amount in Naira
  email: string;
  currency?: string;
  initiateType?: string;
  transactionRef?: string;
  callbackUrl?: string;
  attendeeId?: string; // Keep for metadata
  eventId?: string;   // Keep for metadata
}

interface SquadcoInitiateResponse {
  success: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
    checkout_url: string;
  };
  error?: string;
}

interface SquadcoVerifyResponse {
    success: boolean;
    message: string;
    paid: boolean;
    transactionStatus?: string;
    amount?: number;
    error?: string;
}

/**
 * Generate a unique transaction reference
 */
export const generateTransactionRef = (): string => {
  return `LYP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

/**
 * Initialize payment with Squadco via Python backend
 */
export const initiateSquadcoPayment = async (
  params: SquadcoInitiatePaymentParams
): Promise<SquadcoInitiateResponse> => {
  try {
    const payload = {
      amount: params.amount, // Backend handles conversion to kobo
      email: params.email,
      currency: params.currency || 'NGN',
      attendee_id: params.attendeeId,
      event_id: params.eventId,
    };

    console.log('Initiating payment via backend:', payload);

    const response = await fetch(`${PYTHON_BACKEND_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Backend payment response:', data);

    if (response.ok && data.success) {
      return {
        success: true,
        message: 'Payment initiated successfully',
        data: {
          authorization_url: data.checkout_url || '',
          access_code: '',
          reference: data.transaction_ref,
          checkout_url: data.checkout_url || '',
        },
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to initialize payment',
        error: data.error,
      };
    }
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
      error: error.message,
    };
  }
};

/**
 * Verify payment transaction via Python backend
 */
export const verifySquadcoPayment = async (
  transactionRef: string
): Promise<SquadcoVerifyResponse> => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_ref: transactionRef,
        attendee_id: '', // Optional - backend doesn't require it
      }),
    });

    const data = await response.json();
    console.log('Backend verification response:', data);

    if (response.ok && data.success) {
        return {
            success: true,
            message: 'Payment verified successfully',
            paid: data.paid,
            transactionStatus: data.transaction_status,
            amount: data.amount,
        };
    } else {
        return {
            success: false,
            message: data.error || 'Payment verification failed',
            paid: false,
            error: data.error,
        };
    }
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return {
        success: false,
        message: 'An unexpected error occurred during verification.',
        paid: false,
        error: error.message,
    };
  }
};

/**
 * Open Squadco payment modal (inline payment)
 */
export const openSquadcoPaymentModal = (authorizationUrl: string) => {
  // This function might not be needed if using redirect, but keeping for flexibility
  window.location.href = authorizationUrl;
};

export default {
  initiateSquadcoPayment,
  verifySquadcoPayment,
  openSquadcoPaymentModal,
  generateTransactionRef,
};
