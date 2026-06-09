import { databases, users, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import {
    Users, Calendar, Mail, Award, TrendingUp, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

async function getStats() {
    try {
        const [usersList, eventsRes, certsRes, campaignsRes] = await Promise.all([
            users.list().catch(() => ({ total: 0, users: [] })),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
                Query.limit(1),
            ]).catch(() => ({ total: 0, documents: [] })),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.CERTIFICATES, [
                Query.limit(1),
            ]).catch(() => ({ total: 0, documents: [] })),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.EMAIL_CAMPAIGNS, [
                Query.limit(1),
            ]).catch(() => ({ total: 0, documents: [] })),
        ]);

        // Events this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const eventsThisMonth = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
            Query.greaterThanEqual('event_time', startOfMonth),
            Query.lessThanEqual('event_time', endOfMonth),
            Query.limit(1),
        ]).catch(() => ({ total: 0 }));

        return {
            totalUsers: usersList.total || 0,
            totalEvents: eventsRes.total || 0,
            eventsThisMonth: eventsThisMonth.total || 0,
            totalCertificates: certsRes.total || 0,
            totalCampaigns: campaignsRes.total || 0,
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {
            totalUsers: 0,
            totalEvents: 0,
            eventsThisMonth: 0,
            totalCertificates: 0,
            totalCampaigns: 0,
        };
    }
}

async function getRecentEvents() {
    try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
            Query.orderDesc('$createdAt'),
            Query.limit(5),
        ]);
        return res.documents;
    } catch {
        return [];
    }
}

export default async function DashboardPage() {
    const stats = await getStats();
    const recentEvents = await getRecentEvents();

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            change: '+12%',
            positive: true,
            glow: 'stat-glow-violet',
            iconBg: 'bg-violet-500/10',
            iconColor: 'text-violet-400',
        },
        {
            label: 'Events This Month',
            value: stats.eventsThisMonth.toLocaleString(),
            icon: Calendar,
            change: `${stats.totalEvents} total`,
            positive: true,
            glow: 'stat-glow-blue',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400',
        },
        {
            label: 'Email Campaigns',
            value: stats.totalCampaigns.toLocaleString(),
            icon: Mail,
            change: 'All time',
            positive: true,
            glow: 'stat-glow-emerald',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
        },
        {
            label: 'Certificates Issued',
            value: stats.totalCertificates.toLocaleString(),
            icon: Award,
            change: 'All time',
            positive: true,
            glow: 'stat-glow-amber',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-400',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 mt-1">Overview of your platform metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className={`admin-card p-6 ${card.glow}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${card.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {card.change}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-white">{card.value}</p>
                                <p className="text-sm text-zinc-500 mt-1">{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Events */}
            <div className="admin-card">
                <div className="p-6 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Recent Events</h2>
                        <a href="/events" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                            View all <TrendingUp className="w-3 h-3" />
                        </a>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Organizer</th>
                                <th>Date</th>
                                <th>Type</th>
                                <th>City</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-zinc-600 py-8">
                                        No events found
                                    </td>
                                </tr>
                            ) : (
                                recentEvents.map((event) => (
                                    <tr key={event.$id}>
                                        <td className="font-medium text-white">{event.event_name}</td>
                                        <td>{event.user_email}</td>
                                        <td>{new Date(event.event_time).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${event.paid ? 'badge-success' : 'badge-neutral'}`}>
                                                {event.paid ? 'Paid' : 'Free'}
                                            </span>
                                        </td>
                                        <td>{event.city || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
