import React, { useState } from 'react';
import { createDocument } from '../services/documentService';
import { useAuth } from '../contexts/AuthContext';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (documentId: string) => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }

    if (!currentUser?.email) {
      setError('You must be logged in to create documents');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const document = await createDocument(
        {
          title: title.trim(),
          initialContent: JSON.stringify({ type: 'doc', content: [] }),
        },
        currentUser.email
      );

      onDocumentCreated(document.$id);
      setTitle('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create document:', err);
      setError(err.message || 'Failed to create document. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create New Document</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="mb-2 block text-sm font-medium text-white/80">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Untitled Document"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentModal;
