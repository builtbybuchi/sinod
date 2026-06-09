import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as formsApi from '../../../services/formsApiService';
import type { FormQuestion, CreateFormData, UpdateFormData } from '../../../services/formsApiService';
import { generateFormId } from '../../../utils/idGenerator';

interface FormBuilderPageProps {
  formId?: string | null;
  onBack: () => void;
}

// ── Field type definitions ──
const FIELD_TYPES: { type: FormQuestion['type']; label: string; icon: React.ReactNode }[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
  {
    type: 'email',
    label: 'Email',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'number',
    label: 'Number',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    ),
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'date',
    label: 'Date',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const FormBuilderPage: React.FC<FormBuilderPageProps> = ({ formId, onBack }) => {
  const { currentUser } = useAuth();
  const isEditing = Boolean(formId);

  // ── Form metadata ──
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [isPublic, setIsPublic] = useState(true);

  // ── Questions ──
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFieldPanel, setShowFieldPanel] = useState(false);

  // ── Load existing form when editing ──
  useEffect(() => {
    if (!formId) return;
    (async () => {
      try {
        setLoading(true);
        const form = await formsApi.getForm(formId);
        setTitle(form.title);
        setDescription(form.description || '');
        setStatus(form.status === 'closed' ? 'active' : (form.status as 'active' | 'draft'));
        setIsPublic(form.is_public);
        try {
          setQuestions(JSON.parse(form.questions));
        } catch {
          setQuestions([]);
        }
      } catch (err) {
        console.error('Failed to load form:', err);
        alert('Failed to load form');
        onBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [formId, onBack]);

  // ── Question operations ──
  const addField = useCallback((type: FormQuestion['type']) => {
    const newQ: FormQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: '',
      required: false,
      ...(type === 'select' || type === 'radio' || type === 'checkbox'
        ? { options: ['Option 1', 'Option 2'] }
        : {}),
    };
    setQuestions((prev) => [...prev, newQ]);
    setSelectedIdx(questions.length);
    setShowFieldPanel(false);
  }, [questions.length]);

  const updateQuestion = useCallback((idx: number, patch: Partial<FormQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }, []);

  const removeQuestion = useCallback((idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((prev) => {
      if (prev === null) return null;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  }, []);

  const duplicateQuestion = useCallback((idx: number) => {
    setQuestions((prev) => {
      const q = { ...prev[idx], id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
      const copy = [...prev];
      copy.splice(idx + 1, 0, q);
      return copy;
    });
    setSelectedIdx(idx + 1);
  }, []);

  const moveQuestion = useCallback((idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    setQuestions((prev) => {
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
    setSelectedIdx(newIdx);
  }, []);

  // ── Save ──
  const handleSave = async () => {
    if (!currentUser?.email || !title.trim()) return;
    try {
      setSaving(true);
      if (isEditing && formId) {
        const data: UpdateFormData = {
          title: title.trim(),
          description: description.trim(),
          questions,
          status,
          is_public: isPublic,
        };
        await formsApi.updateForm(formId, data, currentUser.email);
      } else {
        const data: CreateFormData = {
          title: title.trim(),
          description: description.trim(),
          questions,
          created_by: currentUser.email,
          status,
          is_public: isPublic,
          page_url: generateFormId(),
        };
        await formsApi.createForm(data);
      }
      onBack();
    } catch (err) {
      console.error('Error saving form:', err);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = selectedIdx !== null ? questions[selectedIdx] : null;

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 backdrop-blur-sm px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Forms</span>
          </button>
          <div className="hidden sm:block h-6 w-px bg-white/10" />
          <h1 className="text-sm md:text-base font-bold text-white truncate max-w-[200px] md:max-w-none">
            {isEditing ? 'Edit Form' : 'Create New Form'}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Status toggle */}
          <div className="hidden sm:inline-flex rounded-lg bg-slate-800/50 p-0.5 border border-white/5">
            <button
              onClick={() => setStatus('draft')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                status === 'draft' ? 'bg-gray-600/30 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatus('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-white'
              }`}
            >
              Live
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 md:px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">{isEditing ? 'Save Changes' : 'Publish Form'}</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════
            LEFT PANEL — Field Types (desktop) / Bottom Sheet (mobile)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-white/10 bg-slate-900/40 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Input Elements</h2>
          </div>
          <div className="p-3 space-y-1.5">
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-sky-500/10 hover:text-sky-300 hover:border-sky-500/20 border border-transparent group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-500 group-hover:text-sky-400 group-hover:bg-sky-500/10 group-hover:border-sky-500/20 transition-all flex-shrink-0">
                  {ft.icon}
                </div>
                <span>{ft.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════
            CENTER — Form Preview / Editor
           ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Form title & description */}
            <div className="mb-8">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Form"
                className="w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-gray-600 outline-none border-none focus:ring-0 mb-3"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 outline-none border-none focus:ring-0"
              />
              <div className="mt-4 h-px bg-gradient-to-r from-sky-500/40 via-blue-500/20 to-transparent" />
            </div>

            {/* ── Mobile: Status toggle ── */}
            <div className="sm:hidden mb-6 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</span>
              <div className="inline-flex rounded-lg bg-slate-800/50 p-0.5 border border-white/5">
                <button
                  onClick={() => setStatus('draft')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    status === 'draft' ? 'bg-gray-600/30 text-white' : 'text-gray-500'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => setStatus('active')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500'
                  }`}
                >
                  Live
                </button>
              </div>
            </div>

            {/* ── Questions list ── */}
            {questions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-2xl mb-4 border border-white/10">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-2">No fields yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  Add fields from the sidebar or click the button below to get started.
                </p>
                <button
                  onClick={() => addField('text')}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-500/30 px-5 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Field
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Field number + type badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Field {idx + 1}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-gray-400 border border-white/10">
                            {FIELD_TYPES.find((f) => f.type === q.type)?.label || q.type}
                          </span>
                          {q.required && (
                            <span className="text-red-400 text-xs font-bold">*</span>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className={`flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveQuestion(idx, -1); }}
                            disabled={idx === 0}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                            title="Move up"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 1); }}
                            disabled={idx === questions.length - 1}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                            title="Move down"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicateQuestion(idx); }}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                            title="Duplicate"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Field label */}
                      <p className="text-sm font-medium text-white mb-2">
                        {q.label || <span className="text-gray-500 italic">Untitled field</span>}
                      </p>

                      {/* Field preview */}
                      <div className="pointer-events-none">
                        {q.type === 'textarea' ? (
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 h-16 text-xs text-gray-600">
                            {q.placeholder || 'Long text answer...'}
                          </div>
                        ) : q.type === 'select' ? (
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
                            <span>Select an option...</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        ) : q.type === 'radio' ? (
                          <div className="space-y-1.5">
                            {(q.options || []).slice(0, 3).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="h-3.5 w-3.5 rounded-full border border-white/20" />
                                <span>{opt || `Option ${oi + 1}`}</span>
                              </div>
                            ))}
                            {(q.options || []).length > 3 && (
                              <p className="text-[10px] text-gray-600 pl-5">+{(q.options || []).length - 3} more</p>
                            )}
                          </div>
                        ) : q.type === 'checkbox' ? (
                          <div className="space-y-1.5">
                            {(q.options || []).slice(0, 3).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="h-3.5 w-3.5 rounded border border-white/20" />
                                <span>{opt || `Option ${oi + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-600">
                            {q.placeholder || `${q.type === 'email' ? 'email@example.com' : q.type === 'number' ? '0' : q.type === 'date' ? 'mm/dd/yyyy' : 'Short answer...'}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add field button at bottom */}
                <button
                  onClick={() => setShowFieldPanel(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-5 text-sm font-medium text-gray-500 hover:border-sky-500/30 hover:text-sky-400 hover:bg-sky-500/5 transition-all md:hidden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Field
                </button>
                <button
                  onClick={() => addField('text')}
                  className="w-full hidden md:flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-5 text-sm font-medium text-gray-500 hover:border-sky-500/30 hover:text-sky-400 hover:bg-sky-500/5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Field
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT PANEL — Field Properties (desktop)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 border-l border-white/10 bg-slate-900/40 overflow-y-auto flex-shrink-0">
          {selectedQuestion ? (
            <>
              <div className="p-4 border-b border-white/5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Field Properties</h2>
              </div>
              <div className="p-4 space-y-5">
                {/* Label */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Label</label>
                  <input
                    type="text"
                    value={selectedQuestion.label}
                    onChange={(e) => updateQuestion(selectedIdx!, { label: e.target.value })}
                    placeholder="Field label..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Type</label>
                  <select
                    value={selectedQuestion.type}
                    onChange={(e) => {
                      const newType = e.target.value as FormQuestion['type'];
                      const patch: Partial<FormQuestion> = { type: newType };
                      if (['select', 'radio', 'checkbox'].includes(newType) && !(selectedQuestion.options?.length)) {
                        patch.options = ['Option 1', 'Option 2'];
                      }
                      updateQuestion(selectedIdx!, patch);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.type} value={ft.type}>{ft.label}</option>
                    ))}
                  </select>
                </div>

                {/* Placeholder */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Placeholder</label>
                  <input
                    type="text"
                    value={selectedQuestion.placeholder || ''}
                    onChange={(e) => updateQuestion(selectedIdx!, { placeholder: e.target.value })}
                    placeholder="Placeholder text..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                  />
                </div>

                {/* Options (for select/radio/checkbox) */}
                {['select', 'radio', 'checkbox'].includes(selectedQuestion.type) && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Options</label>
                    <div className="space-y-2">
                      {(selectedQuestion.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(selectedQuestion.options || [])];
                              newOpts[oi] = e.target.value;
                              updateQuestion(selectedIdx!, { options: newOpts });
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const newOpts = (selectedQuestion.options || []).filter((_, i) => i !== oi);
                              updateQuestion(selectedIdx!, { options: newOpts });
                            }}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOpts = [...(selectedQuestion.options || []), ''];
                          updateQuestion(selectedIdx!, { options: newOpts });
                        }}
                        className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs text-gray-500 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Settings</label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Required</span>
                    <div
                      onClick={() => updateQuestion(selectedIdx!, { required: !selectedQuestion.required })}
                      className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                        selectedQuestion.required ? 'bg-sky-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          selectedQuestion.required ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Danger zone */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => removeQuestion(selectedIdx!)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Field
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800/50 rounded-2xl mb-4 border border-white/10">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Select a field to edit its properties</p>
            </div>
          )}
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — Field Type Bottom Sheet
         ═══════════════════════════════════════════════════════════════ */}
      {showFieldPanel && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFieldPanel(false)} />
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-white/10 bg-slate-900 shadow-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Add Field</h3>
              <button onClick={() => setShowFieldPanel(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.type}
                  onClick={() => addField(ft.type)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-400 border border-white/10 hover:bg-sky-500/10 hover:text-sky-300 hover:border-sky-500/20 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-500">
                    {ft.icon}
                  </div>
                  <span>{ft.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — Field Properties Bottom Sheet (when a field is selected)
         ═══════════════════════════════════════════════════════════════ */}
      {selectedQuestion && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
          <div className="rounded-t-2xl border-t border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Field Properties</h3>
              <button onClick={() => setSelectedIdx(null)} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto pb-safe">
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Label</label>
                <input
                  type="text"
                  value={selectedQuestion.label}
                  onChange={(e) => updateQuestion(selectedIdx!, { label: e.target.value })}
                  placeholder="Field label..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Type</label>
                <select
                  value={selectedQuestion.type}
                  onChange={(e) => {
                    const newType = e.target.value as FormQuestion['type'];
                    const patch: Partial<FormQuestion> = { type: newType };
                    if (['select', 'radio', 'checkbox'].includes(newType) && !(selectedQuestion.options?.length)) {
                      patch.options = ['Option 1', 'Option 2'];
                    }
                    updateQuestion(selectedIdx!, patch);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.type} value={ft.type}>{ft.label}</option>
                  ))}
                </select>
              </div>

              {/* Options */}
              {['select', 'radio', 'checkbox'].includes(selectedQuestion.type) && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Options</label>
                  <div className="space-y-2">
                    {(selectedQuestion.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(selectedQuestion.options || [])];
                            newOpts[oi] = e.target.value;
                            updateQuestion(selectedIdx!, { options: newOpts });
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const newOpts = (selectedQuestion.options || []).filter((_, i) => i !== oi);
                            updateQuestion(selectedIdx!, { options: newOpts });
                          }}
                          className="rounded-lg p-1 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOpts = [...(selectedQuestion.options || []), ''];
                        updateQuestion(selectedIdx!, { options: newOpts });
                      }}
                      className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs text-gray-500 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Required toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300">Required</span>
                <div
                  onClick={() => updateQuestion(selectedIdx!, { required: !selectedQuestion.required })}
                  className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                    selectedQuestion.required ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      selectedQuestion.required ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>

              {/* Delete */}
              <button
                onClick={() => removeQuestion(selectedIdx!)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderPage;
