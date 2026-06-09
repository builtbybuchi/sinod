/**
 * Update a document in a collection (PUT)
 */
import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';

const VALID_COLLECTIONS: Record<string, string> = {
    events: 'events-collection',
    forms: 'forms',
    quizzes: 'quizzes',
    newsletters: 'newsletter-campaigns',
    certificates: 'certificates',
    'blog-posts': 'admin-blog-posts',
    media: 'admin-media',
    videos: 'admin-videos',
    expenses: 'admin-expenses',
    'ban-reports': 'admin-ban-reports',
    withdrawals: 'withdrawals',
    'campaign-recipients': 'newsletter-recipients',
    'campaign-analytics': 'campaign-analytics',
    'email-events': 'newsletter-link-clicks',
    attendees: 'attendees-collection',
};

export async function GET(
    request: NextRequest,
    { params }: { params: { collection: string; id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

    try {
        const doc = await databases.getDocument(DATABASE_ID, collectionId, id);
        return NextResponse.json(doc);
    } catch (error) {
        console.error(`Error fetching ${collection}/${id}:`, error);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { collection: string; id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

    try {
        const data = await request.json();
        // Remove system fields that Appwrite manages
        const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...updateData } = data;
        void [$id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId]; // suppress unused warnings

        const result = await databases.updateDocument(DATABASE_ID, collectionId, id, updateData);
        return NextResponse.json(result);
    } catch (error) {
        console.error(`Error updating ${collection}/${id}:`, error);
        return NextResponse.json({ error: `Failed to update ${collection}` }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { collection: string; id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection, id } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

    try {
        await databases.deleteDocument(DATABASE_ID, collectionId, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting ${collection}/${id}:`, error);
        return NextResponse.json({ error: `Failed to delete ${collection}` }, { status: 500 });
    }
}

// Suppress unused import warning
void Query;
