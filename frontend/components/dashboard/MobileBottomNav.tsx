import React, { useState, useEffect, useRef } from 'react';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onCreateEvent: () => void;
  onCreateQuiz: () => void;
  onCreateForm: () => void;
  onCreateCampaign?: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentPage, onNavigate, onCreateEvent, onCreateQuiz, onCreateForm, onCreateCampaign }) => {
  const isActive = (key: string) => currentPage === key;
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fabOpen]);

  const fabActions = [
    {
      label: 'Create Event',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/30',
      onClick: () => { setFabOpen(false); onCreateEvent(); },
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
      onClick: () => { setFabOpen(false); onCreateQuiz(); },
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
      onClick: () => { setFabOpen(false); onCreateForm(); },
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
      onClick: () => { setFabOpen(false); onCreateCampaign?.(); },
    },
  ];

  return (
    <>
      {/* Backdrop overlay when FAB is open */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setFabOpen(false)}
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-900/95 border-t border-white/10 backdrop-blur-xl safe-bottom">
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {/* Home */}
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <svg
              className={`w-6 h-6 ${isActive('home') ? 'text-sky-400' : 'text-gray-400'}`}
              fill={isActive('home') ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className={`text-[10px] font-medium ${isActive('home') ? 'text-sky-400' : 'text-gray-500'}`}>
              Home
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => onNavigate('chat')}
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <svg
              className={`w-6 h-6 ${isActive('chat') ? 'text-sky-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className={`text-[10px] font-medium ${isActive('chat') ? 'text-sky-400' : 'text-gray-500'}`}>
              Chat
            </span>
          </button>

          {/* Create (FAB) with popup */}
          <div ref={fabRef} className="relative flex flex-col items-center">
            {/* Popup options */}
            <div className={`absolute bottom-16 flex flex-col items-center gap-3 transition-all duration-300 ${fabOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              {fabActions.map((action, i) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 rounded-2xl bg-slate-800 border border-white/10 pl-3 pr-5 py-2.5 shadow-xl transition-all duration-300 ${action.shadow} ${
                    fabOpen
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-8 scale-75'
                  }`}
                  style={{ transitionDelay: fabOpen ? `${(fabActions.length - 1 - i) * 60}ms` : `${i * 30}ms` }}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-semibold text-white whitespace-nowrap">{action.label}</span>
                </button>
              ))}
            </div>

            {/* FAB button */}
            <button
              onClick={() => setFabOpen(prev => !prev)}
              className={`relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/40 transition-all duration-300 active:scale-95 ${fabOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'}`}
            >
              <svg className="w-7 h-7 text-white transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Events */}
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <svg
              className={`w-6 h-6 ${isActive('calendar') ? 'text-sky-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={`text-[10px] font-medium ${isActive('calendar') ? 'text-sky-400' : 'text-gray-500'}`}>
              Events
            </span>
          </button>

          {/* Tools (documents, whiteboard) */}
          <button
            onClick={() => onNavigate('tools')}
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <svg
              className={`w-6 h-6 ${['documents', 'whiteboard', 'tools'].includes(currentPage) ? 'text-sky-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className={`text-[10px] font-medium ${['documents', 'whiteboard', 'tools'].includes(currentPage) ? 'text-sky-400' : 'text-gray-500'}`}>
              Tools
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
