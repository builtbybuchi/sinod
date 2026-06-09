/**
 * RxDB Replication Handlers
 * Custom replication logic for syncing with Appwrite
 */

import client from '../services/appwrite';
import { Databases, Query } from 'appwrite';
import { RxCollection, RxDocument } from 'rxdb';

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

interface ReplicationOptions {
  collection: RxCollection;
  collectionId: string;
  pullBatchSize?: number;
  pushBatchSize?: number;
  live?: boolean;
}

interface ReplicationState {
  lastPullTimestamp: number;
  lastPushTimestamp: number;
  isPulling: boolean;
  isPushing: boolean;
  error: Error | null;
}

/**
 * Pull documents from Appwrite to RxDB
 */
export async function pullFromAppwrite(
  collection: RxCollection,
  collectionId: string,
  lastPullTimestamp: number,
  batchSize: number = 100
): Promise<{ documents: any[]; hasMore: boolean; checkpoint: number }> {
  try {
    console.log(`📥 Pulling from Appwrite ${collectionId} since ${new Date(lastPullTimestamp).toISOString()}`);

    // Query documents updated after last pull
    const queries = [
      Query.orderDesc('_updated_at'),
      Query.limit(batchSize),
    ];

    if (lastPullTimestamp > 0) {
      queries.push(Query.greaterThan('_updated_at', lastPullTimestamp));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      queries
    );

    const documents = response.documents.map(doc => ({
      ...doc,
      id: doc.$id, // RxDB uses 'id' as primary key
      _updated_at: new Date(doc.$updatedAt).getTime(),
    }));

    // Upsert documents into RxDB
    for (const doc of documents) {
      const existing = await collection.findOne(doc.id).exec();
      if (existing) {
        // Update if remote is newer
        if (doc._updated_at > existing._updated_at) {
          await existing.update({ $set: doc });
        }
      } else {
        // Insert new document
        await collection.insert(doc);
      }
    }

    const hasMore = response.documents.length === batchSize;
    const checkpoint = documents.length > 0
      ? Math.max(...documents.map(d => d._updated_at))
      : lastPullTimestamp;

    console.log(`✅ Pulled ${documents.length} documents, hasMore: ${hasMore}`);

    return { documents, hasMore, checkpoint };
  } catch (error) {
    console.error(`❌ Pull error for ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Push local changes to Appwrite
 */
export async function pushToAppwrite(
  collection: RxCollection,
  collectionId: string,
  lastPushTimestamp: number
): Promise<{ pushedCount: number; checkpoint: number }> {
  try {
    console.log(`📤 Pushing to Appwrite ${collectionId} since ${new Date(lastPushTimestamp).toISOString()}`);

    // Find documents modified locally since last push
    const modifiedDocs = await collection
      .find({
        selector: {
          _updated_at: { $gt: lastPushTimestamp },
        },
      })
      .exec();

    let pushedCount = 0;

    for (const doc of modifiedDocs) {
      try {
        const data = doc.toJSON();
        
        // Remove RxDB-specific fields
        const { id, _rev, _deleted, _updated_at, ...appwriteData } = data;

        if (_deleted) {
          // Delete from Appwrite
          try {
            await databases.deleteDocument(DATABASE_ID, collectionId, id);
            console.log(`🗑️ Deleted document ${id} from Appwrite`);
          } catch (err: any) {
            if (err.code !== 404) throw err; // Ignore if already deleted
          }
        } else {
          // Check if document exists in Appwrite
          try {
            await databases.getDocument(DATABASE_ID, collectionId, id);
            // Update existing document
            await databases.updateDocument(DATABASE_ID, collectionId, id, appwriteData);
            console.log(`✏️ Updated document ${id} in Appwrite`);
          } catch (err: any) {
            if (err.code === 404) {
              // Create new document
              await databases.createDocument(DATABASE_ID, collectionId, id, appwriteData);
              console.log(`➕ Created document ${id} in Appwrite`);
            } else {
              throw err;
            }
          }
        }

        pushedCount++;
      } catch (error) {
        console.error(`Failed to push document ${doc.id}:`, error);
        // Continue with other documents
      }
    }

    const checkpoint = Date.now();
    console.log(`✅ Pushed ${pushedCount} documents`);

    return { pushedCount, checkpoint };
  } catch (error) {
    console.error(`❌ Push error for ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Set up bidirectional replication for a collection
 */
export function setupReplication(options: ReplicationOptions): {
  start: () => void;
  stop: () => void;
  getState: () => ReplicationState;
} {
  const {
    collection,
    collectionId,
    pullBatchSize = 100,
    pushBatchSize = 50,
    live = true,
  } = options;

  const state: ReplicationState = {
    lastPullTimestamp: 0,
    lastPushTimestamp: 0,
    isPulling: false,
    isPushing: false,
    error: null,
  };

  let pullInterval: NodeJS.Timeout | null = null;
  let pushInterval: NodeJS.Timeout | null = null;

  async function doPull() {
    if (state.isPulling) return;

    state.isPulling = true;
    state.error = null;

    try {
      let hasMore = true;
      let currentCheckpoint = state.lastPullTimestamp;

      while (hasMore) {
        const result = await pullFromAppwrite(
          collection,
          collectionId,
          currentCheckpoint,
          pullBatchSize
        );

        hasMore = result.hasMore;
        currentCheckpoint = result.checkpoint;
        state.lastPullTimestamp = currentCheckpoint;

        // Save checkpoint to localStorage
        localStorage.setItem(
          `rxdb_pull_checkpoint_${collectionId}`,
          currentCheckpoint.toString()
        );
      }
    } catch (error) {
      state.error = error instanceof Error ? error : new Error('Pull failed');
      console.error('Pull replication error:', error);
    } finally {
      state.isPulling = false;
    }
  }

  async function doPush() {
    if (state.isPushing) return;

    state.isPushing = true;
    state.error = null;

    try {
      const result = await pushToAppwrite(
        collection,
        collectionId,
        state.lastPushTimestamp
      );

      state.lastPushTimestamp = result.checkpoint;

      // Save checkpoint to localStorage
      localStorage.setItem(
        `rxdb_push_checkpoint_${collectionId}`,
        result.checkpoint.toString()
      );
    } catch (error) {
      state.error = error instanceof Error ? error : new Error('Push failed');
      console.error('Push replication error:', error);
    } finally {
      state.isPushing = false;
    }
  }

  function start() {
    // Load checkpoints from localStorage
    const savedPullCheckpoint = localStorage.getItem(`rxdb_pull_checkpoint_${collectionId}`);
    const savedPushCheckpoint = localStorage.getItem(`rxdb_push_checkpoint_${collectionId}`);

    if (savedPullCheckpoint) {
      state.lastPullTimestamp = parseInt(savedPullCheckpoint, 10);
    }

    if (savedPushCheckpoint) {
      state.lastPushTimestamp = parseInt(savedPushCheckpoint, 10);
    }

    console.log(`🔄 Starting replication for ${collectionId}`);
    console.log(`   Last pull: ${new Date(state.lastPullTimestamp).toISOString()}`);
    console.log(`   Last push: ${new Date(state.lastPushTimestamp).toISOString()}`);

    // Initial sync
    doPull();
    doPush();

    if (live) {
      // Set up periodic sync (every 30 seconds)
      pullInterval = setInterval(doPull, 30000);
      pushInterval = setInterval(doPush, 30000);

      // Also push on document changes
      collection.$.subscribe(() => {
        // Debounce push
        setTimeout(doPush, 1000);
      });
    }
  }

  function stop() {
    console.log(`🛑 Stopping replication for ${collectionId}`);

    if (pullInterval) {
      clearInterval(pullInterval);
      pullInterval = null;
    }

    if (pushInterval) {
      clearInterval(pushInterval);
      pushInterval = null;
    }
  }

  function getState(): ReplicationState {
    return { ...state };
  }

  return { start, stop, getState };
}
