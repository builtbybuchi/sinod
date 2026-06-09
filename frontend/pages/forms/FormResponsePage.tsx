import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as formsApi from '../../services/formsApiService';

interface ParsedQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

type SlideDirection = 'left' | 'right' | 'none';

const FormResponsePage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<formsApi.Form | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [slideDir, setSlideDir] = useState<SlideDirection>('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Load form
  useEffect(() => {
    if (!formId) return;
    const loadForm = async () => {
      try {
        setLoading(true);
        const f = await formsApi.getForm(formId);
        setForm(f);
        const parsed: ParsedQuestion[] = JSON.parse(f.questions || '[]');
        setQuestions(parsed);
      } catch (e: any) {
        setError(e.message || 'Form not found');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [formId]);

  // Focus input on question change
  useEffect(() => {
    if (currentIndex >= 0 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [currentIndex]);

  const totalSteps = questions.length;
  const currentQ = currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null;

  const canGoNext = useCallback(() => {
    if (currentIndex === -1) return respondentName.trim().length > 0;
    if (!currentQ) return false;
    const val = answers[currentQ.id];
    if (currentQ.required) {
      if (currentQ.type === 'checkbox') return Array.isArray(val) && val.length > 0;
      return val !== undefined && val !== '';
    }
    return true;
  }, [currentIndex, currentQ, answers, respondentName]);

  const slideTo = useCallback((direction: SlideDirection, newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDir(direction);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setSlideDir('none');
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    if (!canGoNext() || isAnimating) return;
    if (currentIndex < totalSteps - 1) {
      slideTo('left', currentIndex + 1);
    } else {
      // Submit
      handleSubmit();
    }
  }, [canGoNext, currentIndex, totalSteps, isAnimating, slideTo]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    if (currentIndex > -1) {
      slideTo('right', currentIndex - 1);
    }
  }, [currentIndex, isAnimating, slideTo]);

  const handleSubmit = useCallback(async () => {
    if (!formId || submitting) return;
    setSubmitting(true);
    try {
      await formsApi.submitFormResponse(formId, {
        respondent_name: respondentName,
        respondent_email: respondentEmail || undefined,
        answers,
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [formId, respondentName, respondentEmail, answers, submitting]);

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleCheckbox = useCallback((questionId: string, option: string) => {
    setAnswers(prev => {
      const current: string[] = prev[questionId] || [];
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext]);

  // Slide animation classes
  const getSlideClass = () => {
    if (slideDir === 'left') return 'animate-slideOutLeft';
    if (slideDir === 'right') return 'animate-slideOutRight';
    return 'animate-slideIn';
  };

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (error && !form) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Form Not Found</h1>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ─── SUBMITTED ───
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-scaleIn">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-gray-400 text-sm mb-6">Your response has been submitted successfully.</p>
          <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">Powered by <span className="text-sky-400/60">Sinod'</span></a>
        </div>
      </div>
    );
  }

  // ─── MAIN ───
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* CSS animations */}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-60px); } }
        @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(60px); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .animate-slideOutLeft { animation: slideOutLeft 0.3s ease-in forwards; }
        .animate-slideOutRight { animation: slideOutRight 0.3s ease-in forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-end px-5 py-4 flex-shrink-0">
        <button
          onClick={() => window.close()}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {currentIndex >= 0 && (
        <div className="px-5 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-sky-400">{currentIndex + 1}</span>
            <span className="text-xs text-gray-500">→</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Question {currentIndex + 1} of {totalSteps}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-2xl mx-auto w-full">
        <div key={currentIndex} className={getSlideClass()}>
          {/* Intro screen: name collection */}
          {currentIndex === -1 && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                {form?.title || 'Form'}
              </h1>
              {form?.description && (
                <p className="text-sm text-gray-400 mb-8">{form.description}</p>
              )}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Your name *</label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Type your name here..."
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
            </div>
          )}

          {/* Question screens */}
          {currentQ && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
                {currentQ.label}
                {currentQ.required && <span className="text-sky-400 ml-1">*</span>}
              </h1>

              {/* Text input */}
              {currentQ.type === 'text' && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder || 'Type your answer here...'}
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
                />
              )}

              {/* Email input */}
              {currentQ.type === 'email' && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="email"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder || 'your@email.com'}
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
                />
              )}

              {/* Number input */}
              {currentQ.type === 'number' && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="number"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder || '0'}
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
                />
              )}

              {/* Date input */}
              {currentQ.type === 'date' && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="date"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors"
                />
              )}

              {/* Textarea */}
              {currentQ.type === 'textarea' && (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder || 'Type your answer here...'}
                  rows={4}
                  className="w-full bg-transparent border-b-2 border-sky-500/50 text-white text-lg py-3 px-1 placeholder-gray-600 outline-none focus:border-sky-500 transition-colors resize-none"
                />
              )}

              {/* Select dropdown */}
              {currentQ.type === 'select' && (
                <div className="space-y-3">
                  {(currentQ.options || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(currentQ.id, opt)}
                      className={`flex items-center justify-between w-full rounded-xl border p-4 text-left transition-all ${
                        answers[currentQ.id] === opt
                          ? 'border-sky-500 bg-sky-500/10 text-white'
                          : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
                      }`}
                    >
                      <span className="text-sm font-medium">{opt}</span>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[currentQ.id] === opt ? 'border-sky-500 bg-sky-500' : 'border-gray-600'
                      }`}>
                        {answers[currentQ.id] === opt && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Radio */}
              {currentQ.type === 'radio' && (
                <div className="space-y-3">
                  {(currentQ.options || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(currentQ.id, opt)}
                      className={`flex items-center justify-between w-full rounded-xl border p-4 text-left transition-all ${
                        answers[currentQ.id] === opt
                          ? 'border-sky-500 bg-sky-500/10 text-white'
                          : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
                      }`}
                    >
                      <span className="text-sm font-medium">{opt}</span>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[currentQ.id] === opt ? 'border-sky-500 bg-sky-500' : 'border-gray-600'
                      }`}>
                        {answers[currentQ.id] === opt && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {currentQ.type === 'checkbox' && (
                <div className="space-y-3">
                  {(currentQ.options || []).map((opt, i) => {
                    const checked = (answers[currentQ.id] || []).includes(opt);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleCheckbox(currentQ.id, opt)}
                        className={`flex items-center justify-between w-full rounded-xl border p-4 text-left transition-all ${
                          checked
                            ? 'border-sky-500 bg-sky-500/10 text-white'
                            : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="text-sm font-medium">{opt}</span>
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          checked ? 'border-sky-500 bg-sky-500' : 'border-gray-600'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-6 md:px-12 lg:px-24 pb-6 pt-4 max-w-2xl mx-auto w-full">
        {/* OK / Submit button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goNext}
            disabled={!canGoNext() || submitting}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-all ${
              canGoNext()
                ? 'bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20 active:scale-95'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : currentIndex === totalSteps - 1 ? (
              <>Submit</>
            ) : (
              <>
                OK
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <a href="https://sinod.app" target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
            Powered by <span className="text-sky-400/60">Sinod'</span>
          </a>
          {/* Navigation arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex <= -1}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                currentIndex > -1
                  ? 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'border-gray-800 bg-gray-900/50 text-gray-700 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                canGoNext()
                  ? 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'border-gray-800 bg-gray-900/50 text-gray-700 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormResponsePage;
