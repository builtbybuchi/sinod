/**
 * Events API Service - Frontend
 * Handles all event and attendee operations through Python backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Event {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  event_name: string;
  event_description?: string;
  event_address?: string;
  event_time: string;
  event_end_time?: string;
  user_email: string;
  virtual_status: boolean;
  public_status: boolean;
  paid: boolean;
  event_price?: number;
  event_url?: string;
  city?: string;
  event_page_url?: string;
  has_custom_questions?: boolean;
  custom_questions?: string;
  fee_bearer?: string; // 'host' or 'attendee'
}

export interface Attendee {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  registration_id: string;
  paid: boolean;
  approved: boolean;
  verified: boolean;
  verified_at?: string;
  custom_responses?: string;
}

export interface CreateEventData {
  event_name: string;
  event_description?: string;
  event_address?: string;
  event_time: string;
  event_end_time?: string;
  user_email: string;
  virtual_status: boolean;
  public_status: boolean;
  paid: boolean;
  event_price?: number;
  event_url?: string;
  city?: string;
  event_page_url?: string;
  has_custom_questions?: boolean;
  custom_questions?: string;
  auto_approve?: boolean;
  // Enhanced ticket types
  ticket_types?: string;
  allow_group_registration?: boolean;
  max_group_size?: number;
  coupons?: string;
  // Theme & customization
  theme?: string;
  primary_color?: string;
  font_family?: string;
  logo_url?: string;
  bg_color?: string;
  text_color?: string;
  // Fee bearer
  fee_bearer?: string; // 'host' or 'attendee'
}

export interface UpdateEventData {
  event_name?: string;
  event_description?: string;
  event_address?: string;
  event_time?: string;
  event_end_time?: string;
  virtual_status?: boolean;
  public_status?: boolean;
  paid?: boolean;
  event_price?: number;
  event_url?: string;
  city?: string;
  fee_bearer?: string;
  bg_color?: string;
  text_color?: string;
}

export interface RegisterAttendeeData {
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  paid: boolean;
  approved?: boolean;
  verified?: boolean;
  registration_id?: string;
  custom_responses?: string;
  ticket_type_id?: string;
  ticket_name?: string;
  amount_paid?: number;
  coupon_code?: string;
  coupon_discount?: number;
}

export interface UpdateAttendeeData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  paid?: boolean;
  approved?: boolean;
  verified?: boolean;
  verified_at?: string;
}

export interface ExploreFilters {
  city?: string;
  isPaid?: boolean;
  isVirtual?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

/**
 * Create a new event
 */
