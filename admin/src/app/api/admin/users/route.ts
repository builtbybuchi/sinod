/**
 * Admin Users API - proxied through Next.js API routes for security
 */
import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';
import { Query } from 'node-appwrite';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    try {
        const queries: string[] = [
            Query.limit(limit),
            Query.offset(offset),
        ];
        if (search) {
            queries.push(Query.search('name', search));
        }

        const result = await users.list(queries);
        return NextResponse.json({ users: result.users, total: result.total });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

