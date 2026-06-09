import React, { useState, useEffect, useRef } from 'react';
import { getDocument, updateDocumentContent, updateDocumentTitle, deleteDocument } from '../../services/documentService';
import { DocumentModel } from '../../types/documents';
import { useAuth } from '../../contexts/AuthContext';
import ManageCollaboratorsModal from '../../components/ManageCollaboratorsModal';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import LexicalToolbar from '../../components/LexicalToolbar';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { EditorState } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Plugin to load document content
function LoadDocumentPlugin({ content }: { content: string | null }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!content) return;

    try {
      const parsedState = editor.parseEditorState(content);
      editor.setEditorState(parsedState);
    } catch (error) {
      console.error('Failed to parse document content:', error);
      // If parsing fails, just leave the editor with default empty state
    }
  }, [content, editor]);

  return null;
}

// Editor theme
const editorTheme = {
  paragraph: 'mb-2 text-white',
  quote: 'border-l-4 border-sky-500 pl-4 italic text-white/80 my-4',
  heading: {
    h1: 'text-4xl font-bold text-white my-4',
    h2: 'text-3xl font-bold text-white my-3',
    h3: 'text-2xl font-bold text-white my-3',
    h4: 'text-xl font-bold text-white my-2',
    h5: 'text-lg font-bold text-white my-2',
    h6: 'text-base font-bold text-white my-2',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal list-inside my-2 text-white',
    ul: 'list-disc list-inside my-2 text-white',
    listitem: 'my-1',
  },
  link: 'text-sky-400 underline hover:text-sky-300 cursor-pointer',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-white/10 rounded px-1 py-0.5 font-mono text-sm text-sky-300',
  },
  code: 'bg-slate-800 rounded-lg p-4 font-mono text-sm text-white my-4 overflow-x-auto',
};

interface DocumentEditorPageProps {
  documentId: string;
  onBack: () => void;
}

const DocumentEditorPage: React.FC<DocumentEditorPageProps> = ({ documentId, onBack }) => {
  const { currentUser } = useAuth();
  
  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initial editor configuration - useMemo to prevent recreation on every render
  const initialConfig = React.useMemo(() => ({
    namespace: 'DocumentEditor',
    theme: editorTheme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
      setError(error.message);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
      AutoLinkNode,
    ],
  }), []);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  // Auto-save with debounce
  useEffect(() => {
    if (!editorState || !document) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds of inactivity)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorState, document]);

  const loadDocument = async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      const doc = await getDocument(documentId);
      setDocument(doc);
      setTitle(doc.title);
      
      // Content will be loaded separately via the editor ref after initialization
    } catch (err: any) {
      console.error('Failed to load document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!documentId || !document || !editorState || saving) return;

    try {
      setSaving(true);
      
      // Update title if changed
      if (title !== document.title) {
        await updateDocumentTitle(documentId, title);
      }

      // Serialize editor state
      const serializedContent = JSON.stringify(editorState);
      
      if (serializedContent.length <= 10000) {
        await updateDocumentContent(documentId, serializedContent);
        setLastSaved(new Date());
        setError(null);
      } else {
        setError('Document content exceeds 10,000 character limit');
      }
    } catch (err: any) {
      console.error('Failed to save document:', err);
      setError(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleEditorChange = (editorState: EditorState) => {
    setEditorState(editorState);
  };

  const handleDelete = async () => {
    if (!documentId || deleting || !currentUser?.email) return;

    try {
      setDeleting(true);
      await deleteDocument(documentId, currentUser.email);
      onBack(); // Navigate back after successful delete
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`;
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-white/60">Loading document...</div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const canEdit = document.createdBy === currentUser?.email || document.collaborators.includes(currentUser?.email || '');

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Back to Documents"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit}
              className="flex-1 bg-transparent text-xl font-semibold text-white outline-none disabled:cursor-not-allowed"
              placeholder="Untitled Document"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">
              {saving ? 'Saving...' : formatLastSaved()}
            </span>
            
            {document.createdBy === currentUser?.email && (
              <>
                <button
                  onClick={() => setIsCollaboratorsModalOpen(true)}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Share
                </button>
                
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/50"
                  title="Delete Document"
                >
                  <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving || !canEdit}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Now
            </button>
          </div>
        </div>

        {/* Collaborators bar */}
        {document.collaborators.length > 0 && (
          <div className="border-t border-white/10 px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>Shared with:</span>
              <div className="flex -space-x-2">
                {document.collaborators.slice(0, 3).map((email, idx) => (
                  <div
                    key={email}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-[10px] font-bold text-white ring-2 ring-slate-900"
                    title={email}
                  >
                    {email.charAt(0).toUpperCase()}
                  </div>
                ))}
                {document.collaborators.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] text-white ring-2 ring-slate-900">
                    +{document.collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lexical Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <LexicalComposer initialConfig={initialConfig}>
          <LexicalToolbar />
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-4xl px-6 py-8">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="min-h-[600px] outline-none text-white"
                    style={{ caretColor: '#38bdf8' }}
                  />
                }
                placeholder={
                  <div className="absolute top-8 left-6 text-white/40 pointer-events-none">
                    Start typing...
                  </div>
                }
                ErrorBoundary={() => <div>Error loading editor</div>}
              />
              <HistoryPlugin />
              <OnChangePlugin onChange={handleEditorChange} />
              <LoadDocumentPlugin content={document?.content || null} />
              <LinkPlugin />
              <ListPlugin />
            </div>
          </div>
        </LexicalComposer>
      </div>

      {error && (
        <div className="border-t border-white/10 bg-red-500/10 px-6 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <ManageCollaboratorsModal
        isOpen={isCollaboratorsModalOpen}
        onClose={() => setIsCollaboratorsModalOpen(false)}
        document={document}
        onUpdate={loadDocument}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Document</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-white/70">
              Are you sure you want to delete "<span className="font-medium text-white">{title || 'Untitled Document'}</span>"? 
              All content and collaborator access will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorPage;
