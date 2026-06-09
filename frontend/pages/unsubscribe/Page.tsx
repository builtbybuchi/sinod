import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type Step = 'email' | 'select-lists' | 'reason' | 'done';

interface MailingListInfo {
  list_id: string;
  name: string;
  description: string;
  owner_email: string;
  subscriber_id: string;
  subscribed_at: string;
  source: string;
}

const UNSUBSCRIBE_REASONS = [
  { id: 'too_many', label: 'I receive too many emails' },
  { id: 'not_relevant', label: 'The content is not relevant to me' },
  { id: 'never_signed_up', label: "I don't remember signing up" },
  { id: 'prefer_social', label: 'I prefer to follow on social media' },
  { id: 'other', label: 'Other reason' },
];

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added manually by the list owner',
  csv: 'Imported from a CSV file',
  event: 'Added from an event registration',
  team: 'Added as a team member',
};

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailFromUrl = searchParams.get('email') || '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(emailFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List selection
  const [mailingLists, setMailingLists] = useState<MailingListInfo[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());

  // Reason
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');

  // Result
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);

  // Auto-lookup if email is in URL
  useEffect(() => {
    if (emailFromUrl) {
      handleLookup(emailFromUrl);
    }
  }, []);

  const handleLookup = async (lookupEmail?: string) => {
    const emailToUse = lookupEmail || email;
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/campaigns/unsubscribe/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to look up subscriptions');
      }

      if (data.success && data.lists && data.lists.length > 0) {
        setMailingLists(data.lists);
        setSelectedListIds(new Set());
        setStep('select-lists');
      } else {
        setError('No active subscriptions found for this email address.');
      }
    } catch (err: any) {
      console.error('Lookup error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleList = (listId: string) => {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedListIds(new Set(mailingLists.map((l) => l.list_id)));
  };

  const deselectAll = () => {
    setSelectedListIds(new Set());
  };

  const handleContinueToReason = () => {
    if (selectedListIds.size === 0) {
      setError('Please select at least one mailing list to unsubscribe from.');
      return;
    }
    setError(null);
    setStep('reason');
  };

  const handleConfirmUnsubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/campaigns/unsubscribe/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          list_ids: Array.from(selectedListIds),
          reason: selectedReason || '',
          details: details || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to unsubscribe');
      }

      if (data.success) {
        setUnsubscribedCount(data.unsubscribed_count || selectedListIds.size);
        setStep('done');
      } else {
        setError(data.message || 'Failed to unsubscribe. Please try again.');
      }
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-16 px-4">
      <div className="max-w-xl mx-auto">

        {/* ============ STEP 1: EMAIL INPUT ============ */}
        {step === 'email' && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-6">
                <span className="text-5xl">📬</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">Manage your subscriptions</h1>
              <p className="text-slate-400">
                Enter your email address to see all the mailing lists you're subscribed to.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Looking up...
                  </span>
                ) : (
                  'Find my subscriptions'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </form>
          </>
        )}

        {/* ============ STEP 2: SELECT LISTS ============ */}
        {step === 'select-lists' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-500/20 mb-6">
                <span className="text-5xl">📋</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">Your subscriptions</h1>
              <p className="text-slate-400">
                We found <span className="text-white font-semibold">{mailingLists.length}</span> mailing list{mailingLists.length !== 1 ? 's' : ''} for{' '}
                <span className="text-sky-400">{email}</span>
              </p>
              <p className="text-slate-500 text-sm mt-1">Select the ones you'd like to unsubscribe from.</p>
            </div>

            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">
                {selectedListIds.size} of {mailingLists.length} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={selectAll}
                  className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Mailing Lists */}
            <div className="space-y-3 mb-8">
              {mailingLists.map((list) => (
                <label
                  key={list.list_id}
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedListIds.has(list.list_id)
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedListIds.has(list.list_id)
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-500'
                        }`}
                      >
                        {selectedListIds.has(list.list_id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedListIds.has(list.list_id)}
                        onChange={() => toggleList(list.list_id)}
                        className="sr-only"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{list.name}</p>
                      {list.description && (
                        <p className="text-slate-400 text-sm mt-1">{list.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {list.source && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {SOURCE_LABELS[list.source] || `Source: ${list.source}`}
                          </span>
                        )}
                        {list.subscribed_at && (
                          <span>Subscribed {formatDate(list.subscribed_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleContinueToReason}
              disabled={selectedListIds.size === 0}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-semibold transition-colors"
            >
              Continue ({selectedListIds.size} selected)
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
              className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm mt-3"
            >
              ← Use a different email
            </button>
          </>
        )}

        {/* ============ STEP 3: REASON ============ */}
        {step === 'reason' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-6">
                <span className="text-5xl">💬</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">Before you go...</h1>
              <p className="text-slate-400">
                You're about to unsubscribe from <span className="text-white font-semibold">{selectedListIds.size}</span> mailing list{selectedListIds.size !== 1 ? 's' : ''}.
                Could you tell us why?
              </p>
            </div>

            {/* Summary of selected lists */}
            <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Unsubscribing from:</p>
              <div className="space-y-1">
                {mailingLists
                  .filter((l) => selectedListIds.has(l.list_id))
                  .map((l) => (
                    <p key={l.list_id} className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="text-amber-400">•</span> {l.name}
                    </p>
                  ))}
              </div>
            </div>

            {/* Reason Selection */}
            <div className="space-y-3 mb-6">
              {UNSUBSCRIBE_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === reason.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={() => setSelectedReason(reason.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedReason === reason.id ? 'border-sky-500' : 'border-slate-500'
                    }`}
                  >
                    {selectedReason === reason.id && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                  </div>
                  <span className="text-white">{reason.label}</span>
                </label>
              ))}
            </div>

            {/* Additional Details */}
            {selectedReason === 'other' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Please tell us more (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none"
                />
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirmUnsubscribe}
                disabled={loading}
                className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Unsubscribing...
                  </span>
                ) : (
                  `Unsubscribe from ${selectedListIds.size} list${selectedListIds.size !== 1 ? 's' : ''}`
                )}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 rounded-xl font-semibold transition-colors"
              >
                Never mind, keep me subscribed! 🎉
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('select-lists');
                  setError(null);
                }}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
              >
                ← Change selection
              </button>
            </div>
          </>
        )}

        {/* ============ STEP 4: DONE ============ */}
        {step === 'done' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/50 mb-8">
              <span className="text-6xl">👋</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">You've been unsubscribed</h1>
            <p className="text-slate-400 mb-2 text-lg">
              Successfully unsubscribed from {unsubscribedCount} mailing list{unsubscribedCount !== 1 ? 's' : ''}.
            </p>
            <p className="text-slate-500 mb-8">
              You will no longer receive emails from the selected lists.
            </p>

            <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 mb-8">
              <p className="text-sky-300 font-medium mb-2">Changed your mind?</p>
              <p className="text-slate-400 text-sm">
                Contact the list owners and they can add you back anytime.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}

        {/* Powered by footer */}
        <div className="mt-16 text-center">
          <a
            href="https://sinod.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest"
          >
            Powered by Sinod'
          </a>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
