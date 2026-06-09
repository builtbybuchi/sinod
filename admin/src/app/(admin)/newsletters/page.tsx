'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface Campaign {
    $id: string;
    title: string;
    subject: string;
    owner_email: string;
    sender_name: string;
    status: string;
    send_type: string;
    scheduled_at: string;
    sent_at: string;
    created_at: string;
}

export default function NewslettersPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 25;

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: LIMIT.toString(), offset: (page * LIMIT).toString() });
            const res = await fetch(`/api/admin/data/newsletters?${params}`);
            const data = await res.json();
            let docs = data.documents || [];
            if (search) {
                docs = docs.filter((c: Campaign) =>
                    c.title?.toLowerCase().includes(search.toLowerCase()) ||
                    c.owner_email?.toLowerCase().includes(search.toLowerCase())
                );
            }
            setCampaigns(docs);
            setTotal(data.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this campaign?')) return;
        await fetch('/api/admin/data/newsletters', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: id }) });
        fetchCampaigns();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'badge-success';
            case 'sending': return 'badge-info';
            case 'scheduled': return 'badge-warning';
            case 'draft': return 'badge-neutral';
            case 'failed': return 'badge-danger';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Newsletters & Campaigns</h1>
                <p className="text-zinc-500 mt-1">{total} total campaigns</p>
            </div>
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="admin-input pl-10" />
            </div>
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead><tr><th>Title</th><th>Subject</th><th>Owner</th><th>Status</th><th>Type</th><th>Sent At</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Loading...</td></tr>
                            ) : campaigns.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">No campaigns found</td></tr>
                            ) : (
                                campaigns.map((c) => (
                                    <tr key={c.$id}>
                                        <td className="font-medium text-white">{c.title}</td>
                                        <td className="text-xs max-w-[200px] truncate">{c.subject}</td>
                                        <td className="text-xs">{c.owner_email}</td>
                                        <td><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                                        <td><span className="badge badge-neutral">{c.send_type}</span></td>
                                        <td className="text-xs whitespace-nowrap">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View analytics">
                                                    <BarChart3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(c.$id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
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
        </div>
    );
}
