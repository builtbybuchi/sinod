import React, { useState, useEffect } from 'react';
import { listUserWhiteboards, listPendingInvites } from '../../../services/whiteboardService';
import { WhiteboardListItem, WhiteboardInvite } from '../../../types/whiteboards';
import { useAuth } from '../../../contexts/AuthContext';
import CreateWhiteboardModal from '../../../components/CreateWhiteboardModal';

interface WhiteboardPageProps {
  onOpenWhiteboard: (whiteboardId: string) => void;
}

const WhiteboardPage: React.FC<WhiteboardPageProps> = ({ onOpenWhiteboard }) => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [whiteboards, setWhiteboards] = useState<WhiteboardListItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState<WhiteboardInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      loadWhiteboards();
      loadInvites();
    }
  }, [currentUser]);

  useEffect(() => {
    const updateIsMobile = () => {
      const mobile = window.matchMedia('(max-width: 640px)').matches;
      setIsMobile(mobile);
      if (mobile) {
        setView('grid');
      }
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const loadWhiteboards = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const wbs = await listUserWhiteboards(currentUser.email);
      setWhiteboards(wbs);
    } catch (error) {
      console.error('Failed to load whiteboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    if (!currentUser?.email) return;

    try {
      const invites = await listPendingInvites(currentUser.email);
      setPendingInvites(invites);
    } catch (err) {
      // Invites collection might not exist yet - fail silently
      setPendingInvites([]);
    }
  };

  const handleWhiteboardClick = (whiteboardId: string) => {
    onOpenWhiteboard(whiteboardId);
  };

  const handleWhiteboardCreated = (whiteboardId: string) => {
    loadWhiteboards();
    onOpenWhiteboard(whiteboardId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getWhiteboardIcon = () => {
    return (
      <svg className="h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z" />
      </svg>
    );
  };

  const filteredWhiteboards = whiteboards.filter(wb =>
    wb.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <p className="text-white/60">Please log in to access whiteboards</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="border-b border-white/10 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Whiteboards</h1>
            <p className="text-sm text-white/60">
              Collaborative drawing and brainstorming spaces
              {pendingInvites.length > 0 && (
                <span className="ml-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                  {pendingInvites.length} invite{pendingInvites.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="inline-flex rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-white/5">
              <button
                onClick={() => setView('grid')}
                className={`rounded-lg px-3 py-2 transition-all ${
                  view === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                disabled={isMobile}
                className={`rounded-lg px-3 py-2 transition-all ${
                  view === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${isMobile ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isMobile ? 'List view available on larger screens' : 'List View'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
            >
              + New Whiteboard
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search whiteboards..."
              className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-white/60">Loading whiteboards...</div>
          </div>
        ) : filteredWhiteboards.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <svg className="h-16 w-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-white/60 mb-4">
              {searchTerm ? 'No whiteboards found' : 'No whiteboards yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-lg bg-purple-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
              >
                Create Your First Whiteboard
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWhiteboards.map((wb) => (
              <div
                key={wb.$id}
                onClick={() => handleWhiteboardClick(wb.$id)}
                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-3">
                  {getWhiteboardIcon()}
                  <div className="flex items-center gap-2">
                    {wb.collaborators.length > 0 && (
                      <span className="text-xs text-purple-400" title="Shared whiteboard">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    )}
                    {wb.isOwner && (
                      <span className="text-xs text-white/50" title="You own this whiteboard">
                        👑
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-medium text-white mb-2 line-clamp-2">{wb.title}</h3>
                <div className="text-xs text-white/50">
                  <p>Updated {formatDate(wb.updatedAt)}</p>
                  {wb.collaborators.length > 0 && (
                    <p className="mt-1">{wb.collaborators.length + 1} collaborators</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-white/60 border-b border-white/10">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Collaborators</div>
              <div className="col-span-3">Updated</div>
              <div className="col-span-1">Actions</div>
            </div>
            {filteredWhiteboards.map((wb) => (
              <div
                key={wb.$id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border border-white/5 bg-white/5 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={() => handleWhiteboardClick(wb.$id)}
              >
                <div className="col-span-6 flex items-center gap-3">
                  {getWhiteboardIcon()}
                  <div>
                    <p className="font-medium text-white">{wb.title}</p>
                    {wb.isOwner ? (
                      <span className="text-xs text-white/50">Owner</span>
                    ) : (
                      <span className="text-xs text-purple-400">Collaborator</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-white/60">
                  {wb.collaborators.length + 1}
                </div>
                <div className="col-span-3 text-sm text-white/60">
                  {formatDate(wb.updatedAt)}
                </div>
                <div className="col-span-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhiteboardClick(wb.$id);
                    }}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CreateWhiteboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onWhiteboardCreated={handleWhiteboardCreated}
      />
    </div>
  );
};

export default WhiteboardPage;