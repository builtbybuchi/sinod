import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as formsApi from '../../../services/formsApiService';
import type { Form } from '../../../services/formsApiService';

type TabKey = 'live' | 'drafts';

interface FormsPageProps {
  onCreateForm: () => void;
  onEditForm: (formId: string) => void;
}

const FormsPage: React.FC<FormsPageProps> = ({ onCreateForm, onEditForm }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('live');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const result = await formsApi.listForms({ created_by: currentUser.email, limit: 100 });
      setForms(result.documents || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const filteredForms = useMemo(() => {
    let filtered = forms;

    // Tab filter
    if (activeTab === 'live') {
      filtered = filtered.filter((f) => f.status === 'active');
    } else {
      filtered = filtered.filter((f) => f.status === 'draft');
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [forms, activeTab, searchQuery]);

  const liveCt = useMemo(() => forms.filter((f) => f.status === 'active').length, [forms]);
  const draftCt = useMemo(() => forms.filter((f) => f.status === 'draft').length, [forms]);

  // ── Helpers ──
  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const handleDelete = async (formId: string) => {
    if (!currentUser?.email) return;
    if (!confirm('Are you sure you want to delete this form and all its responses?')) return;
    try {
      setDeletingId(formId);
      await formsApi.deleteForm(formId, currentUser.email);
      fetchForms();
    } catch (err) {
      console.error('Error deleting form:', err);
      alert('Failed to delete form');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (form: Form) => {
    if (!currentUser?.email) return;
    const next = form.status === 'active' ? 'closed' : 'active';
    try {
      await formsApi.updateForm(form.$id, { status: next }, currentUser.email);
      fetchForms();
    } catch (err) {
      console.error('Error updating form:', err);
    }
  };

  // ── Render ──
  return (
    <div className="min-h-full bg-slate-950 text-white pb-24 md:pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Forms
            </h1>
            <p className="text-sm text-gray-400 mt-1">Manage and monitor your assessments</p>
          </div>
          <button
            onClick={onCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-600 active:scale-[0.97] shadow-lg shadow-sky-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Form
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="inline-flex rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-white/5">
            <button
              onClick={() => setActiveTab('live')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Live Forms
              {liveCt > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-300">
                  {liveCt}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'drafts'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Drafts
              {draftCt > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-600/30 px-2 py-0.5 text-xs font-bold text-gray-300">
                  {draftCt}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="max-w-2xl mb-8">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-sm text-white placeholder-gray-500 transition-all focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 backdrop-blur-sm"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-sky-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" />
            <p className="text-gray-400">Loading forms...</p>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium mb-2">
              {activeTab === 'drafts' ? 'No draft forms' : 'No live forms yet'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === 'drafts'
                ? 'Save a form as draft to work on it later'
                : 'Create your first form to start collecting responses'}
            </p>
            <button
              onClick={onCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form, index) => (
              <div
                key={form.$id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10"
                style={{
                  animationDelay: `${index * 40}ms`,
                  animation: 'slide-up 0.4s ease-out forwards',
                }}
              >
                <div className="p-6">
                  {/* Status badge + menu */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/25">
                        <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        form.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : form.status === 'draft'
                          ? 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {form.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {form.status === 'active' ? 'LIVE' : form.status === 'draft' ? 'DRAFT' : 'CLOSED'}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-400 transition-all duration-300">
                    {form.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed">
                    {form.description || 'No description'}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Responses</p>
                      <p className="text-xl font-black text-white">{form.response_count ?? 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Updated</p>
                      <p className="text-sm font-semibold text-gray-300">{timeAgo(form.updated_at || form.$createdAt)}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-5">
                    <button
                      onClick={() => onEditForm(form.$id)}
                      className="flex-1 rounded-lg bg-sky-500/15 border border-sky-500/30 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/f/${form.page_url || form.$id}`;
                        navigator.clipboard.writeText(url);
                        alert('Form link copied!');
                      }}
                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                      title="Copy share link"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleToggleStatus(form)}
                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {form.status === 'active' ? 'Close' : 'Go Live'}
                    </button>
                    <button
                      onClick={() => handleDelete(form.$id)}
                      disabled={deletingId === form.$id}
                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50"
                    >
                      {deletingId === form.$id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create new form card */}
            <button
              onClick={onCreateForm}
              className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-transparent p-8 transition-all duration-300 hover:border-sky-500/40 hover:bg-sky-500/5 min-h-[280px]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 border border-white/10 mb-4 group-hover:border-sky-500/40 group-hover:bg-sky-500/10 transition-all">
                <svg className="w-6 h-6 text-gray-500 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Create New Form</p>
              <p className="text-xs text-gray-500 mt-1">Start from scratch or template</p>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default FormsPage;
