/**
 * Forms API Service - Frontend
 * Handles all form CRUD and response operations through Python backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Form {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  title: string;
  description?: string;
  questions: string; // JSON string of FormQuestion[]
  created_by: string;
  status: 'draft' | 'active' | 'closed';
  is_public: boolean;
  event_id?: string;
  page_url?: string;
  response_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFormData {
  title: string;
  description?: string;
  questions: FormQuestion[];
  created_by: string;
  status?: 'draft' | 'active' | 'closed';
  is_public?: boolean;
  event_id?: string;
  page_url?: string;
}

export interface UpdateFormData {
  title?: string;
  description?: string;
  questions?: FormQuestion[];
  status?: 'draft' | 'active' | 'closed';
  is_public?: boolean;
}

export interface FormSubmissionData {
  respondent_email?: string;
  respondent_name?: string;
  answers: Record<string, any>;
}

export interface FormResponse {
  $id: string;
  $createdAt?: string;
  form_id: string;
  respondent_email?: string;
  respondent_name?: string;
  answers: string; // JSON string
  submitted_at?: string;
}

// ============================================================================
// FORM CRUD
// ============================================================================

export async function createForm(data: CreateFormData): Promise<Form> {
  const response = await fetch(`${BACKEND_URL}/api/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create form');
  }
  return response.json();
}

export async function listForms(params?: {
  created_by?: string;
  event_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ documents: Form[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.created_by) searchParams.set('created_by', params.created_by);
  if (params?.event_id) searchParams.set('event_id', params.event_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`${BACKEND_URL}/api/forms?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list forms');
  }
  return response.json();
}

export async function getForm(formId: string): Promise<Form> {
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get form');
  }
  return response.json();
}

export async function updateForm(formId: string, data: UpdateFormData, userEmail: string): Promise<Form> {
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update form');
  }
  return response.json();
}

export async function deleteForm(formId: string, userEmail: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}?user_email=${encodeURIComponent(userEmail)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete form');
  }
}

// ============================================================================
// FORM RESPONSES
// ============================================================================

export async function submitFormResponse(formId: string, data: FormSubmissionData): Promise<FormResponse> {
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit response');
  }
  return response.json();
}

export async function listFormResponses(
  formId: string,
  limit = 100,
  offset = 0
): Promise<{ documents: FormResponse[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list responses');
  }
  return response.json();
}

export async function deleteFormResponse(formId: string, responseId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses/${responseId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete response');
  }
}
