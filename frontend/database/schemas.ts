/**
 * RxDB Schemas for Sinod' Application
 * Defines the structure of all local database collections
 */

import { RxJsonSchema } from 'rxdb';

// ============================================================================
// Events Schema
// ============================================================================

export interface EventDocument {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
  maxAttendees?: number;
  meetingId?: string;
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const eventSchema: RxJsonSchema<EventDocument> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 500,
    },
    description: {
      type: 'string',
      maxLength: 5000,
    },
    date: {
      type: 'string',
      maxLength: 50, // indexed field
    },
    time: {
      type: 'string',
      maxLength: 50,
    },
    location: {
      type: 'string',
      maxLength: 500,
    },
    createdBy: {
      type: 'string',
      maxLength: 100, // indexed field
    },
    createdByName: {
      type: 'string',
      maxLength: 200,
    },
    isPublic: {
      type: 'boolean',
    },
    maxAttendees: {
      type: 'number',
    },
    meetingId: {
      type: 'string',
      maxLength: 100,
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
  },
  required: ['id', 'title', 'date', 'time', 'createdBy', 'updatedAtTimestamp', 'isPublic'],
  indexes: ['createdBy', 'date', 'updatedAtTimestamp', 'isPublic'],
};

// ============================================================================
// Attendees Schema
// ============================================================================

export interface AttendeeDocument {
  id: string;
  eventId: string;
  userEmail: string;
  userName: string;
  status: 'confirmed' | 'pending' | 'declined';
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
}

export const attendeeSchema: RxJsonSchema<AttendeeDocument> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    eventId: {
      type: 'string',
      maxLength: 100, // indexed field
    },
    userEmail: {
      type: 'string',
      maxLength: 200, // indexed field
    },
    userName: {
      type: 'string',
      maxLength: 200,
    },
    status: {
      type: 'string',
      maxLength: 50,
      enum: ['confirmed', 'pending', 'declined'],
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
  },
  required: ['id', 'eventId', 'userEmail', 'userName', 'status', 'updatedAtTimestamp'],
  indexes: ['eventId', 'userEmail', 'updatedAtTimestamp'],
};

// ============================================================================
// Documents Schema
// ============================================================================

export interface DocumentDoc {
  id: string;
  title: string;
  content: string; // Lexical JSON state
  ownerId: string;
  ownerName: string;
  collaborators: string[]; // Array of email addresses
  isPublic: boolean;
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const documentSchema: RxJsonSchema<DocumentDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 500,
    },
    content: {
      type: 'string',
      maxLength: 10000000, // 10MB for Lexical content
    },
    ownerId: {
      type: 'string',
      maxLength: 100, // indexed field
    },
    ownerName: {
      type: 'string',
      maxLength: 200,
    },
    collaborators: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200,
      },
    },
    isPublic: {
      type: 'boolean',
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
  },
  required: ['id', 'title', 'content', 'ownerId', 'updatedAtTimestamp', 'updatedAt'],
  indexes: ['ownerId', 'updatedAt', 'updatedAtTimestamp'],
};

// ============================================================================
// Whiteboards Schema
// ============================================================================

export interface WhiteboardDoc {
  id: string;
  title: string;
  elements: string; // Excalidraw elements JSON
  appState: string; // Excalidraw app state JSON
  ownerId: string;
  ownerName: string;
  collaborators: string[];
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const whiteboardSchema: RxJsonSchema<WhiteboardDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 500,
    },
    elements: {
      type: 'string',
      maxLength: 10000000, // 10MB for Excalidraw elements
    },
    appState: {
      type: 'string',
      maxLength: 100000, // 100KB for app state
    },
    ownerId: {
      type: 'string',
      maxLength: 100, // indexed field
    },
    ownerName: {
      type: 'string',
      maxLength: 200,
    },
    collaborators: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200,
      },
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
  },
  required: ['id', 'title', 'elements', 'ownerId', 'updatedAtTimestamp', 'updatedAt'],
  indexes: ['ownerId', 'updatedAt', 'updatedAtTimestamp'],
};

// ============================================================================
// Chat Conversations Schema
// ============================================================================

export interface ConversationDoc {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  participants: string[]; // email addresses
  participantNames: string[];
  createdBy: string;
  lastMessage?: string;
  lastMessageAt: string;
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const conversationSchema: RxJsonSchema<ConversationDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    type: {
      type: 'string',
      maxLength: 50,
      enum: ['direct', 'group'],
    },
    name: {
      type: 'string',
      maxLength: 300,
    },
    description: {
      type: 'string',
      maxLength: 1000,
    },
    participants: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200,
      },
    },
    participantNames: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: 200,
      },
    },
    createdBy: {
      type: 'string',
      maxLength: 100,
    },
    lastMessage: {
      type: 'string',
      maxLength: 1000,
    },
    lastMessageAt: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      maxLength: 50,
      format: 'date-time',
    },
  },
  required: ['id', 'type', 'participants', 'createdBy', 'updatedAtTimestamp', 'lastMessageAt'],
  indexes: ['updatedAtTimestamp', 'lastMessageAt'],
};

// ============================================================================
// Chat Messages Schema
// ============================================================================

export interface MessageDoc {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  isDeleted?: boolean;
  updatedAtTimestamp: string;
  createdAt: string;
}

export const messageSchema: RxJsonSchema<MessageDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    conversationId: {
      type: 'string',
      maxLength: 100, // indexed field
    },
    senderId: {
      type: 'string',
      maxLength: 100,
    },
    senderName: {
      type: 'string',
      maxLength: 200,
    },
    content: {
      type: 'string',
      maxLength: 10000, // 10KB for message content
    },
    type: {
      type: 'string',
      maxLength: 50,
      enum: ['text', 'image', 'file'],
    },
    attachmentUrl: {
      type: 'string',
      maxLength: 500,
    },
    attachmentName: {
      type: 'string',
      maxLength: 300,
    },
    isDeleted: {
      type: 'boolean',
    },
    updatedAtTimestamp: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
    createdAt: {
      type: 'string',
      maxLength: 50, // indexed field
      format: 'date-time',
    },
  },
  required: ['id', 'conversationId', 'senderId', 'content', 'updatedAtTimestamp', 'createdAt'],
  indexes: ['conversationId', 'updatedAtTimestamp', 'createdAt'],
};
