import React, { useState } from 'react';
import { createInvite, removeCollaborator, generateInviteLink } from '../services/whiteboardService';
import { WhiteboardModel } from '../types/whiteboards';
import { useAuth } from '../contexts/AuthContext';

interface ManageWhiteboardCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiteboard: WhiteboardModel;
  onUpdate: () => void;
}

const ManageWhiteboardCollaboratorsModal: React.FC<ManageWhiteboardCollaboratorsModalProps> = ({
  isOpen,
  onClose,
  whiteboard,
  onUpdate,
}) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const isOwner = whiteboard.createdBy === currentUser?.email;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!currentUser?.email) {
      setError('You must be logged in');
      return;
    }

    if (email === currentUser.email) {
      setError('You cannot invite yourself');
      return;
    }

    if (whiteboard.collaborators.includes(email)) {
      setError('This user is already a collaborator');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const invite = await createInvite(whiteboard.$id, email, currentUser.email);
      setInviteToken(invite.token);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      onUpdate();
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collaboratorEmail: string) => {
    if (!currentUser?.email) return;
    
    if (!confirm(`Remove ${collaboratorEmail} from this whiteboard?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await removeCollaborator(whiteboard.$id, collaboratorEmail, currentUser.email);
      setSuccess(`Removed ${collaboratorEmail}`);
      onUpdate();
    } catch (err: any) {
      console.error('Failed to remove collaborator:', err);
      setError(err.message || 'Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteToken) return;
    
    const link = generateInviteLink(inviteToken);
    navigator.clipboard.writeText(link);
    setSuccess('Invite link copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Manage Collaborators</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite Form */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}

        {/* Share Link */}
        {inviteToken && (
          <div className="mb-6 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sky-300 mb-1">Share Link Created</p>
                <p className="text-xs text-white/60">Send this link to invite collaborators directly</p>
              </div>
              <button
                onClick={copyInviteLink}
                className="rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/30"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Collaborators List */}
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">
            Current Collaborators ({whiteboard.collaborators.length + 1})
          </h3>
          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-sm font-bold text-white">
                  {whiteboard.createdBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{whiteboard.createdBy}</p>
                  <p className="text-xs text-sky-400">Owner</p>
                </div>
              </div>
            </div>

            {/* Collaborators */}
            {whiteboard.collaborators.map((collaboratorEmail) => (
              <div
                key={collaboratorEmail}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-sm font-bold text-white">
                    {collaboratorEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{collaboratorEmail}</p>
                    <p className="text-xs text-white/60">Collaborator</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemove(collaboratorEmail)}
                    disabled={loading}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isOwner && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm text-white/60">
            Only the owner can manage collaborators
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageWhiteboardCollaboratorsModal;
