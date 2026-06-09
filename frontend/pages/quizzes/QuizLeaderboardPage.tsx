import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as quizzesApi from '../../services/quizzesApiService';
import { useAuth } from '../../contexts/AuthContext';

const QuizLeaderboardPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const emailFromUrl = searchParams.get('email') || '';

  const [quiz, setQuiz] = useState<quizzesApi.Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<quizzesApi.LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'country' | 'city'>('global');
  const [requiresAuth, setRequiresAuth] = useState(false);

  // Load quiz + leaderboard
  useEffect(() => {
    if (!quizId) return;
    const load = async () => {
      try {
        setLoading(true);
        const q = await quizzesApi.getQuiz(quizId);
        setQuiz(q);

        // Private quiz: requires login to see leaderboard
        if (!q.is_public && !currentUser) {
          setRequiresAuth(true);
          setLoading(false);
          return;
        }

        const lb = await quizzesApi.getQuizLeaderboard(quizId, scope, undefined, 50);
        setLeaderboard(lb.entries || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, scope, currentUser]);

  const highlightEmail = currentUser?.email || emailFromUrl;

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (s?: number) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── AUTH REQUIRED FOR PRIVATE QUIZ ───
  if (requiresAuth) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeUp { animation: fadeUp 0.5s ease-out forwards; }
        `}</style>
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6 animate-fadeUp">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center animate-fadeUp" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Sign in to view leaderboard
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            This quiz is private. Create an account or sign in to view the leaderboard and track your performance.
          </p>
          <div className="w-full space-y-3 animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (emailFromUrl) params.set('email', emailFromUrl);
                params.set('redirect', `/quiz/${quizId}/leaderboard`);
                navigate(`/signup?${params.toString()}`);
              }}
              className="w-full rounded-xl bg-sky-500 py-4 text-base font-bold text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98]"
            >
              Create Account →
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-all"
            >
              Sign In
            </button>
          </div>
          <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
            Powered by <span className="text-sky-400/60">Sinod'</span>
          </a>
        </div>
      </div>
    );
  }

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ─── LEADERBOARD ───
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeUp { animation: fadeUp 0.4s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-sky-400">Leaderboard</h1>
          <div className="w-5" />
        </div>
        {quiz && (
          <p className="text-xs text-gray-500 text-center truncate">{quiz.title}</p>
        )}

        {/* Scope tabs */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {(['global', 'country', 'city'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                scope === s
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex-shrink-0 flex items-end justify-center gap-4 px-4 pt-6 pb-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center animate-scaleIn" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 border-2 border-gray-500 text-sm font-bold text-white mb-2">
              {getInitials(leaderboard[1].respondent_name || 'NA')}
            </div>
            <p className="text-xs font-semibold text-white truncate max-w-[80px]">{leaderboard[1].respondent_name || 'Anonymous'}</p>
            <p className="text-[10px] text-gray-500">{leaderboard[1].score} pts</p>
            <div className="mt-2 h-16 w-16 rounded-t-lg bg-gray-700/50 border border-white/5 flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center animate-scaleIn" style={{ animationDelay: '0s', opacity: 0 }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 border-2 border-sky-400 text-base font-bold text-white mb-2 shadow-lg shadow-sky-500/30">
              {getInitials(leaderboard[0].respondent_name || 'NA')}
            </div>
            <p className="text-xs font-bold text-white truncate max-w-[80px]">{leaderboard[0].respondent_name || 'Anonymous'}</p>
            <p className="text-[10px] text-sky-400">{leaderboard[0].score} pts</p>
            <div className="mt-2 h-24 w-16 rounded-t-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center animate-scaleIn" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 border-2 border-amber-700 text-sm font-bold text-white mb-2">
              {getInitials(leaderboard[2].respondent_name || 'NA')}
            </div>
            <p className="text-xs font-semibold text-white truncate max-w-[80px]">{leaderboard[2].respondent_name || 'Anonymous'}</p>
            <p className="text-[10px] text-gray-500">{leaderboard[2].score} pts</p>
            <div className="mt-2 h-12 w-16 rounded-t-lg bg-amber-900/20 border border-amber-800/20 flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-sm">No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => {
              const isMe = highlightEmail && entry.respondent_email === highlightEmail;
              const medal = getMedalEmoji(entry.rank);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all animate-fadeUp ${
                    isMe
                      ? 'border-sky-500/50 bg-sky-500/5'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s`, opacity: 0 }}
                >
                  {/* Rank */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    {medal ? (
                      <span className="text-lg">{medal}</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-500">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isMe ? 'bg-gradient-to-br from-sky-500 to-sky-600' : 'bg-gray-700'
                  }`}>
                    {getInitials(entry.respondent_name || 'A')}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-sky-300' : 'text-white'}`}>
                      {entry.respondent_name || 'Anonymous'}
                      {isMe && <span className="text-[10px] font-normal text-sky-400/60 ml-2">You</span>}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {entry.correct_answers}/{entry.total_questions} correct
                      {entry.time_taken_seconds ? ` • ${formatTime(entry.time_taken_seconds)}` : ''}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-bold ${isMe ? 'text-sky-400' : 'text-white'}`}>
                      {entry.score}
                    </span>
                    <span className="text-[10px] text-gray-600 ml-1">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/10">
        <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
          Powered by <span className="text-sky-400/60">Sinod'</span>
        </a>
      </div>
    </div>
  );
};

export default QuizLeaderboardPage;
