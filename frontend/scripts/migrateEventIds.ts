/**
 * Migration Script: Update Existing Events to Use Short IDs
 * 
 * This script updates existing events in the database to use the new short ID format.
 * Run this ONCE if you have existing events that need to be migrated.
 * 
 * WARNING: This will change all event URLs. Make sure to backup your data first!
 */

import { Client, Databases, Query } from 'appwrite';
import { generateEventId } from '../utils/idGenerator';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const EVENTS_COLLECTION = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID;
const ATTENDEES_COLLECTION = import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID;

interface MigrationResult {
  success: boolean;
  eventsUpdated: number;
  attendeesUpdated: number;
  errors: string[];
}

/**
 * Migrate events to use short IDs
 */
export async function migrateEventsToShortIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    eventsUpdated: 0,
    attendeesUpdated: 0,
    errors: [],
  };

  try {
    console.log('🔄 Starting migration to short event IDs...');
    
    // Step 1: Get all events
    console.log('📋 Fetching all events...');
    const eventsResponse = await databases.listDocuments(
      DB_ID,
      EVENTS_COLLECTION,
      [Query.limit(500)] // Adjust if you have more than 500 events
    );

    const events = eventsResponse.documents;
    console.log(`✅ Found ${events.length} events to migrate`);

    // Step 2: Update each event with a new short ID
    const eventIdMapping = new Map<string, string>(); // oldId -> shortId

    for (const event of events) {
      try {
        // Generate a new short ID
        const shortId = generateEventId();
        
        // Store mapping for attendee updates
        eventIdMapping.set(event.$id, shortId);

        // Update the event
        await databases.updateDocument(
          DB_ID,
          EVENTS_COLLECTION,
          event.$id,
          { event_page_url: shortId }
        );

        result.eventsUpdated++;
        console.log(`✅ Updated event "${event.event_name}" → ${shortId}`);
      } catch (error: any) {
        const errorMsg = `Failed to update event ${event.$id}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    // Step 3: Update attendees to use the new event_id field
    console.log('\n📋 Fetching all attendees...');
    const attendeesResponse = await databases.listDocuments(
      DB_ID,
      ATTENDEES_COLLECTION,
      [Query.limit(1000)] // Adjust if you have more attendees
    );

    const attendees = attendeesResponse.documents;
    console.log(`✅ Found ${attendees.length} attendees to migrate`);

    for (const attendee of attendees) {
      try {
        // Check if attendee has old eventsCollection field
        const oldEventId = (attendee as any).eventsCollection || (attendee as any).eventId;
        
        if (oldEventId && eventIdMapping.has(oldEventId)) {
          const shortId = eventIdMapping.get(oldEventId);
          
          // Update with new event_id field
          await databases.updateDocument(
            DB_ID,
            ATTENDEES_COLLECTION,
            attendee.$id,
            { event_id: shortId }
          );

          result.attendeesUpdated++;
          console.log(`✅ Updated attendee ${attendee.email} → event_id: ${shortId}`);
        } else if (!attendee.event_id) {
          console.warn(`⚠️  Attendee ${attendee.$id} has no event relationship to migrate`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to update attendee ${attendee.$id}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`📊 Events updated: ${result.eventsUpdated}`);
    console.log(`📊 Attendees updated: ${result.attendeesUpdated}`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Test migration on a single event (for safety)
 */
export async function testMigrationOnOneEvent(): Promise<void> {
  try {
    console.log('🧪 Testing migration on one event...');
    
    // Get one event
    const eventsResponse = await databases.listDocuments(
      DB_ID,
      EVENTS_COLLECTION,
      [Query.limit(1)]
    );

    if (eventsResponse.documents.length === 0) {
      console.log('❌ No events found to test with');
      return;
    }

    const event = eventsResponse.documents[0];
    const oldUrl = event.event_page_url;
    const shortId = generateEventId();

    console.log(`📝 Event: ${event.event_name}`);
    console.log(`📝 Old URL: ${oldUrl}`);
    console.log(`📝 New ID: ${shortId}`);
    
    // Update
    await databases.updateDocument(
      DB_ID,
      EVENTS_COLLECTION,
      event.$id,
      { event_page_url: shortId }
    );

    console.log('✅ Test successful! You can now run the full migration.');
    
    // Revert the change
    await databases.updateDocument(
      DB_ID,
      EVENTS_COLLECTION,
      event.$id,
      { event_page_url: oldUrl }
    );
    
    console.log('✅ Test event reverted to original state');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment to run:
// migrateEventsToShortIds();
// testMigrationOnOneEvent();
