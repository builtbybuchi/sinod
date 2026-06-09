'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, AlertTriangle, Mail } from 'lucide-react';

interface EmailEvent {
    $id: string;
    campaign_id: string;
    recipient_email: string;
    event_type: string;
    timestamp: string;
    metadata: string;
}

interface CampaignAnalytics {
    $id: string;
    campaign_id: string;
    total_recipients: number;
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    total_failed: number;
}

export default function EmailsPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'deliverability' | 'bans'>('logs');
    const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
    const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 25;

    const fetchEmailLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: LIMIT.toString(), offset: (page * LIMIT).toString() });
            const res = await fetch(`/api/admin/data/email-events?${params}`);
            const data = await res.json();
            setEmailEvents(data.documents || []);
            setTotal(data.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/data/campaign-analytics?limit=50');
            const data = await res.json();
            setAnalytics(data.documents || []);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') fetchEmailLogs();
        if (activeTab === 'deliverability') fetchAnalytics();
    }, [activeTab, fetchEmailLogs, fetchAnalytics]);

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'delivered': return 'badge-success';
            case 'opened': return 'badge-info';
            case 'clicked': return 'badge-info';
            case 'bounced': return 'badge-danger';
            case 'complained': return 'badge-danger';
            case 'sent': return 'badge-neutral';
            default: return 'badge-neutral';
        }
    };

    const tabs = [
        { key: 'logs' as const, label: 'Email Logs', icon: Mail },
        { key: 'deliverability' as const, label: 'Deliverability', icon: BarChart3 },
        { key: 'bans' as const, label: 'Ban Reports', icon: AlertTriangle },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Email Monitoring</h1>
                <p className="text-zinc-500 mt-1">Track email delivery, opens, and deliverability health</p>
            </div>

            <div className="flex items-center gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`tab-btn flex items-center gap-2 ${activeTab === tab.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Email Logs Tab */}
            {activeTab === 'logs' && (
                <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead><tr><th>Recipient</th><th>Event Type</th><th>Campaign ID</th><th>Timestamp</th></tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-12 text-zinc-600">Loading email events...</td></tr>
                                ) : emailEvents.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-12 text-zinc-600">No email events found</td></tr>
                                ) : (
                                    emailEvents.map((event) => (
                                        <tr key={event.$id}>
                                            <td className="text-xs">{event.recipient_email}</td>
                                            <td><span className={`badge ${getEventTypeColor(event.event_type)}`}>{event.event_type}</span></td>
                                            <td className="text-xs text-zinc-500 font-mono">{event.campaign_id?.slice(0, 8)}...</td>
                                            <td className="text-xs whitespace-nowrap">{new Date(event.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {total > LIMIT && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
                            <p className="text-sm text-zinc-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setPage(page + 1)} disabled={(page + 1) * LIMIT >= total} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Deliverability Tab */}
            {activeTab === 'deliverability' && (
                <div className="space-y-6">
                    {analytics.length === 0 ? (
                        <div className="admin-card p-12 text-center">
                            <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500">No campaign analytics data yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Analytics will appear once campaigns are sent</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {analytics.map((a) => {
                                const deliveryRate = a.total_sent > 0 ? ((a.total_delivered / a.total_sent) * 100).toFixed(1) : '0';
                                const openRate = a.total_delivered > 0 ? ((a.total_opened / a.total_delivered) * 100).toFixed(1) : '0';
                                const bounceRate = a.total_sent > 0 ? ((a.total_bounced / a.total_sent) * 100).toFixed(1) : '0';

                                return (
                                    <div key={a.$id} className="admin-card p-6">
                                        <h3 className="text-sm font-medium text-zinc-400 mb-4 font-mono">{a.campaign_id?.slice(0, 12)}...</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className="text-2xl font-bold text-white">{a.total_sent}</p><p className="text-xs text-zinc-500">Total Sent</p></div>
                                            <div><p className="text-2xl font-bold text-emerald-400">{deliveryRate}%</p><p className="text-xs text-zinc-500">Delivery Rate</p></div>
                                            <div><p className="text-2xl font-bold text-blue-400">{openRate}%</p><p className="text-xs text-zinc-500">Open Rate</p></div>
                                            <div><p className="text-2xl font-bold text-red-400">{bounceRate}%</p><p className="text-xs text-zinc-500">Bounce Rate</p></div>
                                        </div>
                                        <div className="mt-4 h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                                            <div className="bg-emerald-500 h-full" style={{ width: `${deliveryRate}%` }} />
                                            <div className="bg-red-500 h-full" style={{ width: `${bounceRate}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bans Tab */}
            {activeTab === 'bans' && (
                <div className="admin-card p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-400 mb-2">Auto-Ban Reports</h3>
                    <p className="text-zinc-600 text-sm max-w-md mx-auto">
                        When a newsletter triggers abnormal spam reports or blacklist entries, an auto-ban report will be generated here for review.
                        The system monitors deliverability metrics and flags high-risk senders.
                    </p>
                    <p className="text-xs text-zinc-700 mt-4">No ban reports yet — this is a good thing! 🎉</p>
                </div>
            )}
        </div>
    );
}
