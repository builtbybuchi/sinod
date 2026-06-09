import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as quizzesApi from '../../../services/quizzesApiService';
import type { Quiz, LeaderboardEntry, LeaderboardResult } from '../../../services/quizzesApiService';

type TabKey = 'leaderboards' | 'my-quizzes';
type LeaderboardScope = 'global' | 'country' | 'city';

interface QuizzesPageProps {
  onCreateQuiz: () => void;
  onEditQuiz: (quizId: string) => void;
}

const QuizzesPage: React.FC<QuizzesPageProps> = ({ onCreateQuiz, onEditQuiz }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboards');

  // ── Leaderboard state ──
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>('global');
  const [leaderboardFilter, setLeaderboardFilter] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  // ── My Quizzes state ──
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch leaderboard ──
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true);
      const result = await quizzesApi.getPublicLeaderboard(
        leaderboardScope,
        leaderboardScope !== 'global' ? leaderboardFilter : undefined,
        50
      );
      setLeaderboard(result);

      // Find current user's rank
      if (currentUser?.email) {
        const found = result.entries.find((e) => e.respondent_email === currentUser.email);
        setUserRank(found || null);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [leaderboardScope, leaderboardFilter, currentUser?.email]);

  useEffect(() => {
    if (activeTab === 'leaderboards') {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  // ── Fetch quizzes ──
  const fetchQuizzes = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoadingQuizzes(true);
      const result = await quizzesApi.listQuizzes({ created_by: currentUser.email, limit: 100 });
      setQuizzes(result.documents || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (activeTab === 'my-quizzes') {
      fetchQuizzes();
    }
  }, [activeTab, fetchQuizzes]);

  // ── Filtered quizzes ──
  const filteredQuizzes = useMemo(() => {
    let filtered = quizzes;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(s) ||
          (q.description && q.description.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [quizzes, statusFilter, searchQuery]);

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

  const formatTime = (secs?: number) => {
    if (!secs) return '--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleDelete = async (quizId: string) => {
    if (!currentUser?.email) return;
    if (!confirm('Delete this quiz and all its responses?')) return;
    try {
      setDeletingId(quizId);
      await quizzesApi.deleteQuiz(quizId, currentUser.email);
      fetchQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Failed to delete quiz');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    if (!currentUser?.email) return;
    const next = quiz.status === 'active' ? 'closed' : 'active';
    try {
      await quizzesApi.updateQuiz(quiz.$id, { status: next }, currentUser.email);
      fetchQuizzes();
    } catch (err) {
      console.error('Error updating quiz:', err);
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
              Quizzes
            </h1>
            <p className="text-sm text-gray-400 mt-1">Manage and monitor your educational assessments</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('my-quizzes');
              onCreateQuiz();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-600 active:scale-[0.97] shadow-lg shadow-sky-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Quiz
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-white/5">
            <button
              onClick={() => setActiveTab('leaderboards')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'leaderboards'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Leaderboards
            </button>
            <button
              onClick={() => setActiveTab('my-quizzes')}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'my-quizzes'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Quizzes
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            LEADERBOARDS TAB
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'leaderboards' && (
          <div>
            {/* Scope selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <div className="inline-flex rounded-xl bg-slate-900/50 p-1 border border-white/5">
                {(['global', 'country', 'city'] as LeaderboardScope[]).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => {
                      setLeaderboardScope(scope);
                      if (scope === 'global') setLeaderboardFilter('');
                    }}
                    className={`rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                      leaderboardScope === scope
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>

              {leaderboardScope !== 'global' && (
                <input
                  type="text"
                  value={leaderboardFilter}
                  onChange={(e) => setLeaderboardFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLeaderboard()}
                  placeholder={`Enter ${leaderboardScope} name and press Enter...`}
                  className="flex-1 max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              )}
            </div>

            {loadingLeaderboard ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" />
                <p className="text-gray-400">Loading leaderboard...</p>
              </div>
            ) : !leaderboard || leaderboard.entries.length === 0 ? (
              /* Empty leaderboard prompt */
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-2xl mb-6">
                  <svg className="w-10 h-10 text-sky-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">No leaderboard data yet</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
                  Participate in a public quiz to see your leaderboard position and rankings.
                </p>
                <p className="text-gray-500 text-xs max-w-md mx-auto">
                  You can check your global, country, and city rankings across all public quizzes you've participated in.
                </p>
              </div>
            ) : (
              <div>
                {/* User's position highlight */}
                {userRank && (
                  <div className="mb-6 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-blue-500/10 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30">
                        <span className="text-2xl font-black text-sky-300">#{userRank.rank}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">Your Position</p>
                        <p className="text-xs text-gray-400">
                          Score: {userRank.score} pts · {userRank.correct_answers} correct · {userRank.quiz_count || 1} quiz{(userRank.quiz_count || 1) > 1 ? 'zes' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Scope</p>
                        <p className="text-sm font-semibold text-sky-300 capitalize">{leaderboardScope}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaderboard table */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Participant</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-2 text-center hidden sm:block">Correct</div>
                    <div className="col-span-3 text-center hidden md:block">Location</div>
                  </div>

                  {/* Rows */}
                  {leaderboard.entries.map((entry) => {
                    const isMe = currentUser?.email === entry.respondent_email;
                    return (
                      <div
                        key={`${entry.rank}-${entry.respondent_email}`}
                        className={`grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-white/5 last:border-b-0 transition-colors ${
                          isMe ? 'bg-sky-500/5' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="col-span-1">
                          {entry.rank <= 3 ? (
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                                entry.rank === 1
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : entry.rank === 2
                                  ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30'
                                  : 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                              }`}
                            >
                              {entry.rank}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400 pl-2">{entry.rank}</span>
                          )}
                        </div>
                        <div className="col-span-4">
                          <p className={`text-sm font-semibold ${isMe ? 'text-sky-300' : 'text-white'}`}>
                            {entry.respondent_name || 'Anonymous'}
                            {isMe && <span className="ml-1.5 text-[10px] text-sky-400">(You)</span>}
                          </p>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-lg font-black text-white">{entry.score}</span>
                          <span className="text-xs text-gray-500 ml-1">pts</span>
                        </div>
                        <div className="col-span-2 text-center hidden sm:block">
                          <span className="text-sm text-gray-300">
                            {entry.correct_answers}/{entry.total_questions}
                          </span>
                        </div>
                        <div className="col-span-3 text-center hidden md:block">
                          <span className="text-xs text-gray-400">
                            {[entry.city, entry.country].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                  {leaderboard.total} total participant{leaderboard.total !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MY QUIZZES TAB
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'my-quizzes' && (
          <div>
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative group flex-1 max-w-2xl">
                <input
                  type="text"
                  placeholder="Search quizzes..."
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

              <div className="inline-flex rounded-xl bg-slate-900/50 p-1 border border-white/5 self-start">
                {(['all', 'active', 'closed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-all ${
                      statusFilter === s
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {loadingQuizzes ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" />
                <p className="text-gray-400">Loading quizzes...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg font-medium mb-2">No quizzes found</p>
                <p className="text-gray-500 text-sm mb-6">Create your first quiz to start assessing knowledge</p>
                <button
                  onClick={onCreateQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.$id}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10"
                    style={{
                      animationDelay: `${index * 40}ms`,
                      animation: 'slide-up 0.4s ease-out forwards',
                    }}
                  >
                    <div className="p-6">
                      {/* Status badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {quiz.is_public && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/20">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                              </svg>
                              PUBLIC
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            quiz.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : quiz.status === 'draft'
                              ? 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {quiz.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {quiz.status === 'active' ? 'LIVE' : quiz.status === 'draft' ? 'DRAFT' : 'CLOSED'}
                        </span>
                      </div>

                      {/* Title + description */}
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-400 transition-all duration-300">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed">
                        {quiz.description || 'No description'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm border-t border-white/5 pt-4 mb-5">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{quiz.response_count ?? 0} Joined</span>
                        </div>
                        {quiz.time_limit_seconds ? (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(quiz.time_limit_seconds)}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditQuiz(quiz.$id)}
                          className="flex-1 rounded-lg bg-sky-500/15 border border-sky-500/30 px-4 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/q/${quiz.page_url || quiz.$id}`;
                            navigator.clipboard.writeText(url);
                            alert('Quiz link copied!');
                          }}
                          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                          title="Copy share link"
                        >
                          Share
                        </button>
                        <button
                          onClick={() => handleToggleStatus(quiz)}
                          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                          {quiz.status === 'active' ? 'Close' : 'Go Live'}
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.$id)}
                          disabled={deletingId === quiz.$id}
                          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50"
                        >
                          {deletingId === quiz.$id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Create new quiz card */}
                <button
                  onClick={onCreateQuiz}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-transparent p-8 transition-all duration-300 hover:border-sky-500/40 hover:bg-sky-500/5 min-h-[320px]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 border border-white/10 mb-4 group-hover:border-sky-500/40 group-hover:bg-sky-500/10 transition-all">
                    <svg className="w-6 h-6 text-gray-500 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Create New Assessment</p>
                  <p className="text-xs text-gray-500 mt-1">Draft a new set of questions</p>
                </button>
              </div>
            )}
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

export default QuizzesPage;
