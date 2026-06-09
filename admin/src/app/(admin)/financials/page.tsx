'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Lightbulb, ArrowUpRight, ArrowDownRight, Minus, Edit3, Eye, X, Save, Loader2, Sparkles, Target, Clock, ChevronRight } from 'lucide-react';

interface Expense {
    $id: string;
    name: string;
    cost: number;
    frequency: string;
    category: string;
    notes: string;
    created_at: string;
}

interface FinancialData {
    totalProcessed: number;
    platformFees: number;
    certificateIncome: number;
    withdrawals: { total: number; count: number };
}

interface PredictionMetric {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
}

interface Prediction {
    timeframe: string;
    prediction: string;
}

interface ActionItem {
    text: string;
    priority: 'High' | 'Medium' | 'Low';
    impact: string;
}

interface PredictionData {
    summary: string;
    metrics: PredictionMetric[];
    predictions: Prediction[];
    actions: ActionItem[];
    rawMetrics: Record<string, number>;
    generatedAt: string;
}

export default function FinancialsPage() {
    const [activeTab, setActiveTab] = useState<'revenue' | 'expenses' | 'predictions'>('revenue');
    const [financials, setFinancials] = useState<FinancialData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [, setLoading] = useState(true);

    // Expense form state
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
    const [newExpense, setNewExpense] = useState({ name: '', cost: '', frequency: 'monthly', category: '', notes: '' });

    // Predictions state
    const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
    const [loadingPredictions, setLoadingPredictions] = useState(false);

    useEffect(() => {
        fetchFinancials();
        fetchExpenses();
    }, []);

    const fetchFinancials = async () => {
        try {
            const res = await fetch('/api/admin/financials');
            const data = await res.json();
            setFinancials(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/admin/data/expenses');
            const data = await res.json();
            setExpenses(data.documents || []);
        } catch (err) { console.error(err); }
    };

    const addExpense = async () => {
        if (!newExpense.name || !newExpense.cost) return;
        try {
            await fetch('/api/admin/data/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newExpense, cost: parseFloat(newExpense.cost), created_at: new Date().toISOString() }),
            });
            setNewExpense({ name: '', cost: '', frequency: 'monthly', category: '', notes: '' });
            setShowAddExpense(false);
            fetchExpenses();
        } catch (err) { console.error(err); }
    };

    const updateExpense = async () => {
        if (!editingExpense) return;
        try {
            await fetch(`/api/admin/data/expenses/${editingExpense.$id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingExpense.name,
                    cost: editingExpense.cost,
                    frequency: editingExpense.frequency,
                    category: editingExpense.category,
                    notes: editingExpense.notes,
                }),
            });
            setEditingExpense(null);
            fetchExpenses();
        } catch (err) { console.error(err); }
    };

    const deleteExpense = async (id: string) => {
        if (!confirm('Delete this expense?')) return;
        await fetch(`/api/admin/data/expenses/${id}`, { method: 'DELETE' });
        fetchExpenses();
    };

    const fetchPredictions = async () => {
        setLoadingPredictions(true);
        try {
            const res = await fetch('/api/admin/predictions');
            const data = await res.json();
            setPredictionData(data);
        } catch (err) { console.error(err); }
        finally { setLoadingPredictions(false); }
    };

    const totalMonthlyExpenses = expenses.reduce((sum, e) => {
        if (e.frequency === 'monthly') return sum + e.cost;
        if (e.frequency === 'yearly') return sum + e.cost / 12;
        return sum;
    }, 0);

    const totalIncome = (financials?.platformFees || 0) + (financials?.certificateIncome || 0);
    const monthlyProfit = totalIncome - totalMonthlyExpenses;
    const isProfitable = monthlyProfit > 0;

    const trendIcon = (trend: string) => {
        if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
        if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-red-400" />;
        return <Minus className="w-3 h-3 text-zinc-500" />;
    };

    const trendColor = (trend: string) => {
        if (trend === 'up') return 'text-emerald-400';
        if (trend === 'down') return 'text-red-400';
        return 'text-zinc-400';
    };

    const tabs = [
        { key: 'revenue' as const, label: 'Revenue' },
        { key: 'expenses' as const, label: 'Expenses' },
        { key: 'predictions' as const, label: 'AI Predictions' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Financials</h1>
                <p className="text-zinc-500 mt-1">Revenue, expenses, and AI-powered growth predictions</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            if (tab.key === 'predictions' && !predictionData) fetchPredictions();
                        }}
                        className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                    >
                        {tab.key === 'predictions' && <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="admin-card p-6 stat-glow-emerald">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
                                <span className="text-sm text-zinc-500">Total Processed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">₦{(financials?.totalProcessed || 0).toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-1">From paid events</p>
                        </div>
                        <div className="admin-card p-6 stat-glow-violet">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-violet-500/10"><TrendingUp className="w-5 h-5 text-violet-400" /></div>
                                <span className="text-sm text-zinc-500">Platform Fees (5%)</span>
                            </div>
                            <p className="text-3xl font-bold text-white">₦{(financials?.platformFees || 0).toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-1">Revenue from event fees</p>
                        </div>
                        <div className="admin-card p-6 stat-glow-blue">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-500/10"><DollarSign className="w-5 h-5 text-blue-400" /></div>
                                <span className="text-sm text-zinc-500">Certificate Income</span>
                            </div>
                            <p className="text-3xl font-bold text-white">₦{(financials?.certificateIncome || 0).toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 mt-1">Certificate credit sales</p>
                        </div>
                    </div>

                    <div className="admin-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Profitability Summary</h3>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 text-lg font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                {isProfitable ? 'Profitable' : 'Not Yet Profitable'}
                            </div>
                            <span className="text-zinc-500">|</span>
                            <span className="text-zinc-400">Monthly net: <span className={isProfitable ? 'text-emerald-400' : 'text-red-400'}>₦{monthlyProfit.toLocaleString()}</span></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="admin-card p-4 inline-flex items-center gap-3">
                            <span className="text-zinc-400">Total Monthly Expenses:</span>
                            <span className="text-xl font-bold text-red-400">₦{totalMonthlyExpenses.toLocaleString()}</span>
                        </div>
                        <button onClick={() => { setShowAddExpense(true); setEditingExpense(null); }} className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Expense
                        </button>
                    </div>

                    {/* Add/Edit Expense Form */}
                    {(showAddExpense || editingExpense) && (
                        <div className="admin-card p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Service name"
                                    value={editingExpense ? editingExpense.name : newExpense.name}
                                    onChange={(e) => editingExpense
                                        ? setEditingExpense({ ...editingExpense, name: e.target.value })
                                        : setNewExpense({ ...newExpense, name: e.target.value })
                                    }
                                    className="admin-input"
                                />
                                <input
                                    placeholder="Cost (₦)"
                                    type="number"
                                    value={editingExpense ? editingExpense.cost : newExpense.cost}
                                    onChange={(e) => editingExpense
                                        ? setEditingExpense({ ...editingExpense, cost: parseFloat(e.target.value) || 0 })
                                        : setNewExpense({ ...newExpense, cost: e.target.value })
                                    }
                                    className="admin-input"
                                />
                                <select
                                    value={editingExpense ? editingExpense.frequency : newExpense.frequency}
                                    onChange={(e) => editingExpense
                                        ? setEditingExpense({ ...editingExpense, frequency: e.target.value })
                                        : setNewExpense({ ...newExpense, frequency: e.target.value })
                                    }
                                    className="admin-input"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="one-time">One-time</option>
                                </select>
                                <input
                                    placeholder="Category"
                                    value={editingExpense ? editingExpense.category : newExpense.category}
                                    onChange={(e) => editingExpense
                                        ? setEditingExpense({ ...editingExpense, category: e.target.value })
                                        : setNewExpense({ ...newExpense, category: e.target.value })
                                    }
                                    className="admin-input"
                                />
                                <textarea
                                    placeholder="Notes"
                                    value={editingExpense ? editingExpense.notes : newExpense.notes}
                                    onChange={(e) => editingExpense
                                        ? setEditingExpense({ ...editingExpense, notes: e.target.value })
                                        : setNewExpense({ ...newExpense, notes: e.target.value })
                                    }
                                    className="admin-input md:col-span-2"
                                    rows={2}
                                />
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={editingExpense ? updateExpense : addExpense}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingExpense ? 'Update' : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setShowAddExpense(false); setEditingExpense(null); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View Expense Detail */}
                    {viewingExpense && (
                        <div className="admin-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Expense Details</h3>
                                <button onClick={() => setViewingExpense(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Service Name</p>
                                    <p className="text-white font-medium">{viewingExpense.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Cost</p>
                                    <p className="text-white font-medium">₦{viewingExpense.cost?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Frequency</p>
                                    <p className="text-white font-medium capitalize">{viewingExpense.frequency}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Category</p>
                                    <p className="text-white font-medium">{viewingExpense.category || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-zinc-500 mb-1">Notes</p>
                                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{viewingExpense.notes || 'No notes added'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-zinc-500 mb-1">Added</p>
                                    <p className="text-zinc-400 text-sm">{viewingExpense.created_at ? new Date(viewingExpense.created_at).toLocaleString() : '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expenses Table */}
                    <div className="admin-card overflow-hidden">
                        <table className="admin-table">
                            <thead><tr><th>Service</th><th>Cost</th><th>Frequency</th><th>Category</th><th>Actions</th></tr></thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-zinc-600">No expenses recorded yet</td></tr>
                                ) : (
                                    expenses.map((e) => (
                                        <tr key={e.$id}>
                                            <td className="font-medium text-white">{e.name}</td>
                                            <td>₦{e.cost?.toLocaleString()}</td>
                                            <td><span className="badge badge-neutral">{e.frequency}</span></td>
                                            <td>{e.category || '—'}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => { setViewingExpense(e); setEditingExpense(null); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => { setEditingExpense(e); setShowAddExpense(false); setViewingExpense(null); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => deleteExpense(e.$id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
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
                </div>
            )}

            {/* AI Predictions Tab */}
            {activeTab === 'predictions' && (
                <div className="space-y-6">
                    {loadingPredictions ? (
                        <div className="admin-card p-12 text-center">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
                            <p className="text-zinc-400">Analyzing platform data with AI...</p>
                            <p className="text-xs text-zinc-600 mt-1">This may take a few seconds</p>
                        </div>
                    ) : !predictionData ? (
                        <div className="admin-card p-12 text-center">
                            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">AI Growth Predictions</h3>
                            <p className="text-zinc-500 mb-6 max-w-md mx-auto">Analyze real platform metrics with AI to get growth predictions, revenue trends, and actionable recommendations.</p>
                            <button onClick={fetchPredictions} className="btn-primary inline-flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Generate Predictions
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* AI Summary */}
                            <div className="admin-card p-6 border-l-4 border-violet-500">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">AI Analysis</h3>
                                        <p className="text-sm text-zinc-400">{predictionData.summary}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Key Metrics */}
                                <div className="admin-card p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-4 h-4 text-violet-400" />
                                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Key Metrics</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {predictionData.metrics?.map((metric, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                                                <span className="text-zinc-400 text-sm">{metric.label}</span>
                                                <span className={`font-medium flex items-center gap-1.5 ${trendColor(metric.trend)}`}>
                                                    {trendIcon(metric.trend)}
                                                    {metric.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Timeline Predictions */}
                                <div className="admin-card p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Growth Timeline</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {predictionData.predictions?.map((pred, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-zinc-800/30 border-l-2 border-blue-500/50">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <ChevronRight className="w-3 h-3 text-blue-400" />
                                                    <span className="text-xs font-semibold text-blue-400 uppercase">{pred.timeframe}</span>
                                                </div>
                                                <p className="text-sm text-zinc-300">{pred.prediction}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Items */}
                            <div className="admin-card p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recommended Actions</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {predictionData.actions?.map((action, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-zinc-800/30 border-l-2 border-violet-500/50">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-zinc-300">{action.text}</p>
                                                <span className={`badge shrink-0 ${action.priority === 'High' ? 'badge-danger' : action.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>
                                                    {action.priority}
                                                </span>
                                            </div>
                                            {action.impact && (
                                                <p className="text-xs text-zinc-600 mt-2">Impact: {action.impact}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Platform Snapshot */}
                            {predictionData.rawMetrics && (
                                <div className="admin-card p-6">
                                    <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Platform Snapshot (Real Data)</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Users', value: predictionData.rawMetrics.totalUsers },
                                            { label: 'Events', value: predictionData.rawMetrics.totalEvents },
                                            { label: 'Attendees', value: predictionData.rawMetrics.totalAttendees },
                                            { label: 'Forms', value: predictionData.rawMetrics.totalForms },
                                            { label: 'Quizzes', value: predictionData.rawMetrics.totalQuizzes },
                                            { label: 'Certificates', value: predictionData.rawMetrics.totalCertificates },
                                            { label: 'Subscribers', value: predictionData.rawMetrics.totalNewsletterSubscribers },
                                            { label: 'Campaigns', value: predictionData.rawMetrics.totalCampaigns },
                                        ].map((item, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-zinc-800/20">
                                                <p className="text-xs text-zinc-600">{item.label}</p>
                                                <p className="text-lg font-semibold text-white">{(item.value || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regenerate */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                                <p className="text-xs text-zinc-500">
                                    Generated at {new Date(predictionData.generatedAt).toLocaleString()} using Groq AI
                                </p>
                                <button onClick={fetchPredictions} className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Regenerate
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
