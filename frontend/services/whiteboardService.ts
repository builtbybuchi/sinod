import * as whiteboardsApi from './whiteboardsApiService';
import { Databases, ID, Query } from 'appwrite';
import appwriteClient from './appwrite';
import {
  WhiteboardModel,
  WhiteboardInvite,
  WhiteboardPresence,
  CreateWhiteboardParams,
  WhiteboardListItem,
  AcceptInviteParams,
  RejectInviteParams,
} from '../types/whiteboards';

// Appwrite collection IDs for presence (still using direct Appwrite for real-time)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRESENCE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WHITEBOARD_PRESENCE_COLLECTION_ID || 'whiteboard-presence';

const databases = new Databases(appwriteClient);

const generateUserColor = (): string => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Create a new whiteboard
 */
export const createWhiteboard = async (params: CreateWhiteboardParams, userEmail: string): Promise<WhiteboardModel> => {
  try {
    const whiteboardData = {
      title: params.title,
      content: params.initialContent || '',
      collaborators: params.collaborators || [],
      isPublic: false,
    };

    return await whiteboardsApi.createWhiteboard(whiteboardData, userEmail);
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    throw error;
  }
};

/**
 * Get a single whiteboard by ID
 */
export const getWhiteboard = async (whiteboardId: string): Promise<WhiteboardModel> => {
  try {
    return await whiteboardsApi.getWhiteboard(whiteboardId);
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    throw error;
  }
};

/**
 * List all whiteboards for a user
 */
export const listUserWhiteboards = async (userEmail: string): Promise<WhiteboardListItem[]> => {
  try {
    const response = await whiteboardsApi.listUserWhiteboards(userEmail);
    return response.documents.map(wb => ({
      $id: wb.$id,
      title: wb.title,
      createdBy: wb.createdBy,
      createdAt: wb.createdAt,
      updatedAt: wb.updatedAt,
      collaborators: wb.collaborators || [],
      isPublic: wb.isPublic || false,
      isOwner: wb.createdBy === userEmail,
    }));
  } catch (error) {
    console.error('Error listing whiteboards:', error);
    throw error;
  }
};

/**
 * Update whiteboard elements
 */
export const updateWhiteboardElements = async (
  whiteboardId: string,
  content: string
): Promise<void> => {
  try {
    await whiteboardsApi.updateWhiteboard(whiteboardId, { content });
  } catch (error) {
    console.error('Error updating whiteboard elements:', error);
    throw error;
  }
};

/**
 * Update whiteboard title
 */
export const updateWhiteboardTitle = async (
  whiteboardId: string,
  title: string
): Promise<void> => {
  try {
    await whiteboardsApi.updateWhiteboard(whiteboardId, { title });
  } catch (error) {
    console.error('Error updating whiteboard title:', error);
    throw error;
  }
};

/**
 * Delete a whiteboard
 */
export const deleteWhiteboard = async (whiteboardId: string, userEmail: string): Promise<void> => {
  try {
    await whiteboardsApi.deleteWhiteboard(whiteboardId, userEmail);
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    throw error;
  }
};


/**
 * Create a whiteboard invite
 */
export const createInvite = async (
  whiteboardId: string,
  email: string,
  invitedBy: string
): Promise<WhiteboardInvite> => {
  try {
    const inviteData = {
      whiteboardId,
      email,
      invitedBy,
      sendEmail: true,
    };

    return await whiteboardsApi.createInvite(inviteData);
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

/**
 * Get an invite by its token.
 */
export const getInviteByToken = async (token: string): Promise<WhiteboardInvite> => {
  try {
    return await whiteboardsApi.getInviteByToken(token);
  } catch (error) {
    console.error('Error fetching invite by token:', error);
    throw error;
  }
};

/**
 * List pending invites for a user
 */
export const listPendingInvites = async (email: string): Promise<WhiteboardInvite[]> => {
  try {
    const response = await whiteboardsApi.listUserInvites(email);
    return response.documents;
  } catch (error) {
    console.error('Error listing pending invites:', error);
    throw error;
  }
};

/**
 * Accept an invite
 */
export const acceptInvite = async (params: AcceptInviteParams): Promise<void> => {
  try {
    await whiteboardsApi.acceptInvite(params.token, params.userEmail);
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
};

/**
 * Reject an invite
 */
export const rejectInvite = async (params: RejectInviteParams): Promise<void> => {
  try {
    await whiteboardsApi.rejectInvite(params.token, params.userEmail);
  } catch (error) {
    console.error('Error rejecting invite:', error);
    throw error;
  }
};

/**
 * Remove a collaborator from a whiteboard
 */
export const removeCollaborator = async (
  whiteboardId: string,
  collaboratorEmail: string,
  userEmail: string
): Promise<void> => {
  try {
    await whiteboardsApi.removeCollaborator(whiteboardId, collaboratorEmail, userEmail);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
};

/**
 * Generate an invite link
 */
export const generateInviteLink = (token: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/whiteboards/invite/${token}`;
};

// ============================================
// Presence Operations
// ============================================

/**
 * Update or create whiteboard presence
 */
export const updatePresence = async (
  whiteboardId: string,
  userEmail: string,
  userName?: string
): Promise<WhiteboardPresence> => {
  try {
    const now = new Date().toISOString();

    const existingPresence = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('whiteboardId', whiteboardId),
        Query.equal('userEmail', userEmail),
        Query.limit(1)
      ]
    );

    if (existingPresence.documents.length > 0) {
      const response = await databases.updateDocument(
        DATABASE_ID,
        PRESENCE_COLLECTION_ID,
        existingPresence.documents[0].$id,
        {
          lastSeen: now,
          isActive: true,
          userName: userName || userEmail,
        }
      );
      return response as unknown as WhiteboardPresence;
    } else {
      const response = await databases.createDocument(
        DATABASE_ID,
        PRESENCE_COLLECTION_ID,
        ID.unique(),
        {
          whiteboardId,
          userEmail,
          userName: userName || userEmail,
          color: generateUserColor(),
          lastSeen: now,
          isActive: true,
        }
      );
      return response as unknown as WhiteboardPresence;
    }
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};

/**
 * List active users in a whiteboard
 */
export const listActiveUsers = async (whiteboardId: string): Promise<WhiteboardPresence[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('whiteboardId', whiteboardId),
        Query.equal('isActive', true),
        Query.limit(50)
      ]
    );

    return response.documents as unknown as WhiteboardPresence[];
  } catch (error) {
    console.error('Error listing active users:', error);
    throw error;
  }
};

/**
 * Deactivate presence when user leaves
 */
export const deactivatePresence = async (
  whiteboardId: string,
  userEmail: string
): Promise<void> => {
  try {
    const existingPresence = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('whiteboardId', whiteboardId),
        Query.equal('userEmail', userEmail),
        Query.limit(1)
      ]
    );

    if (existingPresence.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        PRESENCE_COLLECTION_ID,
        existingPresence.documents[0].$id,
        {
          isActive: false,
          lastSeen: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    console.error('Error deactivating presence:', error);
    throw error;
  }
};

// Aliases for backward compatibility
export const markInactive = deactivatePresence;
export const getWhiteboardPresence = listActiveUsers;
export const updateWhiteboardContent = updateWhiteboardElements;

