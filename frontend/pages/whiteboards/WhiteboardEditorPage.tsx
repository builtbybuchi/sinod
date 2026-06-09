import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { useAuth } from '../../contexts/AuthContext';
import {
  getWhiteboard,
  updateWhiteboardContent,
  updateWhiteboardTitle,
  deleteWhiteboard,
  updatePresence,
  markInactive,
  getWhiteboardPresence,
} from '../../services/whiteboardService';
import { WhiteboardModel, WhiteboardPresence } from '../../types/whiteboards';
import ManageWhiteboardCollaboratorsModal from '../../components/ManageWhiteboardCollaboratorsModal';

interface WhiteboardEditorPageProps {
  whiteboardId: string;
  onBack: () => void;
}

const WhiteboardEditorPage: React.FC<WhiteboardEditorPageProps> = ({ whiteboardId, onBack }) => {
  const { currentUser } = useAuth();
  
  const [whiteboard, setWhiteboard] = useState<WhiteboardModel | null>(null);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isManageCollaboratorsOpen, setIsManageCollaboratorsOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<WhiteboardPresence[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const excalidrawAPI = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load whiteboard data
  useEffect(() => {
    if (!whiteboardId || !currentUser) return;

    const loadWhiteboard = async () => {
      try {
        setLoading(true);
        const data = await getWhiteboard(whiteboardId);
        setWhiteboard(data);
        setTitle(data.title);
        setError(null);
      } catch (err) {
        console.error('Error loading whiteboard:', err);
        setError('Failed to load whiteboard. You may not have access.');
      } finally {
        setLoading(false);
      }
    };

    loadWhiteboard();
  }, [whiteboardId, currentUser]);

  // Update presence
  useEffect(() => {
    if (!whiteboardId || !currentUser?.email) return;

    // Initial presence update (optional - fails silently if collection doesn't exist)
    updatePresence(whiteboardId, currentUser.email).catch(() => {
      // Presence is optional, ignore errors
    });

    // Update presence every 30 seconds
    presenceIntervalRef.current = setInterval(() => {
      updatePresence(whiteboardId, currentUser.email).catch(() => {
        // Presence is optional, ignore errors
      });
      loadActiveUsers();
    }, 30000);

    // Load active users initially
    loadActiveUsers();

    // Cleanup on unmount
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      if (whiteboardId && currentUser?.email) {
        markInactive(whiteboardId, currentUser.email).catch(() => {
          // Presence is optional, ignore errors
        });
      }
    };
  }, [whiteboardId, currentUser]);

  const loadActiveUsers = async () => {
    if (!whiteboardId) return;
    try {
      const users = await getWhiteboardPresence(whiteboardId);
      setActiveUsers(users.filter(u => u.userEmail !== currentUser?.email));
    } catch (err) {
      // Presence is optional, silently fail if collection doesn't exist
      setActiveUsers([]);
    }
  };

  // Auto-save functionality
  const handleChange = useCallback((elements: any, appState: any) => {
    if (!whiteboardId || !whiteboard) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        const content = JSON.stringify({
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
            currentItemFontFamily: appState.currentItemFontFamily,
            currentItemFontSize: appState.currentItemFontSize,
            currentItemTextAlign: appState.currentItemTextAlign,
            currentItemStrokeStyle: appState.currentItemStrokeStyle,
            currentItemRoundness: appState.currentItemRoundness,
          },
        });

        await updateWhiteboardContent(whiteboardId, content);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Error saving whiteboard:', err);
      } finally {
        setSaving(false);
      }
    }, 3000);
  }, [whiteboardId, whiteboard]);

  // Handle title update
  const handleTitleSave = async () => {
    if (!whiteboardId || !title.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateWhiteboardTitle(whiteboardId, title.trim());
      setWhiteboard(prev => prev ? { ...prev, title: title.trim() } : null);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(whiteboard?.title || '');
      setIsEditingTitle(false);
    }
  };

  const handleDelete = async () => {
    if (!whiteboardId || deleting || !currentUser?.email) return;

    try {
      setDeleting(true);
      await deleteWhiteboard(whiteboardId, currentUser.email);
      onBack(); // Navigate back after successful delete
    } catch (err: any) {
      console.error('Failed to delete whiteboard:', err);
      setError(err.message || 'Failed to delete whiteboard');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 10) return 'Saved just now';
    if (diffSecs < 60) return `Saved ${diffSecs}s ago`;
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  const isOwner = whiteboard?.createdBy === currentUser?.email;
  const canEdit = isOwner || whiteboard?.collaborators.includes(currentUser?.email || '');

  // Parse initial content
  const initialData = whiteboard?.content 
    ? (() => {
        try {
          const parsed = JSON.parse(whiteboard.content);
          return {
            elements: parsed.elements || [],
            appState: parsed.appState || {},
          };
        } catch {
          return { elements: [], appState: {} };
        }
      })()
    : { elements: [], appState: {} };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="text-white">Loading whiteboard...</div>
      </div>
    );
  }

  if (error || !whiteboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-950">
        <div className="text-red-400 mb-4">{error || 'Whiteboard not found'}</div>
        <button
          onClick={onBack}
          className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        >
          Back to Whiteboards
        </button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-950">
        <div className="text-red-400 mb-4">You don't have permission to edit this whiteboard</div>
        <button
          onClick={onBack}
          className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        >
          Back to Whiteboards
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onBack}
              className="text-white/70 hover:text-white transition-colors"
              title="Back to Whiteboards"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="rounded border border-purple-500 bg-white/10 px-3 py-1 text-lg font-semibold text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => isOwner && setIsEditingTitle(true)}
                className={`text-lg font-semibold text-white ${isOwner ? 'cursor-pointer hover:text-purple-300' : ''}`}
                title={isOwner ? 'Click to edit' : ''}
              >
                {title}
              </h1>
            )}

            {!isOwner && (
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                Collaborator
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Active Users */}
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {activeUsers.slice(0, 3).map((user, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: user.color }}
                      title={user.userEmail}
                    >
                      {user.userEmail[0].toUpperCase()}
                    </div>
                  ))}
                </div>
                {activeUsers.length > 3 && (
                  <span className="text-xs text-white/60">+{activeUsers.length - 3}</span>
                )}
              </div>
            )}

            {/* Save Status */}
            <div className="text-sm text-white/60">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  {formatLastSaved()}
                </span>
              ) : null}
            </div>

            {/* Share and Delete Buttons (Owner only) */}
            {isOwner && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsManageCollaboratorsOpen(true)}
                  className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
                >
                  <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/50"
                  title="Delete Whiteboard"
                >
                  <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 w-full" style={{ height: 'calc(100vh - 64px)' }}>
        <Excalidraw
          excalidrawAPI={(api) => (excalidrawAPI.current = api)}
          initialData={initialData}
          onChange={handleChange}
          viewModeEnabled={!canEdit}
          theme="dark"
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
        </Excalidraw>
      </div>

      {/* Manage Collaborators Modal */}
      <ManageWhiteboardCollaboratorsModal
        isOpen={isManageCollaboratorsOpen}
        onClose={() => setIsManageCollaboratorsOpen(false)}
        whiteboard={whiteboard}
        onUpdate={() => {
          if (whiteboardId) {
            getWhiteboard(whiteboardId).then(setWhiteboard).catch(console.error);
          }
        }}
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
                <h3 className="text-lg font-semibold text-white">Delete Whiteboard</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>

            <p className="mb-6 text-sm text-white/70">
              Are you sure you want to delete "<span className="font-medium text-white">{title || 'Untitled Whiteboard'}</span>"? 
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
                {deleting ? 'Deleting...' : 'Delete Whiteboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardEditorPage;
