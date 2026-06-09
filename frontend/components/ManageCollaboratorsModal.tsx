import React, { useState, useEffect } from 'react';
import { createInvite, removeCollaborator, generateInviteLink, listPendingInvites } from '../services/documentService';
import { DocumentModel, DocumentInvite } from '../types/documents';
import { useAuth } from '../contexts/AuthContext';

interface ManageCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentModel | null;
  onUpdate: () => void;
}

const ManageCollaboratorsModal: React.FC<ManageCollaboratorsModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
}) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<DocumentInvite[]>([]);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      loadPendingInvites();
    }
  }, [isOpen, document]);

  const loadPendingInvites = async () => {
    if (!document) return;
    
    try {
      // In a real implementation, you'd fetch invites for this specific document
      // For now, we'll just show a placeholder
      setPendingInvites([]);
    } catch (err) {
      console.error('Failed to load pending invites:', err);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!document || !currentUser?.email) {
      setError('Unable to send invite');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if already a collaborator
    if (document.collaborators.includes(email)) {
      setError('This user is already a collaborator');
      return;
    }

    // Check if trying to invite owner
    if (document.createdBy === email) {
      setError('Cannot invite the document owner');
      return;
    }

    setIsInviting(true);
    setError(null);
    setSuccess(null);

    try {
      await createInvite({
        documentId: document.$id,
        email: email.trim(),
        inviterEmail: currentUser.email,
        inviterName: currentUser.name || currentUser.email,
        documentTitle: document.title,
      });

      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      loadPendingInvites();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    if (!document || !currentUser?.email) return;

    if (!confirm(`Remove ${collaboratorEmail} from this document?`)) {
      return;
    }

    try {
      await removeCollaborator(document.$id, collaboratorEmail, currentUser.email);
      setSuccess('Collaborator removed');
      onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to remove collaborator:', err);
      setError(err.message || 'Failed to remove collaborator');
    }
  };

  const handleGenerateShareLink = async () => {
    if (!document || !currentUser?.email) return;

    setIsInviting(true);
    setError(null);

    try {
      const invite = await createInvite({
        documentId: document.$id,
        email: 'invite-link@temporary.com', // Placeholder for link-based invites
        inviterEmail: currentUser.email,
        inviterName: currentUser.name || currentUser.email,
        documentTitle: document.title,
      });

      const link = generateInviteLink(invite.token);
      setShowShareLink(true);
      setCopiedToken(link);
    } catch (err: any) {
      console.error('Failed to generate share link:', err);
      setError(err.message || 'Failed to generate share link');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (copiedToken) {
      navigator.clipboard.writeText(copiedToken);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  if (!isOpen || !document) return null;

  const isOwner = document.createdBy === currentUser?.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Collaborators</h2>
            <p className="text-sm text-white/60 mt-1">{document.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite Section - Only for owners */}
        {isOwner && (
          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-white/80">
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="colleague@example.com"
                  className="flex-1 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
                />
                <button
                  onClick={handleInvite}
                  disabled={isInviting || !email.trim()}
                  className="rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerateShareLink}
                disabled={isInviting}
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Generate Share Link
              </button>
            </div>

            {showShareLink && copiedToken && (
              <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-sky-400 mb-1">Shareable Link:</p>
                    <p className="text-sm text-white font-mono truncate">{copiedToken}</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Current Collaborators */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
            Collaborators ({document.collaborators.length + 1})
          </h3>
          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-sm font-bold text-white">
                  {document.createdBy.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{document.createdBy}</p>
                  <p className="text-xs text-white/50">Owner</p>
                </div>
              </div>
            </div>

            {/* Collaborators */}
            {document.collaborators.map((collaborator) => (
              <div
                key={collaborator}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-sm font-bold text-white">
                    {collaborator.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{collaborator}</p>
                    <p className="text-xs text-white/50">Collaborator</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator)}
                    className="rounded-lg px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {document.collaborators.length === 0 && (
              <p className="py-4 text-center text-sm text-white/50">
                No collaborators yet. Invite someone to get started!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCollaboratorsModal;
