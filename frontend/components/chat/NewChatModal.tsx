/**
 * NewChatModal Component
 * Modal for creating a new direct conversation
 * Uses email-only input with auto-lookup of platform user names
 */

import React, { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || '';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (email: string, name: string) => Promise<void>;
  currentUserEmail: string;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  currentUserEmail,
}) => {
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ found: boolean; name?: string; email?: string; avatar?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced email lookup
  const lookupEmail = useCallback(async (emailToLookup: string) => {
    if (!emailToLookup || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToLookup)) {
      setLookupResult(null);
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/lookup/email?email=${encodeURIComponent(emailToLookup)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResult(data);
      } else {
        setLookupResult({ found: false });
      }
    } catch {
      setLookupResult(null);
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email.trim()) {
        lookupEmail(email.trim());
      } else {
        setLookupResult(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, lookupEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Invalid email address');
      return;
    }

    if (trimmedEmail === currentUserEmail) {
      setError('You cannot start a conversation with yourself');
      return;
    }

    if (!lookupResult?.found) {
      setError('This user is not on the platform yet. They need to sign up first to start a direct chat.');
      return;
    }

    setIsCreating(true);

    try {
      const name = lookupResult.name || trimmedEmail.split('@')[0];
      await onCreateChat(trimmedEmail, name);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setLookupResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">New Chat</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/50"
                disabled={isCreating}
                required
              />
              {isLookingUp && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                </div>
              )}
            </div>
          </div>

          {/* User lookup result */}
          {lookupResult && !isLookingUp && email.trim() && (
            <div className={`rounded-lg p-3 ${lookupResult.found ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
              {lookupResult.found ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium">
                    {(lookupResult.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{lookupResult.name}</p>
                    <p className="text-xs text-green-400">Found on platform ✓</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>This email is not registered on the platform. Ask them to sign up first!</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-white/40">
            Enter an email address to find a user on the platform and start a private conversation.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-white/80 hover:bg-white/5 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isCreating || !lookupResult?.found}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Start Chat'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;
