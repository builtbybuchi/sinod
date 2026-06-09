/**
 * Document collaboration types
 */

export interface DocumentModel {
  $id: string;
  title: string;
  content: string; // Serialized Yjs document (JSON-encoded)
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  collaborators: string[]; // Array of user emails
  isPublic: boolean;
}

export interface DocumentInvite {
  $id: string;
  documentId: string;
  email: string;
  invitedBy: string; // email of inviter
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  token: string; // unique token for invite link
  createdAt: string;
  respondedAt?: string;
  documentTitle?: string; // cached for easy display
}

export interface DocumentPresence {
  $id: string;
  documentId: string;
  userEmail: string;
  userName?: string;
  color: string; // hex color for cursor/avatar
  lastSeen: string;
  isActive: boolean;
}

export interface DocumentUpdate {
  $id: string;
  documentId: string;
  userEmail: string;
  updateData: string; // Yjs update encoded as base64
  timestamp: string;
}

export interface CollaboratorInfo {
  email: string;
  name?: string;
  isActive: boolean;
  color: string;
  lastSeen?: string;
}

export interface DocumentListItem {
  $id: string;
  title: string;
  createdBy: string;
  updatedAt: string;
  collaborators: string[];
  isOwner: boolean;
  hasUnreadInvites?: boolean;
}

export interface CreateDocumentParams {
  title: string;
  initialContent?: string;
  collaborators?: string[];
}

export interface InviteCollaboratorParams {
  documentId: string;
  email: string;
  inviterEmail: string;
  inviterName?: string;
  documentTitle: string;
}

export interface AcceptInviteParams {
  token: string;
  userEmail: string;
}

export interface RejectInviteParams {
  token: string;
  userEmail: string;
}
