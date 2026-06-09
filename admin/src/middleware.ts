/**
 * Next.js middleware - protects all routes except /login
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'sinod-admin-jwt-secret'
);

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths and static assets
    if (
        PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon')
    ) {
        return NextResponse.next();
    }

    // Check for admin token
    const token = request.cookies.get('sinod_admin_token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (!payload.admin) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    } catch {
        // Invalid or expired token
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('sinod_admin_token');
        return response;
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
