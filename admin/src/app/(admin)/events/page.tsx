'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Event {
    $id: string;
    event_name: string;
    user_email: string;
    event_time: string;
    event_end_time: string;
    public_status: boolean;
    paid: boolean;
    city: string;
    event_price: number;
    event_page_url: string;
    $createdAt: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 25;

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: LIMIT.toString(),
                offset: (page * LIMIT).toString(),
                orderBy: 'event_time',
                orderDir: 'desc',
            });
            const res = await fetch(`/api/admin/data/events?${params}`);
            const data = await res.json();
            let docs = data.documents || [];
            if (search) {
                docs = docs.filter((e: Event) =>
                    e.event_name?.toLowerCase().includes(search.toLowerCase()) ||
                    e.user_email?.toLowerCase().includes(search.toLowerCase()) ||
                    e.city?.toLowerCase().includes(search.toLowerCase())
                );
            }
            setEvents(docs);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleDelete = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
        try {
            await fetch('/api/admin/data/events', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: eventId }),
            });
            fetchEvents();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Events</h1>
                    <p className="text-zinc-500 mt-1">{total} total events (public & private)</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    className="admin-input pl-10"
                />
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Organizer</th>
                                <th>Date</th>
                                <th>Visibility</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>City</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-12 text-zinc-600">Loading events...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-zinc-600">No events found</td></tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.$id}>
                                        <td className="font-medium text-white max-w-[200px] truncate">{event.event_name}</td>
                                        <td className="text-xs">{event.user_email}</td>
                                        <td className="text-xs whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-zinc-500" />
                                                {new Date(event.event_time).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${event.public_status ? 'badge-success' : 'badge-warning'}`}>
                                                {event.public_status ? 'Public' : 'Private'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${event.paid ? 'badge-info' : 'badge-neutral'}`}>
                                                {event.paid ? 'Paid' : 'Free'}
                                            </span>
                                        </td>
                                        <td>{event.paid ? `₦${event.event_price?.toLocaleString() || 0}` : '—'}</td>
                                        <td>{event.city || '—'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={event.event_page_url ? `https://sinod.app/event/${event.event_page_url}` : '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(event.$id)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
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
                        <p className="text-sm text-zinc-500">
                            Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(page + 1)} disabled={(page + 1) * LIMIT >= total}
                                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
