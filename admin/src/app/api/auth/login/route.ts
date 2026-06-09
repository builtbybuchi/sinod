/**
 * POST /api/auth/login - Admin login endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { createToken, getAdminCredentials, COOKIE_NAME } from '@/lib/auth';

// Simple rate limiting in-memory
const attempts: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = attempts.get(ip);

    if (!record || now > record.resetAt) {
        attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (record.count >= MAX_ATTEMPTS) return false;
    record.count++;
    return true;
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Too many login attempts. Try again in 15 minutes.' },
            { status: 429 }
        );
    }

    try {
        const { email, password } = await request.json();
        const creds = getAdminCredentials();

        // Validate credentials
        if (email !== creds.email || password !== creds.passwordHash) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create JWT
        const token = await createToken(email);

        // Set HTTP-only cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;
    } catch {
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        );
    }
}
