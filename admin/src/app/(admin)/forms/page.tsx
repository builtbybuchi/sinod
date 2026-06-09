'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Form {
    $id: string;
    title: string;
    description: string;
    created_by: string;
    status: string;
    is_public: boolean;
    response_count: number;
    created_at: string;
}

export default function FormsPage() {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 25;

    const fetchForms = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: LIMIT.toString(), offset: (page * LIMIT).toString() });
            const res = await fetch(`/api/admin/data/forms?${params}`);
            const data = await res.json();
            let docs = data.documents || [];
            if (search) {
                docs = docs.filter((f: Form) =>
                    f.title?.toLowerCase().includes(search.toLowerCase()) ||
                    f.created_by?.toLowerCase().includes(search.toLowerCase())
                );
            }
            setForms(docs);
            setTotal(data.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetchForms(); }, [fetchForms]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this form?')) return;
        await fetch('/api/admin/data/forms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId: id }) });
        fetchForms();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Forms</h1>
                <p className="text-zinc-500 mt-1">{total} total forms</p>
            </div>
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="Search forms..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="admin-input pl-10" />
            </div>
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead><tr><th>Title</th><th>Creator</th><th>Status</th><th>Visibility</th><th>Responses</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">Loading...</td></tr>
                            ) : forms.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">No forms found</td></tr>
                            ) : (
                                forms.map((form) => (
                                    <tr key={form.$id}>
                                        <td className="font-medium text-white">{form.title}</td>
                                        <td className="text-xs">{form.created_by}</td>
                                        <td><span className={`badge ${form.status === 'active' ? 'badge-success' : form.status === 'draft' ? 'badge-warning' : 'badge-neutral'}`}>{form.status}</span></td>
                                        <td><span className={`badge ${form.is_public ? 'badge-info' : 'badge-neutral'}`}>{form.is_public ? 'Public' : 'Private'}</span></td>
                                        <td>{form.response_count}</td>
                                        <td className="text-xs whitespace-nowrap">{form.created_at ? new Date(form.created_at).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <button onClick={() => handleDelete(form.$id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {total > LIMIT && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
                        <p className="text-sm text-zinc-500">Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}</p>
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
