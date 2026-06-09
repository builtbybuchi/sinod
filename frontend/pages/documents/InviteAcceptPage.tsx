import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInviteByToken, acceptInvite, rejectInvite, getDocument } from '../../services/documentService';
import { DocumentInvite, DocumentModel } from '../../types/documents';
import { useAuth } from '../../contexts/AuthContext';

const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [invite, setInvite] = useState<DocumentInvite | null>(null);
  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token]);

  const loadInvite = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const inviteData = await getInviteByToken(token);
      setInvite(inviteData);

      // Load document details
      const doc = await getDocument(inviteData.documentId);
      setDocument(doc);
    } catch (err: any) {
      console.error('Failed to load invite:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !currentUser?.email || processing) return;

    try {
      setProcessing(true);
      setError(null);
      await acceptInvite({ token, userEmail: currentUser.email });
      
      // Navigate to the document
      if (invite) {
        navigate(`/documents/${invite.documentId}`);
      }
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
      setError(err.message || 'Failed to accept invitation');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token || !currentUser?.email || processing) return;

    try {
      setProcessing(true);
      setError(null);
      await rejectInvite({ token, userEmail: currentUser.email });
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to reject invite:', err);
      setError(err.message || 'Failed to reject invitation');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-white/60">Loading invitation...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-3 inline-flex">
            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (invite?.status !== 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 rounded-full bg-yellow-500/10 p-3 inline-flex">
            <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Invitation Already Processed</h2>
          <p className="text-white/60 mb-6">This invitation has already been {invite.status}.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-slate-900/80 p-8 backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 rounded-full bg-sky-500/10 p-3 inline-flex">
            <svg className="h-8 w-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Document Invitation</h1>
          <p className="text-white/60">You've been invited to collaborate</p>
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div>
            <div className="text-xs text-white/50 mb-1">Document</div>
            <div className="text-white font-medium">{document?.title || 'Untitled Document'}</div>
          </div>
          
          <div>
            <div className="text-xs text-white/50 mb-1">Invited By</div>
            <div className="text-white">{invite.invitedBy}</div>
          </div>

          <div>
            <div className="text-xs text-white/50 mb-1">Invited On</div>
            <div className="text-white">{new Date(invite.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Accepting...' : 'Accept & Open Document'}
          </button>
          
          <button
            onClick={handleReject}
            disabled={processing}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Declining...' : 'Decline Invitation'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
