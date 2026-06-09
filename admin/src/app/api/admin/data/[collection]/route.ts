/**
 * Generic collection data API route
 * Handles listing and deleting documents from any collection
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
    refunds: 'refunds',
    'campaign-recipients': 'newsletter-recipients',
    'campaign-analytics': 'campaign-analytics',
    'email-events': 'newsletter-link-clicks',
    attendees: 'attendees-collection',
};

export async function GET(
    request: NextRequest,
    { params }: { params: { collection: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') || '$createdAt';
    const orderDir = searchParams.get('orderDir') || 'desc';

    try {
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            orderDir === 'desc' ? Query.orderDesc(orderBy) : Query.orderAsc(orderBy),
        ];

        const result = await databases.listDocuments(DATABASE_ID, collectionId, queries);
        return NextResponse.json({
            documents: result.documents,
            total: result.total,
        });
    } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
        return NextResponse.json({ error: `Failed to fetch ${collection}` }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { collection: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    try {
        const data = await request.json();
        const { id, ...documentData } = data;
        const result = await databases.createDocument(
            DATABASE_ID,
            collectionId,
            id || 'unique()',
            documentData
        );
        return NextResponse.json(result);
    } catch (error) {
        console.error(`Error creating in ${collection}:`, error);
        return NextResponse.json({ error: `Failed to create in ${collection}` }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { collection: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const collectionId = VALID_COLLECTIONS[collection];
    if (!collectionId) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    try {
        const { documentId } = await request.json();
        await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting from ${collection}:`, error);
        return NextResponse.json({ error: `Failed to delete from ${collection}` }, { status: 500 });
    }
}
