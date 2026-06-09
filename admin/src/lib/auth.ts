/**
 * Admin authentication utilities
 * JWT-based auth with HTTP-only cookies
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'sinod-admin-jwt-secret'
);

const COOKIE_NAME = 'sinod_admin_token';
const TOKEN_EXPIRY = '24h';

export interface AdminPayload {
    email: string;
    admin: boolean;
    iat: number;
    exp: number;
}

export async function createToken(email: string): Promise<string> {
    return new SignJWT({ email, admin: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (!payload.admin) return null;
        return payload as unknown as AdminPayload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<AdminPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export function getAdminCredentials() {
    return {
        email: process.env.ADMIN_EMAIL || 'admin@sinod.app',
        passwordHash: process.env.ADMIN_PASSWORD_HASH || 'changeme',
    };
}

export { COOKIE_NAME };
