/**
 * Type definitions for the Whiteboard Collaboration System
 */

/**
 * Main whiteboard model stored in Appwrite
 */
export interface WhiteboardModel {
  $id: string;
  title: string;
  content: string; // Serialized Excalidraw scene data
  createdBy: string; // User email
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  collaborators: string[]; // Array of user emails
  isPublic: boolean;
}

/**
 * Whiteboard invite model
 */
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

/**
 * Real-time presence tracking for whiteboard users
 */
export interface WhiteboardPresence {
  $id: string;
  whiteboardId: string;
  userEmail: string;
  color: string; // Hex color for cursor/selection
  lastSeen: string;
  isActive: boolean;
}

/**
 * Simplified whiteboard info for list views
 */
export interface WhiteboardListItem {
  $id: string;
  title: string;
  createdBy: string;
  updatedAt: string;
  collaborators: string[];
  isOwner: boolean;
  hasUnreadInvites?: boolean;
}

/**
 * Parameters for creating a new whiteboard
 */
export interface CreateWhiteboardParams {
  title: string;
  initialContent?: string;
  collaborators?: string[];
}

/**
 * Collaborator information
 */
export interface CollaboratorInfo {
  email: string;
  color: string;
  isActive: boolean;
}

/**
 * Parameters for accepting an invite
 */
export interface AcceptWhiteboardInviteParams {
  token: string;
  userEmail: string;
}

/**
 * Parameters for rejecting an invite
 */
export interface RejectWhiteboardInviteParams {
  token: string;
  userEmail: string;
}
