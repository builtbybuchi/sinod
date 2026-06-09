/**
 * GroupChatModal Component
 * Modal for creating or editing a team conversation
 * Uses email-only input with auto-lookup of platform user names
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConversationListItem } from '../../types/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || '';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (
    name: string,
    description: string,
    participantEmails: string[],
    participantNames: string[]
  ) => Promise<void>;
  currentUserEmail: string;
  mode?: 'create' | 'edit';
  existingConversation?: ConversationListItem;
}

interface Participant {
  email: string;
  name: string;
  isOnPlatform: boolean;
  avatar?: string;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  currentUserEmail,
  mode = 'create',
  existingConversation,
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ found: boolean; name?: string; email?: string; avatar?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'edit' && existingConversation) {
      setTeamName(existingConversation.name || '');
      setDescription(existingConversation.description || '');
      const existingParticipants: Participant[] = [];
      existingConversation.participants.forEach((email, index) => {
        if (email !== currentUserEmail) {
          existingParticipants.push({
            email,
            name: existingConversation.participantNames[index] || email,
            isOnPlatform: true,
          });
        }
      });
      setParticipants(existingParticipants);
    }
  }, [isOpen, mode, existingConversation, currentUserEmail]);

  // Debounced email lookup
  const lookupEmail = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLookupResult(null);
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/lookup/email?email=${encodeURIComponent(email)}`);
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
      if (participantEmail.trim()) {
        lookupEmail(participantEmail.trim());
      } else {
        setLookupResult(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [participantEmail, lookupEmail]);

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    setError(null);
    const email = participantEmail.trim().toLowerCase();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }

    if (email === currentUserEmail) {
      setError('You cannot add yourself');
      return;
    }

    if (participants.some((p) => p.email === email)) {
      setError('This member is already added');
      return;
    }

    // Use looked-up name if found, otherwise use email prefix
    const name = lookupResult?.found && lookupResult.name ? lookupResult.name : email.split('@')[0];
    const isOnPlatform = lookupResult?.found || false;
    const avatar = lookupResult?.avatar;

    setParticipants([...participants, { email, name, isOnPlatform, avatar }]);
    setParticipantEmail('');
    setLookupResult(null);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (participants.length === 0) {
      setError('Add at least one team member');
      return;
    }

    setIsCreating(true);

    try {
      await onCreateGroup(
        teamName.trim(),
        description.trim(),
        participants.map((p) => p.email),
        participants.map((p) => p.name)
      );
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setDescription('');
    setParticipantEmail('');
    setParticipants([]);
    setLookupResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {mode === 'edit' ? 'Edit Team' : 'Create Team'}
          </h2>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Team Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-white/80 mb-2">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="My Awesome Team"
                className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/50"
                disabled={isCreating}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this team about?"
                rows={3}
                className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Add Team Members */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Add Team Members <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-white/40 mb-3">
              Enter an email address. If the person is on the platform, their name will be auto-filled. Otherwise, they'll receive an invite.
            </p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddParticipant(); }}}
                    placeholder="user@example.com"
                    className="w-full bg-white/5 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/50"
                    disabled={isCreating}
                  />
                  {isLookingUp && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                    </div>
                  )}
                  {lookupResult && !isLookingUp && participantEmail.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {lookupResult.found ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          {lookupResult.name}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Will invite
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  disabled={isCreating}
                >
                  Add
                </button>
              </div>

              {/* Members List */}
              {participants.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white/80">
                      Team Members ({participants.length})
                    </p>
                  </div>

                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.email}
                        className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-white font-medium">{participant.name}</p>
                              {participant.isOnPlatform ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">on platform</span>
                              ) : (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">will be invited</span>
                              )}
                            </div>
                            <p className="text-xs text-white/60">{participant.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(participant.email)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
                          disabled={isCreating}
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10">
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
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {mode === 'edit' ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>{mode === 'edit' ? 'Save Changes' : 'Create Team'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;
