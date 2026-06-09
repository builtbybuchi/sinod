import React, { useState } from 'react';
import { createWhiteboard } from '../services/whiteboardService';
import { useAuth } from '../contexts/AuthContext';

interface CreateWhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWhiteboardCreated: (whiteboardId: string) => void;
}

const CreateWhiteboardModal: React.FC<CreateWhiteboardModalProps> = ({
  isOpen,
  onClose,
  onWhiteboardCreated,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a whiteboard title');
      return;
    }

    if (!currentUser?.email) {
      setError('You must be logged in to create a whiteboard');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const whiteboard = await createWhiteboard(
        { title: title.trim() },
        currentUser.email
      );

      setTitle('');
      onWhiteboardCreated(whiteboard.$id);
      onClose();
    } catch (err: any) {
      console.error('Failed to create whiteboard:', err);
      setError(err.message || 'Failed to create whiteboard');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Whiteboard</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
              Whiteboard Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project Brainstorm, Design Mockup..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
              disabled={loading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Whiteboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWhiteboardModal;