export async function createEvent(eventData: CreateEventData): Promise<Event> {
  const response = await fetch(`${BACKEND_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create event');
  }

  return response.json();
}

/**
 * List events for a specific user
 */
export async function listUserEvents(
  userEmail: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ documents: Event[]; total: number }> {
  const params = new URLSearchParams({
    user_email: userEmail,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${BACKEND_URL}/events?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list events');
  }

  return response.json();
}

/**
 * List events that a user is registered for as an attendee
 */
export async function listRegisteredEvents(
  userEmail: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ documents: Event[]; total: number }> {
  const params = new URLSearchParams({
    user_email: userEmail,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${BACKEND_URL}/events/registered/user?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list registered events');
  }

  return response.json();
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event> {
  const response = await fetch(`${BACKEND_URL}/events/${eventId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get event');
  }

  return response.json();
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  updateData: UpdateEventData
): Promise<Event> {
  const response = await fetch(`${BACKEND_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update event');
  }

  return response.json();
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string, userEmail: string, reason?: string): Promise<void> {
  const params = new URLSearchParams({ user_email: userEmail });
  if (reason) params.append('reason', reason);

  const response = await fetch(`${BACKEND_URL}/events/${eventId}?${params}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete event');
  }
}

/**
 * Explore public events with filters
 */
export async function exploreEvents(
  filters: ExploreFilters = {}
): Promise<{ documents: Event[]; total: number }> {
  const params = new URLSearchParams();

  if (filters.city) params.append('city', filters.city);
  if (filters.isPaid !== undefined) params.append('isPaid', filters.isPaid.toString());
  if (filters.isVirtual !== undefined) params.append('isVirtual', filters.isVirtual.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`${BACKEND_URL}/events/explore/all?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to explore events');
  }

  return response.json();
}

/**
 * Get events for a specific city
 */
export async function getEventsByCity(
  city: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ documents: Event[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${BACKEND_URL}/events/explore/city/${city}?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get events by city');
  }

  return response.json();
}

// ============================================================================
// ATTENDEE OPERATIONS
// ============================================================================

/**
 * Register an attendee for an event
 */
export async function registerAttendee(attendeeData: RegisterAttendeeData): Promise<Attendee> {
  const { event_id, ...data } = attendeeData;

  const response = await fetch(`${BACKEND_URL}/events/${event_id}/attendees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to register attendee');
  }

  return response.json();
}

/**
 * List attendees for an event
 */
export async function listEventAttendees(
  eventId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ documents: Attendee[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${BACKEND_URL}/events/${eventId}/attendees?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list attendees');
  }

  return response.json();
}

/**
 * Get a specific attendee
 */
export async function getAttendee(eventId: string, attendeeId: string): Promise<Attendee> {
  const response = await fetch(`${BACKEND_URL}/events/${eventId}/attendees/${attendeeId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get attendee');
  }

  return response.json();
}

/**
 * Update an attendee's information
 */
export async function updateAttendee(
  eventId: string,
  attendeeId: string,
  updateData: UpdateAttendeeData
): Promise<Attendee> {
  const response = await fetch(`${BACKEND_URL}/events/${eventId}/attendees/${attendeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update attendee');
  }

  return response.json();
}

/**
 * Delete an attendee registration
 */
export async function deleteAttendee(eventId: string, attendeeId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/events/${eventId}/attendees/${attendeeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete attendee');
  }
}

/**
 * Verify an attendee
 */
export async function verifyAttendee(eventId: string, attendeeId: string): Promise<Attendee> {
  const params = new URLSearchParams({ attendee_id: attendeeId });

  const response = await fetch(`${BACKEND_URL}/events/${eventId}/attendees/verify?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to verify attendee');
  }

  return response.json();
}

export default {
  // Event operations
  createEvent,
  listUserEvents,
  listRegisteredEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  exploreEvents,
  getEventsByCity,

  // Attendee operations
  registerAttendee,
  listEventAttendees,
  getAttendee,
  updateAttendee,
  deleteAttendee,
  verifyAttendee,

  // Refund operations
  requestRefund,
  checkRefundStatus,
  listRefunds,
};

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

export interface RefundRequestData {
  attendee_email: string;
  event_id: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  message: string;
  refund_id?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface RefundStatusResult {
  success: boolean;
  has_refund: boolean;
  refund_id?: string;
  status?: string;
  amount?: number;
  requested_at?: string;
}

/**
 * Request a refund for an event registration
 */
export async function requestRefund(data: RefundRequestData): Promise<RefundResult> {
  const response = await fetch(`${BACKEND_URL}/refund/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to request refund');
  }

  return response.json();
}

/**
 * Check refund status for a specific attendee + event
 */
export async function checkRefundStatus(attendeeEmail: string, eventId: string): Promise<RefundStatusResult> {
  const params = new URLSearchParams({
    attendee_email: attendeeEmail,
    event_id: eventId,
  });

  const response = await fetch(`${BACKEND_URL}/refund/status?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check refund status');
  }

  return response.json();
}

/**
 * List refund requests (for admin, host, or attendee)
 */
export async function listRefunds(filters: {
  event_id?: string;
  attendee_email?: string;
  host_email?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ success: boolean; refunds: any[]; total: number }> {
  const params = new URLSearchParams();

  if (filters.event_id) params.append('event_id', filters.event_id);
  if (filters.attendee_email) params.append('attendee_email', filters.attendee_email);
  if (filters.host_email) params.append('host_email', filters.host_email);
  if (filters.status) params.append('status', filters.status);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await fetch(`${BACKEND_URL}/refund/list?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list refunds');
  }

  return response.json();
}

/**
 * Admin action on a refund (approve / reject)
 */
export async function adminRefundAction(data: {
  refund_id: string;
  action: 'approve' | 'reject';
  admin_email: string;
  admin_note?: string;
}): Promise<RefundResult> {
  const response = await fetch(`${BACKEND_URL}/refund/admin/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to process refund action');
  }

  return response.json();
}
