import React, { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: (key: string) => void;
  currentPage?: string;
  onOpenSettings: () => void;
  developerMode?: boolean;
  onCreateEvent?: () => void;
  onCreateQuiz?: () => void;
  onCreateForm?: () => void;
  onCreateCampaign?: () => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: (cls: string) => React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD',
    items: [
      {
        key: 'home',
        label: 'Overview',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        key: 'calendar',
        label: 'Events',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        key: 'chat',
        label: 'Chat',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      {
        key: 'documents',
        label: 'Documents',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        key: 'whiteboard',
        label: 'Whiteboard',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ),
      },

      {
        key: 'forms',
        label: 'Forms',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
      {
        key: 'quizzes',
        label: 'Quizzes',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'NEWSLETTER',
    items: [
      {
        key: 'newsletter',
        label: 'Campaigns',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        key: 'mailing-lists',
        label: 'Mailing Lists',
        icon: (cls: string) => (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
];

const DEVELOPER_ITEM: NavItem = {
  key: 'developer',
  label: 'Developer',
  icon: (cls: string) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onNavigate, currentPage = 'home', onOpenSettings, developerMode = false, onCreateEvent, onCreateQuiz, onCreateForm, onCreateCampaign }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!createOpen) return;
    const handler = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [createOpen]);

  const createActions = [
    {
      label: 'Create Event',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/30',
      onClick: () => { setCreateOpen(false); onCreateEvent?.(); },
    },
    {
      label: 'Create Quiz',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30',
      onClick: () => { setCreateOpen(false); onCreateQuiz?.(); },
    },
    {
      label: 'Create Form',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      onClick: () => { setCreateOpen(false); onCreateForm?.(); },
    },
    {
      label: 'Create Campaign',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      onClick: () => { setCreateOpen(false); onCreateCampaign?.(); },
    },
  ];
  const renderNavButton = (item: NavItem) => {
    const isActive = item.key === currentPage;
    return (
      <button
        key={item.key + item.label}
        onClick={() => onNavigate?.(item.key)}
        className={`group relative flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-sky-500/15 text-sky-300'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className={`flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-gray-500 group-hover:text-white'}`}>
          {item.icon('w-5 h-5')}
        </div>
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  return (
    <aside className={`h-full bg-slate-900/95 border-r border-white/10 flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-sm ${collapsed ? 'w-16' : 'w-16 md:w-56'}`}>
      <nav className={`flex-1 px-2 py-4 space-y-5 ${collapsed ? 'overflow-hidden' : 'overflow-y-auto'}`} aria-label="Sidebar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(renderNavButton)}
            </div>
          </div>
        ))}
        {developerMode && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                DEV
              </p>
            )}
            {renderNavButton(DEVELOPER_ITEM)}
          </div>
        )}
      </nav>
      {/* Create button with animated popup */}
      <div className="p-3 border-t border-white/10" ref={createRef}>
        <div className="relative">
          {/* Backdrop overlay when popup is open */}
          {createOpen && (
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={() => setCreateOpen(false)} />
          )}

          {/* Popup options */}
          <div className={`absolute bottom-full left-0 right-0 mb-2 flex flex-col items-stretch gap-2 z-50 transition-all duration-300 ${createOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {createActions.map((action, i) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex items-center gap-3 rounded-xl bg-slate-800/95 border border-white/10 px-3 py-2.5 shadow-xl backdrop-blur-sm transition-all duration-300 ${action.shadow} hover:bg-slate-700/95 ${
                  createOpen
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-90'
                }`}
                style={{ transitionDelay: createOpen ? `${(createActions.length - 1 - i) * 60}ms` : `${i * 30}ms` }}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white shadow-lg`}>
                  {action.icon}
                </div>
                {!collapsed && (
                  <span className="text-sm font-semibold text-white whitespace-nowrap">{action.label}</span>
                )}
              </button>
            ))}
          </div>

          {/* Create button */}
          <button
            onClick={() => setCreateOpen(prev => !prev)}
            className={`relative z-50 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:shadow-sky-500/40 hover:from-sky-400 hover:to-blue-500 active:scale-[0.97] ${collapsed ? 'px-0' : 'px-4'}`}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${createOpen ? 'rotate-45' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {!collapsed && <span>{createOpen ? 'Close' : 'Create'}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
