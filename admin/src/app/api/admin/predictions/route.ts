/**
 * AI Growth Predictions API
 * Uses Groq (qwen3-32b) to analyze platform data and generate predictions + action items
 */
import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import { getSession } from '@/lib/auth';
import Groq from 'groq-sdk';

function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('Missing required environment variable: GROQ_API_KEY');
    }

    return new Groq({ apiKey });
}

async function gatherPlatformMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data in parallel
    const [
        usersRes,
        eventsRes,
        attendeesRes,
        formsRes,
        quizzesRes,
        certificatesRes,
        withdrawalsRes,
        subscribersRes,
        campaignsRes,
        expensesRes,
    ] = await Promise.allSettled([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [Query.limit(100), Query.orderDesc('$createdAt')]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ATTENDEES, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.FORMS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZZES, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.CERTIFICATES, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.WITHDRAWALS, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.NEWSLETTER_SUBSCRIBERS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.EMAIL_CAMPAIGNS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, [Query.limit(100)]),
    ]);

    const getValue = (res: PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>) =>
        res.status === 'fulfilled' ? res.value : { total: 0, documents: [] };

    const users = getValue(usersRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const events = getValue(eventsRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const attendees = getValue(attendeesRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const forms = getValue(formsRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const quizzes = getValue(quizzesRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const certificates = getValue(certificatesRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const withdrawals = getValue(withdrawalsRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const subscribers = getValue(subscribersRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const campaigns = getValue(campaignsRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);
    const expensesData = getValue(expensesRes as PromiseSettledResult<{ total: number; documents: Record<string, unknown>[] }>);

    // Calculate financials
    let totalProcessed = 0;
    let totalPlatformFees = 0;
    withdrawals.documents.forEach((w) => {
        totalProcessed += (w as Record<string, number>).gross_amount || 0;
        totalPlatformFees += (w as Record<string, number>).platform_fee || 0;
    });

    // Count recent events (last 30 days)
    const recentEvents = events.documents.filter((e) => {
        const created = (e as Record<string, string>).$createdAt;
        return created && new Date(created) > new Date(thirtyDaysAgo);
    }).length;

    // Paid vs free ratio
    const paidEvents = events.documents.filter((e) => (e as Record<string, boolean>).paid === true).length;
    const freeEvents = events.total - paidEvents;

    // Expenses calculation
    let monthlyExpenses = 0;
    expensesData.documents.forEach((exp) => {
        const cost = (exp as Record<string, number>).cost || 0;
        const freq = (exp as Record<string, string>).frequency || 'monthly';
        if (freq === 'monthly') monthlyExpenses += cost;
        else if (freq === 'yearly') monthlyExpenses += cost / 12;
        // one-time costs are not recurring
    });

    return {
        totalUsers: users.total,
        totalEvents: events.total,
        recentEventsLast30Days: recentEvents,
        totalAttendees: attendees.total,
        totalForms: forms.total,
        totalQuizzes: quizzes.total,
        totalCertificates: certificates.total,
        totalWithdrawals: withdrawals.total,
        totalNewsletterSubscribers: subscribers.total,
        totalCampaigns: campaigns.total,
        totalProcessedRevenue: totalProcessed,
        platformFees5Percent: totalPlatformFees,
        certificateIncome: certificates.total * 100, // approximate
        monthlyExpenses,
        totalExpenses: expensesData.total,
        paidEvents,
        freeEvents,
        monthlyNetIncome: totalPlatformFees + (certificates.total * 100) - monthlyExpenses,
        dataCollectedAt: now.toISOString(),
    };
}

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const groq = getGroqClient();
        const metrics = await gatherPlatformMetrics();

        const prompt = `You are a business analyst for Sinod.app, an event management and community platform based in Nigeria. Analyze the following real platform metrics and provide strategic growth predictions and actionable recommendations.

PLATFORM METRICS (Real Data):
- Total Registered Users: ${metrics.totalUsers}
- Total Events Created: ${metrics.totalEvents}
- Events Created Last 30 Days: ${metrics.recentEventsLast30Days}
- Total Event Attendees/Registrations: ${metrics.totalAttendees}
- Paid Events: ${metrics.paidEvents} | Free Events: ${metrics.freeEvents}
- Total Forms Created: ${metrics.totalForms}
- Total Quizzes Created: ${metrics.totalQuizzes}
- Total Certificates Issued: ${metrics.totalCertificates}
- Newsletter Subscribers: ${metrics.totalNewsletterSubscribers}
- Email Campaigns Sent: ${metrics.totalCampaigns}
- Total Revenue Processed: ₦${metrics.totalProcessedRevenue.toLocaleString()}
- Platform Fees Earned (5%): ₦${metrics.platformFees5Percent.toLocaleString()}
- Certificate Income: ₦${metrics.certificateIncome.toLocaleString()}
- Monthly Recurring Expenses: ₦${metrics.monthlyExpenses.toLocaleString()}
- Monthly Net Income: ₦${metrics.monthlyNetIncome.toLocaleString()}

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "summary": "2-3 sentence overview of the platform's current state and trajectory",
  "metrics": [
    {"label": "Monthly User Growth Rate", "value": "estimated value", "trend": "up|down|stable"},
    {"label": "Revenue Trend", "value": "estimated value", "trend": "up|down|stable"},
    {"label": "Event Creation Rate", "value": "estimated value", "trend": "up|down|stable"},
    {"label": "Avg Attendees per Event", "value": "calculated value", "trend": "up|down|stable"},
    {"label": "Paid vs Free Ratio", "value": "calculated percentage", "trend": "up|down|stable"},
    {"label": "Est. Months to Profitability", "value": "number or Already Profitable", "trend": "up|down|stable"}
  ],
  "predictions": [
    {"timeframe": "Next 30 Days", "prediction": "specific prediction based on data"},
    {"timeframe": "Next 3 Months", "prediction": "specific prediction based on data"},
    {"timeframe": "Next 6 Months", "prediction": "specific prediction based on data"}
  ],
  "actions": [
    {"text": "specific actionable recommendation", "priority": "High|Medium|Low", "impact": "brief expected impact"},
    {"text": "specific actionable recommendation", "priority": "High|Medium|Low", "impact": "brief expected impact"},
    {"text": "specific actionable recommendation", "priority": "High|Medium|Low", "impact": "brief expected impact"},
    {"text": "specific actionable recommendation", "priority": "High|Medium|Low", "impact": "brief expected impact"},
    {"text": "specific actionable recommendation", "priority": "High|Medium|Low", "impact": "brief expected impact"}
  ]
}`;

        const completion = await groq.chat.completions.create({
            model: 'qwen/qwen3-32b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
        });

        const raw = completion.choices[0]?.message?.content || '{}';

        // Extract JSON from the response (handle potential markdown wrapping)
        let parsed;
        try {
            // Try direct parse first
            parsed = JSON.parse(raw);
        } catch {
            // Try to extract JSON from markdown code blocks or thinking tags
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = { summary: raw, metrics: [], predictions: [], actions: [] };
            }
        }

        return NextResponse.json({
            ...parsed,
            rawMetrics: metrics,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Prediction error:', error);
        return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 });
    }
}
