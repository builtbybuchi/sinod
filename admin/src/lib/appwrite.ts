/**
 * Server-side Appwrite client for admin panel
 * Uses API key for full database access - NEVER expose to browser
 */
import { Client, Databases, Users, Storage, Query, ID } from 'node-appwrite';

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required Appwrite environment variable: ${name}`);
    }
    return value;
}

function createAppwriteClient() {
    return new Client()
        .setEndpoint(getRequiredEnv('APPWRITE_ENDPOINT'))
        .setProject(getRequiredEnv('APPWRITE_PROJECT_ID'))
        .setKey(getRequiredEnv('APPWRITE_API_KEY'));
}

function createLazyService<T extends object>(factory: () => T): T {
    let instance: T | null = null;

    return new Proxy({} as T, {
        get(_target, property, receiver) {
            if (!instance) {
                instance = factory();
            }

            const value = Reflect.get(instance as object, property, receiver);
            return typeof value === 'function' ? value.bind(instance) : value;
        },
        set(_target, property, value) {
            if (!instance) {
                instance = factory();
            }

            return Reflect.set(instance as object, property, value);
        },
    });
}

export const databases = createLazyService(() => new Databases(createAppwriteClient()));
export const users = createLazyService(() => new Users(createAppwriteClient()));
export const storage = createLazyService(() => new Storage(createAppwriteClient()));

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'sinod-db';

// Collection IDs — must match backend/scripts/appwrite_setup.py
export const COLLECTIONS = {
    USERS: 'unique-id-collection',
    EVENTS: 'events-collection',
    ATTENDEES: 'attendees-collection',
    FORMS: 'forms',
    FORM_RESPONSES: 'form-responses',
    QUIZZES: 'quizzes',
    QUIZ_RESPONSES: 'quiz-responses',
    CERTIFICATES: 'certificates',
    WITHDRAWALS: 'withdrawals',
    REFUNDS: 'refunds',
    NEWSLETTER_SUBSCRIBERS: 'newsletter-subscribers',
    EMAIL_CAMPAIGNS: 'newsletter-campaigns',
    CAMPAIGN_RECIPIENTS: 'newsletter-recipients',
    CAMPAIGN_ANALYTICS: 'campaign-analytics',
    EMAIL_EVENTS: 'newsletter-link-clicks',
    NOTIFICATIONS: 'notifications',
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    CONTACT_MESSAGES: 'contact-messages',
    // Admin-specific collections
    BLOG_POSTS: 'admin-blog-posts',
    MEDIA: 'admin-media',
    VIDEOS: 'admin-videos',
    EXPENSES: 'admin-expenses',
    BAN_REPORTS: 'admin-ban-reports',
} as const;

export const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'default-bucket';

export { Query, ID };
