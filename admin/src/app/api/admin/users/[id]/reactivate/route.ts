/**
 * Reactivate user API endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        await users.updateStatus(id, true);
        return NextResponse.json({ success: true, message: 'User reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating user:', error);
        return NextResponse.json({ error: 'Failed to reactivate user' }, { status: 500 });
    }
}
