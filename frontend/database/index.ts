/**
 * RxDB Database Initialization
 * Creates and configures the local IndexedDB database
 */

import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

// Import schemas
import {
  eventSchema,
  attendeeSchema,
  documentSchema,
  whiteboardSchema,
  conversationSchema,
  messageSchema,
  EventDocument,
  AttendeeDocument,
  DocumentDoc,
  WhiteboardDoc,
  ConversationDoc,
  MessageDoc,
} from './schemas';

// Add RxDB plugins (only in development)
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
  // Disable dev-mode warnings to reduce console noise
  disableWarnings();
}
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Database collections type
export interface SinodCollections {
  events: any;
  attendees: any;
  documents: any;
  whiteboards: any;
  conversations: any;
  messages: any;
}

export type SinodDatabase = RxDatabase<SinodCollections>;

let dbPromise: Promise<SinodDatabase> | null = null;

/**
 * Initialize the RxDB database
 * Creates all collections with their schemas
 */
export const initDatabase = async (): Promise<SinodDatabase> => {
  // Return existing database if already initialized
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    // Create the database with validated storage in development, plain storage in production
    const storage = process.env.NODE_ENV === 'development'
      ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() })
      : getRxStorageDexie();

    const db = await createRxDatabase<SinodCollections>({
      name: 'sinod_db',
      storage,
      multiInstance: true,
      eventReduce: true,
      ignoreDuplicate: true,
    });

    // Add collections
    await db.addCollections({
      events: {
        schema: eventSchema,
      },
      attendees: {
        schema: attendeeSchema,
      },
      documents: {
        schema: documentSchema,
      },
      whiteboards: {
        schema: whiteboardSchema,
      },
      conversations: {
        schema: conversationSchema,
      },
      messages: {
        schema: messageSchema,
      },
    });

    // Set up hooks for automatic timestamp updates
    setupHooks(db);

    return db;
  })();

  return dbPromise;
};

/**
 * Set up database hooks for automatic field updates
 */
const setupHooks = (db: SinodDatabase) => {
  // Auto-update updatedAtTimestamp on every change
  const collections = ['events', 'attendees', 'documents', 'whiteboards', 'conversations', 'messages'];
  
  collections.forEach((collectionName) => {
    const collection = (db as any)[collectionName];
    
    // Pre-insert hook: set timestamps
    collection.preInsert((docData: any) => {
      const now = new Date().toISOString();
      if (!docData.updatedAtTimestamp) {
        docData.updatedAtTimestamp = now;
      }
      if (!docData.createdAt) {
        docData.createdAt = now;
      }
      if (!docData.updatedAt && collectionName !== 'messages') {
        docData.updatedAt = now;
      }
    }, false);

    // Pre-save hook: update updatedAtTimestamp and updatedAt
    collection.preSave((docData: any) => {
      const now = new Date().toISOString();
      docData.updatedAtTimestamp = now;
      if (collectionName !== 'messages') {
        docData.updatedAt = now;
      }
    }, false);
  });
};

/**
 * Get the database instance
 * Initializes if not already created
 */
export const getDatabase = async (): Promise<SinodDatabase> => {
  return initDatabase();
};

/**
 * Destroy the database (for testing/reset)
 */
export const destroyDatabase = async () => {
  if (dbPromise) {
    const db = await dbPromise;
    await db.remove();
    dbPromise = null;
    console.log('🗑️ Database destroyed');
  }
};

/**
 * Clear all data from the database (keep structure)
 */
export const clearDatabase = async () => {
  const db = await getDatabase();
  
  const collections = ['events', 'attendees', 'documents', 'whiteboards', 'conversations', 'messages'];
  
  for (const collectionName of collections) {
    const collection = (db as any)[collectionName];
    await collection.remove();
  }
  
  console.log('🧹 Database cleared');
};
