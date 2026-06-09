'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, CheckCircle, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';

interface UserData {
    $id: string;
    name: string;
    email: string;
    status: boolean;
    registration: string;
    labels: string[];
}

export default function UsersPage() {
    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 25;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: LIMIT.toString(),
                offset: (page * LIMIT).toString(),
                ...(search && { search }),
            });
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsersList(data.users || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleBan = async (userId: string) => {
        if (!confirm('Are you sure you want to ban this user?')) return;
        try {
            await fetch(`/api/admin/users/${userId}/ban`, { method: 'POST' });
            fetchUsers();
        } catch (err) {
            console.error('Ban failed:', err);
        }
    };

    const handleReactivate = async (userId: string) => {
        if (!confirm('Are you sure you want to reactivate this user?')) return;
        try {
            await fetch(`/api/admin/users/${userId}/reactivate`, { method: 'POST' });
            fetchUsers();
        } catch (err) {
            console.error('Reactivate failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-zinc-500 mt-1">{total} registered users</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    className="admin-input pl-10"
                />
            </div>

            {/* Users Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Account Type</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-600">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5 animate-spin text-violet-500" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : usersList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-600">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                usersList.map((user) => (
                                    <tr key={user.$id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <UserCircle className="w-5 h-5 text-zinc-500" />
                                                </div>
                                                <span className="font-medium text-white">{user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.status ? 'badge-success' : 'badge-danger'}`}>
                                                {user.status ? 'Active' : 'Banned'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">
                                                {user.labels?.includes('admin') ? 'Admin' : user.labels?.includes('pro') ? 'Pro' : 'Free'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.registration).toLocaleDateString()}</td>
                                        <td>
                                            {user.status ? (
                                                <button
                                                    onClick={() => handleBan(user.$id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                                                >
                                                    <Ban className="w-3 h-3" />
                                                    Ban
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(user.$id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Reactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > LIMIT && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
                        <p className="text-sm text-zinc-500">
                            Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={(page + 1) * LIMIT >= total}
                                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
