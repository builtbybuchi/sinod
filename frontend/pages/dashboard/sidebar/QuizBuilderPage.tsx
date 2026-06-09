import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as quizzesApi from '../../../services/quizzesApiService';
import type { QuizQuestion, CreateQuizData, UpdateQuizData } from '../../../services/quizzesApiService';
import { generateQuizId } from '../../../utils/idGenerator';

interface QuizBuilderPageProps {
  quizId?: string | null;
  onBack: () => void;
}

const QUESTION_TYPES: { type: QuizQuestion['type']; label: string; shortLabel: string }[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', shortLabel: 'MCQ' },
  { type: 'true_false', label: 'True / False', shortLabel: 'T/F' },
  { type: 'short_answer', label: 'Short Answer', shortLabel: 'SA' },
];

const QuizBuilderPage: React.FC<QuizBuilderPageProps> = ({ quizId, onBack }) => {
  const { currentUser } = useAuth();
  const isEditing = Boolean(quizId);

  // ── Quiz metadata ──
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [isPublic, setIsPublic] = useState(true);
  const [timeLimit, setTimeLimit] = useState(0); // seconds

  // ── Questions ──
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load existing quiz ──
  useEffect(() => {
    if (!quizId || !currentUser?.email) return;
    (async () => {
      try {
        setLoading(true);
        const quiz = await quizzesApi.getQuiz(quizId, true, currentUser.email);
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setStatus(quiz.status === 'closed' ? 'active' : (quiz.status as 'active' | 'draft'));
        setIsPublic(quiz.is_public);
        setTimeLimit(quiz.time_limit_seconds || 0);
        try {
          setQuestions(JSON.parse(quiz.questions));
        } catch {
          setQuestions([]);
        }
      } catch (err) {
        console.error('Failed to load quiz:', err);
        alert('Failed to load quiz');
        onBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, currentUser?.email, onBack]);

  // ── Question operations ──
  const addQuestion = useCallback((type: QuizQuestion['type'] = 'multiple_choice') => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: '',
      points: 1,
      correct_answer: '',
      ...(type === 'multiple_choice'
        ? { options: ['', ''] }
        : type === 'true_false'
        ? { options: ['True', 'False'], correct_answer: 'True' }
        : {}),
    };
    setQuestions((prev) => [...prev, newQ]);
    setSelectedIdx(questions.length);
  }, [questions.length]);

  const updateQuestion = useCallback((idx: number, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }, []);

  const removeQuestion = useCallback((idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((prev) => {
      if (prev === null) return null;
      if (prev === idx) return questions.length > 1 ? Math.min(idx, questions.length - 2) : null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  }, [questions.length]);

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
      if (isEditing && quizId) {
        const data: UpdateQuizData = {
          title: title.trim(),
          description: description.trim(),
          questions,
          status,
          is_public: isPublic,
          time_limit_seconds: timeLimit || undefined,
        };
        await quizzesApi.updateQuiz(quizId, data, currentUser.email);
      } else {
        const data: CreateQuizData = {
          title: title.trim(),
          description: description.trim(),
          questions,
          created_by: currentUser.email,
          status,
          is_public: isPublic,
          time_limit_seconds: timeLimit || undefined,
          page_url: generateQuizId(),
        };
        await quizzesApi.createQuiz(data);
      }
      onBack();
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = selectedIdx !== null ? questions[selectedIdx] : null;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading quiz...</p>
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
            <span className="hidden sm:inline">Back to Quizzes</span>
          </button>
          <div className="hidden sm:block h-6 w-px bg-white/10" />
          <h1 className="text-sm md:text-base font-bold text-white truncate max-w-[200px] md:max-w-none">
            {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 mr-2">
            <span>{questions.length} Q</span>
            <span className="h-3 w-px bg-white/10" />
            <span>{totalPoints} pts</span>
          </div>

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
                <span className="hidden sm:inline">{isEditing ? 'Save Changes' : 'Publish Quiz'}</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════
            LEFT PANEL — Question Outline (desktop)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-white/10 bg-slate-900/40 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Outline</h2>
          </div>

          <div className="flex-1 p-3 space-y-1">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left rounded-xl px-3 py-3 transition-all group ${
                  selectedIdx === idx
                    ? 'bg-sky-500/10 border border-sky-500/30'
                    : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                      selectedIdx === idx
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedIdx === idx ? 'text-white' : 'text-gray-400'}`}>
                      {q.label || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedIdx === idx ? 'text-sky-400/70' : 'text-gray-600'}`}>
                        {QUESTION_TYPES.find((t) => t.type === q.type)?.shortLabel || q.type}
                      </span>
                      <span className="text-[9px] text-gray-600">·</span>
                      <span className="text-[9px] text-gray-600">{q.points || 1} pt{(q.points || 1) > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Add question button */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={() => addQuestion('multiple_choice')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-3 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════
            CENTER — Question Configurator
           ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Quiz title & description */}
            <div className="mb-8">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Quiz"
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

            {/* ── Mobile-only: Status + Visibility + Time ── */}
            <div className="sm:hidden mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 w-16">Status</span>
                <div className="inline-flex rounded-lg bg-slate-800/50 p-0.5 border border-white/5">
                  <button onClick={() => setStatus('draft')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${status === 'draft' ? 'bg-gray-600/30 text-white' : 'text-gray-500'}`}>Draft</button>
                  <button onClick={() => setStatus('active')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500'}`}>Live</button>
                </div>
              </div>
            </div>

            {/* ── Quiz settings row ── */}
            <div className="flex flex-wrap items-center gap-4 mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Visibility</span>
                <div className="inline-flex rounded-lg bg-slate-800/50 p-0.5 border border-white/5">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isPublic ? 'bg-sky-500/20 text-sky-300' : 'text-gray-500 hover:text-white'}`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${!isPublic ? 'bg-sky-500/20 text-sky-300' : 'text-gray-500 hover:text-white'}`}
                  >
                    Private
                  </button>
                </div>
              </div>
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time Limit</span>
                <input
                  type="number"
                  value={timeLimit ? timeLimit / 60 : ''}
                  onChange={(e) => setTimeLimit(Number(e.target.value) * 60)}
                  placeholder="None"
                  min="0"
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>

            {/* ── No questions state ── */}
            {questions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-2xl mb-4 border border-white/10">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-2">No questions yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  Add your first question to start building the quiz.
                </p>
                <button
                  onClick={() => addQuestion('multiple_choice')}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-500/30 px-5 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`relative rounded-2xl border p-5 md:p-6 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Question header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/25 text-xs font-bold text-sky-300">
                            {idx + 1}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            q.type === 'multiple_choice'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                              : q.type === 'true_false'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {QUESTION_TYPES.find((t) => t.type === q.type)?.label || q.type}
                          </span>
                          <span className="text-[10px] font-bold text-gray-600">{q.points || 1} pt{(q.points || 1) > 1 ? 's' : ''}</span>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveQuestion(idx, -1); }}
                            disabled={idx === 0}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 1); }}
                            disabled={idx === questions.length - 1}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                            className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => { e.stopPropagation(); updateQuestion(idx, { label: e.target.value }); }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Type your question here..."
                        className="w-full bg-transparent text-base font-medium text-white placeholder-gray-600 outline-none border-none focus:ring-0 mb-4"
                      />

                      {/* Answer options for MCQ */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Answer Options</p>
                          {(q.options || []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuestion(idx, { correct_answer: opt });
                                }}
                                className={`flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center ${
                                  q.correct_answer === opt && opt !== ''
                                    ? 'border-emerald-400 bg-emerald-500/20'
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                              >
                                {q.correct_answer === opt && opt !== '' && (
                                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const oldOpt = (q.options || [])[oi];
                                  const newOpts = [...(q.options || [])];
                                  newOpts[oi] = e.target.value;
                                  const patch: Partial<QuizQuestion> = { options: newOpts };
                                  if (q.correct_answer === oldOpt) {
                                    patch.correct_answer = e.target.value;
                                  }
                                  updateQuestion(idx, patch);
                                }}
                                placeholder={`Option ${oi + 1}`}
                                className="flex-1 bg-transparent border-b border-white/10 px-1 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500/50 transition-colors"
                              />
                              {(q.options || []).length > 2 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newOpts = (q.options || []).filter((_, i) => i !== oi);
                                    const patch: Partial<QuizQuestion> = { options: newOpts };
                                    if (q.correct_answer === opt) patch.correct_answer = '';
                                    updateQuestion(idx, patch);
                                  }}
                                  className="rounded-lg p-1 text-gray-600 hover:text-red-400 transition-all"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuestion(idx, { options: [...(q.options || []), ''] });
                            }}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-sky-400 transition-colors mt-1 pl-8"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add an option
                          </button>
                        </div>
                      )}

                      {/* True/False */}
                      {q.type === 'true_false' && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Correct Answer</p>
                          <div className="flex gap-3">
                            {['True', 'False'].map((val) => (
                              <button
                                key={val}
                                onClick={(e) => { e.stopPropagation(); updateQuestion(idx, { correct_answer: val }); }}
                                className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                                  q.correct_answer === val
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Short answer */}
                      {q.type === 'short_answer' && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Correct Answer</p>
                          <input
                            type="text"
                            value={q.correct_answer || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); updateQuestion(idx, { correct_answer: e.target.value }); }}
                            placeholder="Type the correct answer..."
                            className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-300 placeholder-emerald-500/30 focus:border-emerald-500/40 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Points + Explanation (inline) */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Points:</span>
                          <input
                            type="number"
                            value={q.points || 1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); updateQuestion(idx, { points: Math.max(1, Number(e.target.value)) }); }}
                            min="1"
                            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white text-center focus:border-sky-500/50 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); updateQuestion(idx, { explanation: e.target.value }); }}
                            placeholder="Explanation (optional)..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-sky-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add question at bottom */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {QUESTION_TYPES.map((qt) => (
                    <button
                      key={qt.type}
                      onClick={() => addQuestion(qt.type)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-4 text-xs font-medium text-gray-500 hover:border-sky-500/30 hover:text-sky-400 hover:bg-sky-500/5 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT PANEL — Question Properties (desktop)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 border-l border-white/10 bg-slate-900/40 overflow-y-auto flex-shrink-0">
          {selectedQuestion ? (
            <>
              <div className="p-4 border-b border-white/5">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Question Properties</h2>
              </div>
              <div className="p-4 space-y-5">
                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Question Type</label>
                  <select
                    value={selectedQuestion.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuizQuestion['type'];
                      const patch: Partial<QuizQuestion> = { type: newType };
                      if (newType === 'multiple_choice' && !(selectedQuestion.options?.length)) {
                        patch.options = ['', ''];
                        patch.correct_answer = '';
                      } else if (newType === 'true_false') {
                        patch.options = ['True', 'False'];
                        patch.correct_answer = 'True';
                      } else if (newType === 'short_answer') {
                        patch.correct_answer = '';
                      }
                      updateQuestion(selectedIdx!, patch);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    {QUESTION_TYPES.map((qt) => (
                      <option key={qt.type} value={qt.type}>{qt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Points */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Points</label>
                  <input
                    type="number"
                    value={selectedQuestion.points || 1}
                    onChange={(e) => updateQuestion(selectedIdx!, { points: Math.max(1, Number(e.target.value)) })}
                    min="1"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                  />
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Correct Answer</label>
                  {selectedQuestion.type === 'true_false' ? (
                    <div className="flex gap-2">
                      {['True', 'False'].map((val) => (
                        <button
                          key={val}
                          onClick={() => updateQuestion(selectedIdx!, { correct_answer: val })}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                            selectedQuestion.correct_answer === val
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ) : selectedQuestion.type === 'multiple_choice' ? (
                    <p className="text-xs text-gray-500 italic">
                      Click the circle next to an option in the question card to set the correct answer.
                    </p>
                  ) : (
                    <input
                      type="text"
                      value={selectedQuestion.correct_answer || ''}
                      onChange={(e) => updateQuestion(selectedIdx!, { correct_answer: e.target.value })}
                      placeholder="Type correct answer..."
                      className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-300 placeholder-emerald-500/30 focus:border-emerald-500/40 focus:outline-none"
                    />
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Explanation</label>
                  <textarea
                    value={selectedQuestion.explanation || ''}
                    onChange={(e) => updateQuestion(selectedIdx!, { explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-sky-500/50 focus:outline-none resize-none"
                  />
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
                    Delete Question
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-800/50 rounded-2xl mb-4 border border-white/10">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Select a question to edit its properties</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default QuizBuilderPage;
