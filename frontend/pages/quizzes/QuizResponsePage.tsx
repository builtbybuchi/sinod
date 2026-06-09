import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as quizzesApi from '../../services/quizzesApiService';

interface ParsedQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  label: string;
  options?: string[];
  correct_answer?: string;
  points?: number;
  explanation?: string;
}

// Confetti particle
interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

type Phase = 'loading' | 'error' | 'intro' | 'quiz' | 'feedback' | 'results' | 'post-quiz';

const CONFETTI_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#3b82f6', '#60a5fa', '#a3e635', '#4ade80', '#22d3ee', '#818cf8'];

const QuizResponsePage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<quizzesApi.Quiz | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // User info
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');

  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [quizResponse, setQuizResponse] = useState<quizzesApi.QuizResponse | null>(null);

  // Confetti
  const [confettiParticles, setConfettiParticles] = useState<Particle[]>([]);
  const [showOops, setShowOops] = useState(false);

  // Progress shake on wrong
  const [shakeProgress, setShakeProgress] = useState(false);

  // Load quiz
  useEffect(() => {
    if (!quizId) return;
    const load = async () => {
      try {
        const q = await quizzesApi.getQuiz(quizId);
        setQuiz(q);
        const parsed: ParsedQuestion[] = JSON.parse(q.questions || '[]');
        setQuestions(parsed);
        setPhase('intro');
      } catch (e: any) {
        setError(e.message || 'Quiz not found');
        setPhase('error');
      }
    };
    load();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] || null;
  const progressPercent = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

  // Generate confetti
  const spawnConfetti = useCallback(() => {
    const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setConfettiParticles(particles);
    setTimeout(() => setConfettiParticles([]), 5000);
  }, []);

  const startQuiz = useCallback(() => {
    if (!respondentName.trim()) return;
    setPhase('quiz');
    setTimeElapsed(0);
  }, [respondentName]);

  const handleSelectAnswer = useCallback(async (answer: string) => {
    if (isAnimating || selectedAnswer || !quizId || !currentQ) return;
    setSelectedAnswer(answer);
    setIsAnimating(true);

    try {
      const result = await quizzesApi.checkAnswer(quizId, currentQ.id, answer);
      const correct = result.correct;
      setIsCorrect(correct);
      // Store the correct answer from backend for display
      if (currentQ) {
        currentQ.correct_answer = result.correct_answer;
        currentQ.explanation = result.explanation || undefined;
      }
      setAnswers(prev => ({ ...prev, [currentQ.id]: answer }));

      if (correct) {
        setScore(s => s + result.points);
        setCorrectCount(c => c + 1);
        spawnConfetti();
      } else {
        setShowOops(true);
        setShakeProgress(true);
        setTimeout(() => { setShowOops(false); setShakeProgress(false); }, 1500);
      }

      // Show explanation briefly then proceed
      if (result.explanation) {
        setTimeout(() => setShowExplanation(true), 800);
      }
    } catch {
      // Fallback: mark as answered but unknown
      setIsCorrect(false);
      setAnswers(prev => ({ ...prev, [currentQ.id]: answer }));
    }
  }, [isAnimating, selectedAnswer, currentQ, quizId, spawnConfetti]);

  const handleContinue = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
      setIsAnimating(false);
      setCurrentIndex(i => i + 1);
    } else {
      // Quiz complete — submit
      handleSubmitQuiz();
    }
  }, [currentIndex, totalQuestions]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quizId || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setPhase('results');

    try {
      const resp = await quizzesApi.submitQuizResponse(quizId, {
        respondent_name: respondentName,
        respondent_email: respondentEmail || undefined,
        answers,
        time_taken_seconds: timeElapsed,
      });
      setQuizResponse(resp);
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [quizId, respondentName, respondentEmail, answers, timeElapsed, submitting]);

  const handleShortAnswerSubmit = useCallback(async () => {
    if (!currentQ || !selectedAnswer?.trim() || !quizId) return;
    setIsAnimating(true);

    try {
      const result = await quizzesApi.checkAnswer(quizId, currentQ.id, selectedAnswer.trim());
      const correct = result.correct;
      setIsCorrect(correct);
      // Store the correct answer from backend for display
      if (currentQ) {
        currentQ.correct_answer = result.correct_answer;
        currentQ.explanation = result.explanation || undefined;
      }
      setAnswers(prev => ({ ...prev, [currentQ.id]: selectedAnswer }));
      if (correct) {
        setScore(s => s + result.points);
        setCorrectCount(c => c + 1);
        spawnConfetti();
      } else {
        setShowOops(true);
        setShakeProgress(true);
        setTimeout(() => { setShowOops(false); setShakeProgress(false); }, 1500);
      }
      if (result.explanation) {
        setTimeout(() => setShowExplanation(true), 800);
      }
    } catch {
      setIsCorrect(false);
      setAnswers(prev => ({ ...prev, [currentQ.id]: selectedAnswer }));
    }
  }, [currentQ, selectedAnswer, quizId, spawnConfetti]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // ─── LOADING ───
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (phase === 'error') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Quiz Not Found</h1>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ─── INTRO ───
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
        <style>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        `}</style>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <div />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 max-w-lg mx-auto w-full animate-scaleIn">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{quiz?.title || 'Quiz'}</h1>
          {quiz?.description && <p className="text-sm text-gray-400 mb-6">{quiz.description}</p>}

          <div className="flex items-center gap-4 mb-8 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {totalQuestions} questions
            </span>
            {quiz?.time_limit_seconds && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {Math.floor(quiz.time_limit_seconds / 60)} min
              </span>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Your name *</label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Enter your name..."
                autoFocus
                className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Email (optional)</label>
              <input
                type="email"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border-b-2 border-gray-700 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={!respondentName.trim()}
            className={`w-full rounded-xl py-4 text-base font-bold transition-all ${
              respondentName.trim()
                ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20 active:scale-[0.98]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Quiz →
          </button>

          <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
            Powered by <span className="text-sky-400/60">Sinod'</span>
          </a>
        </div>
      </div>
    );
  }

  // ─── RESULTS ───
  if (phase === 'results') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
        <style>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes countUp { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .animate-fadeUp { animation: fadeUp 0.5s ease-out forwards; }
          .animate-countUp { animation: countUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        `}</style>

        {/* Confetti on good score */}
        {scorePercent >= 70 && confettiParticles.length === 0 && (() => { spawnConfetti(); return null; })()}

        {/* Confetti layer */}
        {confettiParticles.length > 0 && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {confettiParticles.map(p => (
              <div
                key={p.id}
                className="absolute top-0"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  transform: `rotate(${p.rotation}deg)`,
                  animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
                }}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          {submitting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <p className="text-sm text-gray-400">Calculating your score...</p>
            </div>
          ) : (
            <>
              {/* Score circle */}
              <div className="animate-scaleIn mb-6">
                <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 ${
                  scorePercent >= 70 ? 'border-emerald-500 bg-emerald-500/10' : scorePercent >= 40 ? 'border-sky-500 bg-sky-500/10' : 'border-red-500 bg-red-500/10'
                }`}>
                  <div className="text-center">
                    <span className={`text-4xl font-bold animate-countUp ${
                      scorePercent >= 70 ? 'text-emerald-400' : scorePercent >= 40 ? 'text-sky-400' : 'text-red-400'
                    }`}>{scorePercent}%</span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-1 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
                {scorePercent >= 70 ? '🎉 Excellent!' : scorePercent >= 40 ? '👍 Good effort!' : '💪 Keep trying!'}
              </h1>
              <p className="text-gray-400 text-sm mb-6 animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
                You got {correctCount} out of {totalQuestions} correct
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 w-full mb-8 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Score</p>
                  <p className="text-lg font-bold text-white">{quizResponse?.score ?? score}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Correct</p>
                  <p className="text-lg font-bold text-white">{correctCount}/{totalQuestions}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Time</p>
                  <p className="text-lg font-bold text-white">{formatTime(timeElapsed)}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-3 animate-fadeUp" style={{ animationDelay: '0.5s', opacity: 0 }}>
                <button
                  onClick={() => navigate(`/quiz/${quizId}/leaderboard${respondentEmail ? `?email=${encodeURIComponent(respondentEmail)}` : ''}`)}
                  className="w-full rounded-xl bg-sky-500 py-4 text-base font-bold text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98]"
                >
                  View Leaderboard →
                </button>
                <button
                  onClick={() => { setPhase('post-quiz'); }}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-all"
                >
                  Done
                </button>
              </div>

              <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
                Powered by <span className="text-sky-400/60">Sinod'</span>
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── POST-QUIZ: Prompt to create account ───
  if (phase === 'post-quiz') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeUp { animation: fadeUp 0.5s ease-out forwards; }
        `}</style>
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6 animate-fadeUp">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center animate-fadeUp" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Want to track your progress?
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Create a free Sinod' account to view your leaderboard position, compete with others, and track quiz performance over time.
          </p>

          <div className="w-full space-y-3 animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <button
              onClick={() => {
                // Navigate to signup with email pre-filled, and quiz redirect info
                const params = new URLSearchParams();
                if (respondentEmail) params.set('email', respondentEmail);
                params.set('redirect', `/quiz/${quizId}/leaderboard`);
                if (quizResponse?.$id) params.set('response_id', quizResponse.$id);
                navigate(`/signup?${params.toString()}`);
              }}
              className="w-full rounded-xl bg-sky-500 py-4 text-base font-bold text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98]"
            >
              Create Account →
            </button>
            <button
              onClick={() => window.close()}
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-all"
            >
              Maybe later
            </button>
          </div>

          <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
            Powered by <span className="text-sky-400/60">Sinod'</span>
          </a>
        </div>
      </div>
    );
  }

  // ─── QUIZ PHASE ───
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Animations CSS */}
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes confettiFall { 
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } 
        }
        @keyframes oopsBounce { 
          0% { opacity: 0; transform: scale(0.3) rotate(-10deg); } 
          50% { opacity: 1; transform: scale(1.1) rotate(5deg); } 
          70% { transform: scale(0.95) rotate(-2deg); } 
          100% { opacity: 1; transform: scale(1) rotate(0deg); } 
        }
        @keyframes oopsFadeOut { 
          from { opacity: 1; transform: scale(1); } 
          to { opacity: 0; transform: scale(0.8) translateY(-20px); } 
        }
        @keyframes shake { 
          0%, 100% { transform: translateX(0); } 
          20% { transform: translateX(-4px); } 
          40% { transform: translateX(4px); } 
          60% { transform: translateX(-4px); } 
          80% { transform: translateX(4px); } 
        }
        @keyframes optionCorrect { 
          0% { transform: scale(1); } 
          50% { transform: scale(1.03); } 
          100% { transform: scale(1); } 
        }
        @keyframes optionWrong { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-6px); } 
          75% { transform: translateX(6px); } 
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideInRight { animation: slideInRight 0.35s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fadeUp { animation: fadeUp 0.4s ease-out forwards; }
      `}</style>

      {/* Confetti layer */}
      {confettiParticles.length > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {confettiParticles.map(p => (
            <div
              key={p.id}
              className="absolute top-0"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${p.rotation}deg)`,
                animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Oops overlay */}
      {showOops && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div style={{ animation: 'oopsBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, oopsFadeOut 0.4s ease-in 1s forwards' }}>
            <span className="text-6xl">😬</span>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); navigate(-1); }}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-mono text-gray-500">{formatTime(timeElapsed)}</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < currentIndex ? 'w-1.5 bg-sky-500' :
                i === currentIndex ? 'w-4 bg-sky-500' :
                'w-1.5 bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className={`h-1 rounded-full bg-gray-800 overflow-hidden ${shakeProgress ? 'animate-shake' : ''}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      {currentQ && (
        <div className="flex-1 flex flex-col px-6 md:px-12 max-w-2xl mx-auto w-full overflow-y-auto">
          <div key={currentIndex} className="animate-slideInRight pt-8">
            {/* Question text */}
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight mb-8">
              {currentQ.label}
            </h1>

            {/* Multiple choice / True-False options */}
            {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
              <div className="space-y-3">
                {(currentQ.options || (currentQ.type === 'true_false' ? ['True', 'False'] : [])).map((opt, i) => {
                  const isSelected = selectedAnswer === opt;
                  const isAnswer = selectedAnswer !== null && currentQ.correct_answer === opt;
                  const isWrongPick = isSelected && !isCorrect;

                  let borderClass = 'border-gray-700/50';
                  let bgClass = 'bg-gray-800/30 hover:bg-gray-800/50';
                  let textClass = 'text-gray-300';
                  let animClass = '';

                  if (selectedAnswer !== null) {
                    if (isAnswer) {
                      borderClass = 'border-emerald-500';
                      bgClass = 'bg-emerald-500/10';
                      textClass = 'text-white';
                      animClass = 'animate-optionCorrect';
                    } else if (isWrongPick) {
                      borderClass = 'border-red-500';
                      bgClass = 'bg-red-500/10';
                      textClass = 'text-white';
                      animClass = 'animate-optionWrong';
                    } else {
                      bgClass = 'bg-gray-800/20';
                      textClass = 'text-gray-500';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAnswer(opt)}
                      disabled={selectedAnswer !== null}
                      className={`flex items-center justify-between w-full rounded-xl border p-4 text-left transition-all ${borderClass} ${bgClass} ${textClass}`}
                      style={animClass === 'animate-optionCorrect' ? { animation: 'optionCorrect 0.4s ease-out' } : animClass === 'animate-optionWrong' ? { animation: 'optionWrong 0.4s ease-in-out' } : undefined}
                    >
                      <div>
                        <span className="text-sm font-medium">{opt}</span>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isAnswer ? 'border-emerald-500 bg-emerald-500' :
                        isWrongPick ? 'border-red-500 bg-red-500' :
                        isSelected ? 'border-sky-500 bg-sky-500' :
                        'border-gray-600'
                      }`}>
                        {(isSelected || isAnswer) && (
                          isAnswer ? (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isWrongPick ? (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : null
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {currentQ.type === 'short_answer' && (
              <div>
                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={isAnimating}
                  placeholder="Type your answer..."
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleShortAnswerSubmit(); }}
                />
                {!isAnimating && (
                  <button
                    onClick={handleShortAnswerSubmit}
                    disabled={!selectedAnswer?.trim()}
                    className={`mt-4 rounded-lg px-6 py-3 text-sm font-bold text-white transition-all ${
                      selectedAnswer?.trim() ? 'bg-sky-500 hover:bg-sky-600' : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Submit Answer
                  </button>
                )}
                {isAnimating && isCorrect !== null && (
                  <p className={`mt-3 text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrect ? '✓ Correct!' : `✗ The answer was: ${currentQ.correct_answer}`}
                  </p>
                )}
              </div>
            )}

            {/* Explanation */}
            {showExplanation && currentQ.explanation && (
              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 animate-fadeUp">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Explanation</p>
                <p className="text-sm text-gray-300">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-6 md:px-12 pb-6 pt-4 max-w-2xl mx-auto w-full">
        {selectedAnswer !== null && (
          <button
            onClick={handleContinue}
            className="w-full rounded-xl bg-sky-500 py-4 text-base font-bold text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98] animate-fadeUp"
          >
            {currentIndex < totalQuestions - 1 ? 'Continue →' : 'See Results →'}
          </button>
        )}

        <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-center mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
          Powered by <span className="text-sky-400/60">Sinod'</span>
        </a>
      </div>
    </div>
  );
};

export default QuizResponsePage;
