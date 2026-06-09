import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as eventsApi from '../../services/eventsApiService';
import { listUserDocuments } from '../../services/documentService';
import { listUserWhiteboards } from '../../services/whiteboardService';

interface SearchOverlayProps {
  query: string;
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onOpenDocument?: (documentId: string) => void;
  onOpenWhiteboard?: (whiteboardId: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'event' | 'document' | 'whiteboard' | 'page';
  icon: React.ReactNode;
  action: () => void;
}

// Static pages / settings that can be searched
const APP_PAGES = [
  { id: 'home', title: 'Dashboard Overview', keywords: ['dashboard', 'home', 'overview', 'main'], page: 'home' },
  { id: 'calendar', title: 'Events', keywords: ['events', 'calendar', 'schedule', 'event', 'create event'], page: 'calendar' },
  { id: 'chat', title: 'Chat', keywords: ['chat', 'messages', 'messaging', 'team chat', 'communication'], page: 'chat' },
  { id: 'documents', title: 'Documents', keywords: ['documents', 'docs', 'files', 'forms', 'create form'], page: 'documents' },
  { id: 'whiteboard', title: 'Whiteboard', keywords: ['whiteboard', 'canvas', 'draw', 'drawing', 'collaborate'], page: 'whiteboard' },
  { id: 'settings', title: 'Settings', keywords: ['settings', 'preferences', 'account', 'profile', 'configuration', 'config'], page: 'settings' },
  { id: 'notifications', title: 'Notifications', keywords: ['notifications', 'alerts', 'bell', 'notify'], page: 'notifications' },
  { id: 'email-credits', title: 'Email Credits', keywords: ['email', 'credits', 'email credits', 'balance', 'quota'], page: 'home' },
  { id: 'tools', title: 'Tools', keywords: ['tools', 'utilities', 'analytics', 'reports', 'certificates'], page: 'tools' },
];

const CATEGORY_ICONS = {
  event: (
    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  document: (
    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  whiteboard: (
    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  page: (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
};

const CATEGORY_LABELS: Record<string, string> = {
  page: 'Pages & Settings',
  event: 'Events',
  document: 'Documents',
  whiteboard: 'Whiteboards',
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  query,
  isVisible,
  onClose,
  onNavigate,
  onOpenDocument,
  onOpenWhiteboard,
}) => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<{
    events: any[] | null;
    documents: any[] | null;
    whiteboards: any[] | null;
    loaded: boolean;
  }>({ events: null, documents: null, whiteboards: null, loaded: false });

  // Preload data on first open
  const loadData = useCallback(async () => {
    if (cacheRef.current.loaded || !currentUser?.email) return;
    setIsLoading(true);
    try {
      const [eventsResp, docs, wbs] = await Promise.allSettled([
        eventsApi.listUserEvents(currentUser.email, 100, 0),
        listUserDocuments(currentUser.email),
        listUserWhiteboards(currentUser.email),
      ]);

      cacheRef.current.events =
        eventsResp.status === 'fulfilled' ? eventsResp.value.documents : [];
      cacheRef.current.documents =
        docs.status === 'fulfilled' ? docs.value : [];
      cacheRef.current.whiteboards =
        wbs.status === 'fulfilled' ? wbs.value : [];
      cacheRef.current.loaded = true;
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  // Load data when overlay first becomes visible
  useEffect(() => {
    if (isVisible && !cacheRef.current.loaded) {
      loadData();
    }
  }, [isVisible, loadData]);

  // Perform search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase().trim();
    const matched: SearchResult[] = [];

    // 1. Search pages / settings (instant, no API call)
    for (const page of APP_PAGES) {
      const titleMatch = page.title.toLowerCase().includes(q);
      const keywordMatch = page.keywords.some((kw) => kw.includes(q));
      if (titleMatch || keywordMatch) {
        matched.push({
          id: `page-${page.id}`,
          title: page.title,
          subtitle: 'Navigate to page',
          category: 'page',
          icon: CATEGORY_ICONS.page,
          action: () => {
            if (page.id === 'settings') {
              // Settings is handled differently — we navigate to settings panel
              onNavigate('__settings__');
            } else if (page.id === 'notifications') {
              onNavigate('__notifications__');
            } else {
              onNavigate(page.page);
            }
            onClose();
          },
        });
      }
    }

    // 2. Search events
    if (cacheRef.current.events) {
      for (const evt of cacheRef.current.events) {
        const name = (evt.event_name || '').toLowerCase();
        const desc = (evt.event_description || '').toLowerCase();
        if (name.includes(q) || desc.includes(q)) {
          matched.push({
            id: `event-${evt.$id}`,
            title: evt.event_name,
            subtitle: evt.event_time
              ? new Date(evt.event_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Event',
            category: 'event',
            icon: CATEGORY_ICONS.event,
            action: () => {
              onNavigate('calendar');
              onClose();
            },
          });
        }
      }
    }

    // 3. Search documents
    if (cacheRef.current.documents) {
      for (const doc of cacheRef.current.documents) {
        const title = (doc.title || '').toLowerCase();
        if (title.includes(q)) {
          matched.push({
            id: `doc-${doc.$id}`,
            title: doc.title || 'Untitled Document',
            subtitle: doc.updatedAt
              ? `Updated ${new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'Document',
            category: 'document',
            icon: CATEGORY_ICONS.document,
            action: () => {
              onOpenDocument?.(doc.$id);
              onClose();
            },
          });
        }
      }
    }

    // 4. Search whiteboards
    if (cacheRef.current.whiteboards) {
      for (const wb of cacheRef.current.whiteboards) {
        const title = (wb.title || '').toLowerCase();
        if (title.includes(q)) {
          matched.push({
            id: `wb-${wb.$id}`,
            title: wb.title || 'Untitled Whiteboard',
            subtitle: wb.updatedAt
              ? `Updated ${new Date(wb.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'Whiteboard',
            category: 'whiteboard',
            icon: CATEGORY_ICONS.whiteboard,
            action: () => {
              onOpenWhiteboard?.(wb.$id);
              onClose();
            },
          });
        }
      }
    }

    setResults(matched);
    setSelectedIndex(0);
  }, [query, onNavigate, onClose, onOpenDocument, onOpenWhiteboard]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Group results by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    const order = ['page', 'event', 'document', 'whiteboard'];
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return order.filter((cat) => groups[cat]).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      items: groups[cat],
    }));
  }, [results]);

  // Calculate flat index for keyboard navigation
  const getFlatIndex = (groupIdx: number, itemIdx: number) => {
    let idx = 0;
    for (let g = 0; g < groupIdx; g++) {
      idx += grouped[g].items.length;
    }
    return idx + itemIdx;
  };

  if (!isVisible || !query.trim()) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/98 shadow-2xl shadow-black/50 backdrop-blur-xl"
      ref={resultsRef}
    >
      {isLoading && results.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <span className="text-sm text-gray-400">Searching…</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-8 text-center">
          <svg className="mx-auto mb-2 w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-gray-500">No results for "{query}"</p>
          <p className="mt-1 text-xs text-gray-600">Try a different search term</p>
        </div>
      ) : (
        <div className="py-2">
          {grouped.map((group, gi) => (
            <div key={group.category}>
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                  {group.label}
                </p>
              </div>
              {group.items.map((result, ii) => {
                const flatIdx = getFlatIndex(gi, ii);
                const isSelected = flatIdx === selectedIndex;
                return (
                  <button
                    key={result.id}
                    data-index={flatIdx}
                    onClick={result.action}
                    onMouseEnter={() => setSelectedIndex(flatIdx)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-500/15 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-sky-500/20' : 'bg-white/5'
                    }`}>
                      {result.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="hidden md:inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 mt-1">
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">esc</kbd> close
              </span>
            </div>
            <span className="text-[10px] text-gray-600">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
