/**
 * Financial summary API endpoint
 */
import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get withdrawals for platform fee data
        let totalPlatformFees = 0;
        let totalProcessed = 0;
        let withdrawalCount = 0;

        try {
            const withdrawals = await databases.listDocuments(DATABASE_ID, COLLECTIONS.WITHDRAWALS, [
                Query.limit(100),
            ]);
            withdrawals.documents.forEach((w) => {
                totalProcessed += (w as Record<string, number>).gross_amount || 0;
                totalPlatformFees += (w as Record<string, number>).platform_fee || 0;
            });
            withdrawalCount = withdrawals.total;
        } catch {
            // Collection may not exist yet
        }

        // Get certificate count for income estimation
        let certificateCount = 0;
        try {
            const certs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CERTIFICATES, [
                Query.limit(1),
            ]);
            certificateCount = certs.total;
        } catch { }

        return NextResponse.json({
            totalProcessed,
            platformFees: totalPlatformFees,
            certificateIncome: certificateCount * 100, // Estimated ₦100 per certificate
            withdrawals: { total: totalProcessed, count: withdrawalCount },
        });
    } catch (error) {
        console.error('Error fetching financials:', error);
        return NextResponse.json({ error: 'Failed to fetch financials' }, { status: 500 });
    }
}
