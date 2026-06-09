/**
 * Server-side Appwrite client for admin panel
 * Uses API key for full database access - NEVER expose to browser
 */
import { Client, Databases, Users, Storage, Query, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

export const databases = new Databases(client);
export const users = new Users(client);
export const storage = new Storage(client);

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
