import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getInviteByToken,
  acceptInvite,
  rejectInvite,
  getWhiteboard,
} from '../../services/whiteboardService';
import { WhiteboardInvite } from '../../types/whiteboards';

const WhiteboardInviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [invite, setInvite] = useState<WhiteboardInvite | null>(null);
  const [whiteboardTitle, setWhiteboardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token || !currentUser) return;

    const loadInvite = async () => {
      try {
        setLoading(true);
        const inviteData = await getInviteByToken(token);
        setInvite(inviteData);

        // Load whiteboard title
        const whiteboard = await getWhiteboard(inviteData.whiteboardId);
        setWhiteboardTitle(whiteboard.title);
        
        setError(null);
      } catch (err: any) {
        console.error('Error loading invite:', err);
        setError(err.message || 'Invalid or expired invite');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token, currentUser]);

  const handleAccept = async () => {
    if (!token || !currentUser?.email || !invite) return;

    try {
      setProcessing(true);
      await acceptInvite({ token, userEmail: currentUser.email });
      
      // Navigate to the whiteboard
      navigate(`/whiteboards/${invite.whiteboardId}`);
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite. Please try again.');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token || !currentUser?.email) return;

    try {
      setProcessing(true);
      await rejectInvite({ token, userEmail: currentUser.email });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error rejecting invite:', err);
      setError('Failed to reject invite. Please try again.');
      setProcessing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Sign in Required</h2>
          <p className="text-white/60 mb-6">Please sign in to accept this whiteboard invitation</p>
          <button
            onClick={() => navigate('/signin')}
            className="rounded-lg bg-purple-500 px-6 py-2 text-white hover:bg-purple-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Loading invitation...</div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-lg border border-red-500/20 bg-slate-900 p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h2>
          <p className="text-white/60 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-purple-500 px-6 py-2 text-white hover:bg-purple-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (invite.status !== 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-white mb-4">Invitation Already Processed</h2>
          <p className="text-white/60 mb-6">
            You have already {invite.status === 'accepted' ? 'accepted' : 'rejected'} this invitation.
          </p>
          {invite.status === 'accepted' ? (
            <button
              onClick={() => navigate(`/whiteboards/${invite.whiteboardId}`)}
              className="rounded-lg bg-purple-500 px-6 py-2 text-white hover:bg-purple-600 mr-2"
            >
              Open Whiteboard
            </button>
          ) : null}
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-white/10 px-6 py-2 text-white hover:bg-white/20"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-8">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
            <svg className="h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Whiteboard Invitation
          </h1>

          {/* Inviter Info */}
          <p className="text-white/60 text-center mb-6">
            <span className="font-semibold text-purple-400">{invite.invitedBy}</span> has invited you to collaborate on:
          </p>

          {/* Whiteboard Title */}
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-6">
            <div className="text-sm text-white/50 mb-1">Whiteboard</div>
            <div className="text-lg font-semibold text-white">{whiteboardTitle}</div>
          </div>

          {/* Expiration Notice */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 mb-6">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-yellow-400 mb-1">Invitation Expires</div>
                <div className="text-xs text-yellow-400/80">
                  {new Date(invite.expiresAt).toLocaleDateString()} at {new Date(invite.expiresAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-white transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Decline'}
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 rounded-lg bg-purple-500 px-4 py-3 text-white transition-colors hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {processing ? 'Accepting...' : 'Accept & Open'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-white/50 hover:text-white/80"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardInviteAcceptPage;
