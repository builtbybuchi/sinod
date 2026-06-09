const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
  event_id?: string;
  reason?: string;
}

export async function submitContactMessage(payload: ContactMessagePayload): Promise<{ success: boolean; id?: string }> {
  const response = await fetch(`${BACKEND_URL}/contact-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to submit message');
  }

  return response.json();
}

export default {
  submitContactMessage,
};
