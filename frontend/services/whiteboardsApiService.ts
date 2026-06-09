/**
 * Whiteboards API Service
 * Frontend service for whiteboard collaboration through backend API
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPES
// ============================================================================

export interface Whiteboard {
  $id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  collaborators: string[];
  isPublic: boolean;
}

export interface CreateWhiteboardData {
  title: string;
  content?: string;
  collaborators?: string[];
  isPublic?: boolean;
}

export interface UpdateWhiteboardData {
  title?: string;
  content?: string;
  collaborators?: string[];
  isPublic?: boolean;
}

export interface WhiteboardInvite {
  $id: string;
  whiteboardId: string;
  email: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateWhiteboardInviteData {
  whiteboardId: string;
  email: string;
  invitedBy: string;
}

// ============================================================================
// WHITEBOARD CRUD OPERATIONS
// ============================================================================

/**
 * Create a new whiteboard
 */
export async function createWhiteboard(
  whiteboardData: CreateWhiteboardData,
  userEmail: string
): Promise<Whiteboard> {
  const params = new URLSearchParams({ user_email: userEmail });
  
  const response = await fetch(`${BACKEND_URL}/api/whiteboards?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(whiteboardData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create whiteboard');
  }

  return response.json();
}

/**
 * List whiteboards for a user
 */
export async function listUserWhiteboards(
  userEmail: string
): Promise<{ documents: Whiteboard[]; total: number }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list whiteboards');
  }

  return response.json();
}

/**
 * Get a single whiteboard by ID
 */
export async function getWhiteboard(whiteboardId: string): Promise<Whiteboard> {
  const response = await fetch(`${BACKEND_URL}/api/whiteboards/${whiteboardId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get whiteboard');
  }

  return response.json();
}

/**
 * Update an existing whiteboard
 */
export async function updateWhiteboard(
  whiteboardId: string,
  updateData: UpdateWhiteboardData
): Promise<Whiteboard> {
  const response = await fetch(`${BACKEND_URL}/api/whiteboards/${whiteboardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update whiteboard');
  }

  return response.json();
}

/**
 * Delete a whiteboard
 */
export async function deleteWhiteboard(
  whiteboardId: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards/${whiteboardId}?${params}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete whiteboard');
  }
}

// ============================================================================
// COLLABORATION OPERATIONS
// ============================================================================

/**
 * Add a collaborator to a whiteboard
 */
export async function addCollaborator(
  whiteboardId: string,
  email: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({
    email: email,
    user_email: userEmail,
  });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards/${whiteboardId}/collaborators?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add collaborator');
  }
}

/**
 * Remove a collaborator from a whiteboard
 */
export async function removeCollaborator(
  whiteboardId: string,
  email: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(
    `${BACKEND_URL}/api/whiteboards/${whiteboardId}/collaborators/${email}?${params}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to remove collaborator');
  }
}

// ============================================================================
// INVITE OPERATIONS
// ============================================================================

/**
 * Create a whiteboard collaboration invite
 */
export async function createInvite(inviteData: CreateWhiteboardInviteData): Promise<WhiteboardInvite> {
  const response = await fetch(`${BACKEND_URL}/api/whiteboards/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inviteData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create invite');
  }

  return response.json();
}

/**
 * List pending invites for a user
 */
export async function listUserInvites(
  userEmail: string
): Promise<{ documents: WhiteboardInvite[]; total: number }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards/invites?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list invites');
  }

  return response.json();
}

/**
 * Get a whiteboard collaboration invite by its token
 */
export async function getInviteByToken(token: string): Promise<WhiteboardInvite> {
  const response = await fetch(`${BACKEND_URL}/api/whiteboards/invites/${token}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get invite');
  }

  return response.json();
}

/**
 * Accept a whiteboard collaboration invite
 */
export async function acceptInvite(
  token: string,
  userEmail: string
): Promise<{ message: string; whiteboardId: string }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards/invites/${token}/accept?${params}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to accept invite');
  }

  return response.json();
}

/**
 * Reject a whiteboard collaboration invite
 */
export async function rejectInvite(
  token: string,
  userEmail: string
): Promise<{ message: string }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/whiteboards/invites/${token}/reject?${params}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reject invite');
  }

  return response.json();
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // CRUD operations
  createWhiteboard,
  listUserWhiteboards,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,

  // Collaboration operations
  addCollaborator,
  removeCollaborator,

  // Invite operations
  createInvite,
  listUserInvites,
  acceptInvite,
  rejectInvite,
};
