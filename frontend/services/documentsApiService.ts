/**
 * Documents API Service
 * Frontend service for document collaboration through backend API
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  $id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  collaborators: string[];
  isPublic: boolean;
}

export interface CreateDocumentData {
  title: string;
  content?: string;
  collaborators?: string[];
  isPublic?: boolean;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  collaborators?: string[];
  isPublic?: boolean;
}

export interface DocumentInvite {
  $id: string;
  documentId: string;
  email: string;
  invitedBy: string;
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  token: string;
  createdAt: string;
  respondedAt?: string;
  documentTitle?: string;
}

export interface CreateInviteData {
  documentId: string;
  email: string;
  invitedBy: string;
  invitedByName?: string;
  documentTitle: string;
}

// ============================================================================
// DOCUMENT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new document
 */
export async function createDocument(
  documentData: CreateDocumentData,
  userEmail: string
): Promise<Document> {
  const params = new URLSearchParams({ user_email: userEmail });
  
  const response = await fetch(`${BACKEND_URL}/api/documents?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create document');
  }

  return response.json();
}

/**
 * List documents for a user
 */
export async function listUserDocuments(
  userEmail: string
): Promise<{ documents: Document[]; total: number }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/documents?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list documents');
  }

  return response.json();
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document> {
  const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get document');
  }

  return response.json();
}

/**
 * Update an existing document
 */
export async function updateDocument(
  documentId: string,
  updateData: UpdateDocumentData
): Promise<Document> {
  const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update document');
  }

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(
  documentId: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}?${params}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete document');
  }
}

// ============================================================================
// COLLABORATION OPERATIONS
// ============================================================================

/**
 * Add a collaborator to a document
 */
export async function addCollaborator(
  documentId: string,
  email: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({
    email: email,
    user_email: userEmail,
  });

  const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}/collaborators?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add collaborator');
  }
}

/**
 * Remove a collaborator from a document
 */
export async function removeCollaborator(
  documentId: string,
  email: string,
  userEmail: string
): Promise<void> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(
    `${BACKEND_URL}/api/documents/${documentId}/collaborators/${email}?${params}`,
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
 * Create a document collaboration invite
 */
export async function createInvite(inviteData: CreateInviteData): Promise<DocumentInvite> {
  const response = await fetch(`${BACKEND_URL}/api/documents/invites`, {
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
): Promise<{ documents: DocumentInvite[]; total: number }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/documents/invites?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list invites');
  }

  return response.json();
}

/**
 * Get a document collaboration invite by its token
 */
export async function getInviteByToken(token: string): Promise<DocumentInvite> {
  const response = await fetch(`${BACKEND_URL}/api/documents/invites/${token}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get invite');
  }

  return response.json();
}



/**
 * Accept a document collaboration invite
 */
export async function acceptInvite(
  token: string,
  userEmail: string
): Promise<{ message: string; documentId: string }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/documents/invites/${token}/accept?${params}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to accept invite');
  }

  return response.json();
}

/**
 * Reject a document collaboration invite
 */
export async function rejectInvite(
  token: string,
  userEmail: string
): Promise<{ message: string }> {
  const params = new URLSearchParams({ user_email: userEmail });

  const response = await fetch(`${BACKEND_URL}/api/documents/invites/${token}/reject?${params}`, {
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
  createDocument,
  listUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,

  // Collaboration operations
  addCollaborator,
  removeCollaborator,

  // Invite operations
  createInvite,
  listUserInvites,
  getInviteByToken,
  acceptInvite,
  rejectInvite,
};
