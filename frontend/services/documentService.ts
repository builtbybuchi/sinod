/**
 * Document Service
 * Wrapper service that uses the backend API for document operations
 */

import * as documentsApi from './documentsApiService';
import { Databases, ID, Query } from 'appwrite';
import appwriteClient from './appwrite';
import {
  DocumentModel,
  DocumentInvite,
  DocumentPresence,
  CreateDocumentParams,
  InviteCollaboratorParams,
  AcceptInviteParams,
  RejectInviteParams,
  DocumentListItem,
} from '../types/documents';

// Python backend URL
const PYTHON_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Appwrite collection IDs for presence (still using direct Appwrite for real-time)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRESENCE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DOCUMENT_PRESENCE_COLLECTION_ID || 'document-presence';

const databases = new Databases(appwriteClient);

/**
 * Generate a random hex color for user presence
 */
const generateUserColor = (): string => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ============================================
// Document CRUD Operations
// ============================================

/**
 * Create a new document
 */
export const createDocument = async (params: CreateDocumentParams, userEmail: string): Promise<DocumentModel> => {
  try {
    const documentData = {
      title: params.title,
      content: params.initialContent || '',
      collaborators: params.collaborators || [],
      isPublic: false,
    };

    return await documentsApi.createDocument(documentData, userEmail);
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Get a single document by ID
 */
export const getDocument = async (documentId: string): Promise<DocumentModel> => {
  try {
    return await documentsApi.getDocument(documentId);
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

/**
 * List all documents for a user
 */
export const listUserDocuments = async (userEmail: string): Promise<DocumentListItem[]> => {
  try {
    const response = await documentsApi.listUserDocuments(userEmail);
    return response.documents.map(doc => ({
      $id: doc.$id,
      title: doc.title,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      collaborators: doc.collaborators || [],
      isPublic: doc.isPublic || false,
      isOwner: doc.createdBy === userEmail,
    }));
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

/**
 * Update document content
 */
export const updateDocumentContent = async (
  documentId: string,
  content: string
): Promise<void> => {
  try {
    if (content.length > 10 * 1024 * 1024) {
      throw new Error('Document content exceeds 10MB limit');
    }

    await documentsApi.updateDocument(documentId, { content });
  } catch (error) {
    console.error('Error updating document content:', error);
    throw error;
  }
};

/**
 * Update document title
 */
export const updateDocumentTitle = async (
  documentId: string,
  title: string
): Promise<void> => {
  try {
    await documentsApi.updateDocument(documentId, { title });
  } catch (error) {
    console.error('Error updating document title:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string, userEmail: string): Promise<void> => {
  try {
    await documentsApi.deleteDocument(documentId, userEmail);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// ============================================
// Invite Operations
// ============================================

/**
 * Create a document invite
 */
export const createInvite = async (params: {
  documentId: string;
  email: string;
  inviterEmail: string;
  inviterName?: string;
  documentTitle: string;
}): Promise<DocumentInvite> => {
  try {
    const inviteData = {
      documentId: params.documentId,
      email: params.email,
      invitedBy: params.inviterEmail,
      invitedByName: params.inviterName,
      documentTitle: params.documentTitle,
      sendEmail: true,
    };

    return await documentsApi.createInvite(inviteData);
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

/**
 * Get an invite by its token.
 */
export const getInviteByToken = async (token: string): Promise<DocumentInvite> => {
  try {
    return await documentsApi.getInviteByToken(token);
  } catch (error) {
    console.error('Error fetching invite by token:', error);
    throw error;
  }
};

/**
 * List pending invites for a user
 */
export const listPendingInvites = async (email: string): Promise<DocumentInvite[]> => {
  try {
    const response = await documentsApi.listUserInvites(email);
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
    await documentsApi.acceptInvite(params.token, params.userEmail);
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
    await documentsApi.rejectInvite(params.token, params.userEmail);
  } catch (error) {
    console.error('Error rejecting invite:', error);
    throw error;
  }
};

/**
 * Remove a collaborator from a document
 */
export const removeCollaborator = async (
  documentId: string,
  collaboratorEmail: string,
  userEmail: string
): Promise<void> => {
  try {
    await documentsApi.removeCollaborator(documentId, collaboratorEmail, userEmail);
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
  return `${baseUrl}/documents/invite/${token}`;
};

// ============================================
// Presence Operations
// ============================================

/**
 * Update or create document presence
 */
export const updatePresence = async (
  documentId: string,
  userEmail: string,
  userName?: string
): Promise<DocumentPresence> => {
  try {
    const now = new Date().toISOString();

    const existingPresence = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('documentId', documentId),
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
      return response as unknown as DocumentPresence;
    } else {
      const response = await databases.createDocument(
        DATABASE_ID,
        PRESENCE_COLLECTION_ID,
        ID.unique(),
        {
          documentId,
          userEmail,
          userName: userName || userEmail,
          color: generateUserColor(),
          lastSeen: now,
          isActive: true,
        }
      );
      return response as unknown as DocumentPresence;
    }
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};

/**
 * List active users in a document
 */
export const listActiveUsers = async (documentId: string): Promise<DocumentPresence[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('documentId', documentId),
        Query.equal('isActive', true),
        Query.limit(50)
      ]
    );

    return response.documents as unknown as DocumentPresence[];
  } catch (error) {
    console.error('Error listing active users:', error);
    throw error;
  }
};

/**
 * Deactivate presence when user leaves
 */
export const deactivatePresence = async (
  documentId: string,
  userEmail: string
): Promise<void> => {
  try {
    const existingPresence = await databases.listDocuments(
      DATABASE_ID,
      PRESENCE_COLLECTION_ID,
      [
        Query.equal('documentId', documentId),
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
