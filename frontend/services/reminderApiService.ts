/**
 * Reminder API Service
 * Handles CRUD operations for event reminders
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Types
export interface ReminderPreset {
  key: string;
  label: string;
  minutes: number;
}

export interface Reminder {
  $id: string;
  id?: string;
  event_id: string;
  offset_type: 'before_start' | 'custom';
  offset_minutes: number;
  remind_at: string | null;
  subject: string | null;
  message: string | null;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  created_by: string;
  created_at: string;
}

export interface CreateReminderData {
  event_id: string;
  offset_type?: 'before_start' | 'custom';
  offset_minutes?: number;
  remind_at?: string;
  subject?: string;
  message?: string;
  created_by: string;
}

export interface BulkCreateRemindersData {
  event_id: string;
  created_by: string;
  presets: string[];
  custom_subject?: string;
  custom_message?: string;
}

export interface UpdateReminderData {
  offset_type?: 'before_start' | 'custom';
  offset_minutes?: number;
  remind_at?: string;
  subject?: string;
  message?: string;
  status?: string;
}

// Get available reminder presets
export async function getReminderPresets(): Promise<ReminderPreset[]> {
  const response = await fetch(`${BACKEND_URL}/api/reminders/presets`);
  if (!response.ok) {
    throw new Error('Failed to fetch reminder presets');
  }
  const data = await response.json();
  return data.presets;
}

// Create a single reminder
export async function createReminder(data: CreateReminderData): Promise<Reminder> {
  const response = await fetch(`${BACKEND_URL}/api/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create reminder' }));
    throw new Error(error.detail || 'Failed to create reminder');
  }
  return response.json();
}

// Create multiple reminders at once using presets
export async function createRemindersBulk(data: BulkCreateRemindersData): Promise<{ reminders: Reminder[]; total: number }> {
  const response = await fetch(`${BACKEND_URL}/api/reminders/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create reminders' }));
    throw new Error(error.detail || 'Failed to create reminders');
  }
  return response.json();
}

// List reminders for an event
export async function listEventReminders(eventId: string, status?: string): Promise<{ reminders: Reminder[]; total: number }> {
  const url = new URL(`${BACKEND_URL}/api/reminders/event/${eventId}`);
  if (status) {
    url.searchParams.set('status', status);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  return response.json();
}

// Get a single reminder
export async function getReminder(reminderId: string): Promise<Reminder> {
  const response = await fetch(`${BACKEND_URL}/api/reminders/${reminderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reminder');
  }
  return response.json();
}

// Update a reminder
export async function updateReminder(reminderId: string, data: UpdateReminderData, userEmail: string): Promise<Reminder> {
  const url = new URL(`${BACKEND_URL}/api/reminders/${reminderId}`);
  url.searchParams.set('user_email', userEmail);
  
  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update reminder' }));
    throw new Error(error.detail || 'Failed to update reminder');
  }
  return response.json();
}

// Delete a reminder
export async function deleteReminder(reminderId: string, userEmail: string): Promise<void> {
  const url = new URL(`${BACKEND_URL}/api/reminders/${reminderId}`);
  url.searchParams.set('user_email', userEmail);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete reminder' }));
    throw new Error(error.detail || 'Failed to delete reminder');
  }
}

// Cancel a reminder
export async function cancelReminder(reminderId: string, userEmail: string): Promise<Reminder> {
  const url = new URL(`${BACKEND_URL}/api/reminders/${reminderId}/cancel`);
  url.searchParams.set('user_email', userEmail);
  
  const response = await fetch(url.toString(), {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to cancel reminder' }));
    throw new Error(error.detail || 'Failed to cancel reminder');
  }
  return response.json();
}

// Helper: Format offset to human-readable string
export function formatReminderOffset(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} before`;
  } else if (minutes < 10080) {
    const days = Math.floor(minutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''} before`;
  } else {
    const weeks = Math.floor(minutes / 10080);
    return `${weeks} week${weeks !== 1 ? 's' : ''} before`;
  }
}

// Helper: Get status badge color
export function getReminderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
