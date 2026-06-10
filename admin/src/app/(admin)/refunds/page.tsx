'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, X, Clock, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Refund {
    $id: string;
    $createdAt: string;
    attendee_email: string;
    attendee_id: string;
    event_id: string;
    event_name: string;
    host_email: string;
    ticket_price: number;
    refund_amount: number;
    fee_deducted: number;
    reason: string;
    status: string;
    requested_at: string;
    resolved_at: string;
    admin_email: string;
    admin_note: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function RefundsPage() {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const limit = 25;

    const fetchRefunds = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString(),
            });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const res = await fetch(`/api/admin/data/refunds?${params}`);
            const data = await res.json();
            setRefunds(data.documents || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Error fetching refunds:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const handleAction = async () => {
        if (!selectedRefund) return;
        setProcessingId(selectedRefund.$id);

        try {
            const res = await fetch(`${BACKEND_URL}/refund/admin/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refund_id: selectedRefund.$id,
                    action: actionType,
                    admin_email: 'admin@sinod.app',
                    admin_note: adminNote,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // Update local state
                setRefunds(prev =>
                    prev.map(r =>
                        r.$id === selectedRefund.$id
                            ? { ...r, status: actionType === 'approve' ? 'approved' : 'rejected', admin_note: adminNote }
                            : r
                    )
                );
                setShowActionModal(false);
                setSelectedRefund(null);
                setAdminNote('');
            } else {
                alert(data.error || data.message || 'Action failed');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(msg || 'Failed to process action');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRefunds = refunds.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.attendee_email?.toLowerCase().includes(q) ||
            r.event_name?.toLowerCase().includes(q) ||
            r.host_email?.toLowerCase().includes(q) ||
            r.event_id?.toLowerCase().includes(q)
        );
    });

    const statusCounts = {
        all: total,
        pending: refunds.filter(r => r.status === 'pending').length,
        partial_approved: refunds.filter(r => r.status === 'partial_approved').length,
        approved: refunds.filter(r => r.status === 'approved').length,
        rejected: refunds.filter(r => r.status === 'rejected').length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Clock className="w-3 h-3" />Pending</span>;
            case 'partial_approved':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30"><Clock className="w-3 h-3" />40% Refunded</span>;
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30"><Check className="w-3 h-3" />Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30"><X className="w-3 h-3" />Rejected</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30"><Check className="w-3 h-3" />Completed</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">{status}</span>;
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <RotateCcw className="w-7 h-7 text-orange-400" />
                        Refund Management
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Review, approve, or reject attendee refund requests
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <span className="text-sm font-semibold text-yellow-400">
                            {statusCounts.pending + statusCounts.partial_approved} Needs Action
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: total, color: 'blue', icon: RotateCcw },
                    { label: 'Pending', value: statusCounts.pending, color: 'yellow', icon: Clock },
                    { label: 'Approved', value: statusCounts.approved, color: 'green', icon: Check },
                    { label: 'Rejected', value: statusCounts.rejected, color: 'red', icon: X },
                ].map((stat) => (
                    <div key={stat.label} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/30 rounded-xl p-4`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-${stat.color}-500/20 rounded-lg`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">{stat.label}</p>
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Status Filter */}
                <div className="inline-flex rounded-lg bg-gray-800/50 border border-gray-700/50 p-1">
                    {(['all', 'pending', 'partial_approved', 'approved', 'rejected'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(0); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                statusFilter === s
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {s === 'partial_approved' ? '40% Refunded' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by email, event name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                    </div>
                ) : filteredRefunds.length === 0 ? (
                    <div className="text-center py-20">
                        <RotateCcw className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No refund requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Attendee</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                {filteredRefunds.map((refund) => (
                                    <tr key={refund.$id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-white">{refund.attendee_email}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Host: {refund.host_email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white max-w-[200px] truncate">{refund.event_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{refund.event_id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-white">₦{refund.refund_amount?.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">of ₦{refund.ticket_price?.toLocaleString()}</p>
                                            {refund.fee_deducted > 0 && (
                                                <p className="text-xs text-orange-400 mt-0.5">Fee: ₦{refund.fee_deducted?.toLocaleString()}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-300 max-w-[200px] truncate" title={refund.reason}>
                                                {refund.reason || '—'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(refund.status)}
                                            {refund.admin_note && (
                                                <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={refund.admin_note}>
                                                    Note: {refund.admin_note}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-300">
                                                {refund.requested_at
                                                    ? new Date(refund.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : new Date(refund.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(refund.status === 'pending' || refund.status === 'partial_approved') ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    {refund.status === 'partial_approved' && (
                                                        <span className="text-xs text-blue-400 mr-2">Approve remaining 60%?</span>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRefund(refund);
                                                            setActionType('approve');
                                                            setShowActionModal(true);
                                                        }}
                                                        disabled={!!processingId}
                                                        className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-semibold transition-all disabled:opacity-50"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRefund(refund);
                                                            setActionType('reject');
                                                            setShowActionModal(true);
                                                        }}
                                                        disabled={!!processingId}
                                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50">
                        <p className="text-sm text-gray-400">
                            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 bg-gray-700/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-300" />
                            </button>
                            <span className="text-sm text-gray-300 px-3">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 bg-gray-700/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showActionModal && selectedRefund && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowActionModal(false); setSelectedRefund(null); setAdminNote(''); }}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl ${actionType === 'approve' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {actionType === 'approve'
                                    ? <Check className="w-6 h-6 text-green-400" />
                                    : <X className="w-6 h-6 text-red-400" />
                                }
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {actionType === 'approve' ? 'Approve' : 'Reject'} Refund
                                </h3>
                                <p className="text-sm text-gray-400">{selectedRefund.event_name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">Attendee</p>
                                    <p className="text-sm text-white font-medium truncate">{selectedRefund.attendee_email}</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">Refund Amount</p>
                                    <p className="text-sm text-white font-bold">₦{selectedRefund.refund_amount?.toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedRefund.status === 'partial_approved' && (
                                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                                    <p className="text-xs text-blue-300 font-semibold mb-1">40% Already Refunded</p>
                                    <p className="text-xs text-blue-400">
                                        This attendee already received 40% of the refundable amount automatically.
                                        Approving will refund the remaining 60%. Rejecting will deny the remaining amount.
                                    </p>
                                </div>
                            )}

                            {selectedRefund.fee_deducted > 0 && (
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">Non-refundable fee (6.6%)</p>
                                    <p className="text-sm text-orange-400 font-semibold">₦{selectedRefund.fee_deducted?.toLocaleString()}</p>
                                </div>
                            )}

                            {selectedRefund.reason && (
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                                    <p className="text-sm text-gray-300">{selectedRefund.reason}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Note</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder={actionType === 'approve' ? 'Approved — refund will be processed' : 'Reason for rejection...'}
                                    rows={3}
                                    className="w-full bg-gray-800/50 border border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAction}
                                disabled={!!processingId}
                                className={`flex-1 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 ${
                                    actionType === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                {processingId
                                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                                    : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
                                }
                            </button>
                            <button
                                onClick={() => { setShowActionModal(false); setSelectedRefund(null); setAdminNote(''); }}
                                className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
