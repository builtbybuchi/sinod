import React, { useCallback, useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import MobileBottomNav from '../../components/dashboard/MobileBottomNav';
import SettingsPanel from '../../components/dashboard/SettingsPanel';
import ProfileSettingsModal from '../../components/dashboard/ProfileSettingsModal';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import SearchOverlay from '../../components/dashboard/SearchOverlay';
import Logo from '../../components/Logo';
import EventCreatorPage from './sidebar/EventCreatorPage';
import ChatPage from './sidebar/ChatPage';
import EventsPage from './sidebar/EventsPage';
import DocumentsPage from './sidebar/DocumentsPage';
import WhiteboardPage from './sidebar/WhiteboardPage';
import DeveloperPage from './sidebar/DeveloperPage';
import DashboardHomePage from './sidebar/DashboardHomePage';
import ToolsPage from './sidebar/ToolsPage';
import FormsPage from './sidebar/FormsPage';
import QuizzesPage from './sidebar/QuizzesPage';
import FormBuilderPage from './sidebar/FormBuilderPage';
import QuizBuilderPage from './sidebar/QuizBuilderPage';
import NewsletterPage from './sidebar/NewsletterPage';
import MailingListsPage from './sidebar/MailingListsPage';
import CampaignEditorPage from './sidebar/CampaignEditorPage';
import CampaignAnalyticsPage from './sidebar/CampaignAnalyticsPage';
import DocumentEditorPage from '../documents/DocumentEditorPage';
import WhiteboardEditorPage from '../whiteboards/WhiteboardEditorPage';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface DashboardProps {
  onNavigateHome: () => void;
}




const Dashboard: React.FC<DashboardProps> = ({ onNavigateHome }) => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('dashboard:currentPage');
      return saved || 'home';
    }
    return 'home';
  });
  const [developerMode, setDeveloperMode] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('dashboard:activeDocumentId');
    }
    return null;
  });
  const [activeWhiteboardId, setActiveWhiteboardId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('dashboard:activeWhiteboardId');
    }
    return null;
  });
  const [activeFormId, setActiveFormId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('dashboard:activeFormId');
    }
    return null;
  });
  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('dashboard:activeQuizId');
    }
    return null;
  });
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('dashboard:activeCampaignId');
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard:currentPage', currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeDocumentId) {
        window.localStorage.setItem('dashboard:activeDocumentId', activeDocumentId);
      } else {
        window.localStorage.removeItem('dashboard:activeDocumentId');
      }
      if (activeWhiteboardId) {
        window.localStorage.setItem('dashboard:activeWhiteboardId', activeWhiteboardId);
      } else {
        window.localStorage.removeItem('dashboard:activeWhiteboardId');
      }
      if (activeFormId) {
        window.localStorage.setItem('dashboard:activeFormId', activeFormId);
      } else {
        window.localStorage.removeItem('dashboard:activeFormId');
      }
      if (activeQuizId) {
        window.localStorage.setItem('dashboard:activeQuizId', activeQuizId);
      } else {
        window.localStorage.removeItem('dashboard:activeQuizId');
      }
      if (activeCampaignId) {
        window.localStorage.setItem('dashboard:activeCampaignId', activeCampaignId);
      } else {
        window.localStorage.removeItem('dashboard:activeCampaignId');
      }
    }
  }, [activeDocumentId, activeWhiteboardId, activeFormId, activeQuizId, activeCampaignId]);

  // Listen for cross-component navigation events (e.g., event follow-up → campaign editor)
  useEffect(() => {
    const handleDashboardNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page) {
        if (detail.page === 'campaign-editor') {
          setActiveCampaignId(null); // new campaign
        }
        setCurrentPage(detail.page);
      }
    };
    window.addEventListener('dashboard:navigate', handleDashboardNavigate);
    return () => window.removeEventListener('dashboard:navigate', handleDashboardNavigate);
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
  }, []);

    const handleDeveloperModeChange = useCallback((enabled: boolean) => {
        setDeveloperMode(enabled);
        // If developer mode is disabled and we're on the developer page, navigate to home
        if (!enabled && currentPage === 'developer') {
            setCurrentPage('home');
        }
    }, [currentPage]);

    const handleEventCreated = useCallback(() => {
        // Refresh events list or navigate to events page
        setCurrentPage('calendar');
    }, []);

  const handleCreateEvent = useCallback(() => {
    setCurrentPage('event-creator');
  }, []);

  const handleOpenDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId);
    setCurrentPage('document-editor');
  }, []);

  const handleOpenWhiteboard = useCallback((whiteboardId: string) => {
    setActiveWhiteboardId(whiteboardId);
    setCurrentPage('whiteboard-editor');
  }, []);

  const handleBackToDocuments = useCallback(() => {
    setActiveDocumentId(null);
    setCurrentPage('documents');
  }, []);

  const handleBackToWhiteboards = useCallback(() => {
    setActiveWhiteboardId(null);
    setCurrentPage('whiteboard');
  }, []);

  const handleCreateForm = useCallback(() => {
    setActiveFormId(null);
    setCurrentPage('form-builder');
  }, []);

  const handleEditForm = useCallback((formId: string) => {
    setActiveFormId(formId);
    setCurrentPage('form-builder');
  }, []);

  const handleBackToForms = useCallback(() => {
    setActiveFormId(null);
    setCurrentPage('forms');
  }, []);

  const handleCreateQuiz = useCallback(() => {
    setActiveQuizId(null);
    setCurrentPage('quiz-builder');
  }, []);

  const handleEditQuiz = useCallback((quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentPage('quiz-builder');
  }, []);

  const handleBackToQuizzes = useCallback(() => {
    setActiveQuizId(null);
    setCurrentPage('quizzes');
  }, []);

  const handleCreateCampaign = useCallback(() => {
    setActiveCampaignId(null);
    setCurrentPage('campaign-editor');
  }, []);

  const handleEditCampaign = useCallback((campaignId: string) => {
    setActiveCampaignId(campaignId);
    setCurrentPage('campaign-editor');
  }, []);

  const handleViewCampaignAnalytics = useCallback((campaignId: string) => {
    setActiveCampaignId(campaignId);
    setCurrentPage('campaign-analytics');
  }, []);

  const handleBackToNewsletter = useCallback(() => {
    setActiveCampaignId(null);
    setCurrentPage('newsletter');
  }, []);

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'chat':
                return <ChatPage />;
            case 'calendar':
                return <EventsPage />;
            case 'documents':
                return <DocumentsPage onOpenDocument={handleOpenDocument} />;
            case 'whiteboard':
                return <WhiteboardPage onOpenWhiteboard={handleOpenWhiteboard} />;
            case 'developer':
                return <DeveloperPage />;
            case 'document-editor':
                return activeDocumentId ? (
                    <DocumentEditorPage 
                        documentId={activeDocumentId}
                        onBack={handleBackToDocuments}
                    />
                ) : null;
            case 'whiteboard-editor':
                return activeWhiteboardId ? (
                    <WhiteboardEditorPage 
                        whiteboardId={activeWhiteboardId}
                        onBack={handleBackToWhiteboards}
                    />
                ) : null;
            case 'home':
            default:
                return (
                    <DashboardHomePage
                        onNavigate={handleNavigate}
                        onCreateEvent={handleCreateEvent}
                        onCreateQuiz={handleCreateQuiz}
                        onCreateForm={handleCreateForm}
                    />
                );
            case 'tools':
                return <ToolsPage onNavigate={handleNavigate} />;
            case 'forms':
                return <FormsPage onCreateForm={handleCreateForm} onEditForm={handleEditForm} />;
            case 'quizzes':
                return <QuizzesPage onCreateQuiz={handleCreateQuiz} onEditQuiz={handleEditQuiz} />;
            case 'form-builder':
                return (
                    <FormBuilderPage
                        formId={activeFormId}
                        onBack={handleBackToForms}
                    />
                );
            case 'quiz-builder':
                return (
                    <QuizBuilderPage
                        quizId={activeQuizId}
                        onBack={handleBackToQuizzes}
                    />
                );
            case 'newsletter':
                return (
                    <NewsletterPage 
                        onCreateCampaign={handleCreateCampaign}
                        onEditCampaign={handleEditCampaign}
                        onViewAnalytics={handleViewCampaignAnalytics}
                        onManageLists={() => setCurrentPage('mailing-lists')}
                    />
                );
            case 'mailing-lists':
                return <MailingListsPage onBack={handleBackToNewsletter} />;
            case 'campaign-editor':
                return (
                    <CampaignEditorPage
                        campaignId={activeCampaignId}
                        onBack={handleBackToNewsletter}
                        onSent={() => setCurrentPage('newsletter')}
                    />
                );
            case 'campaign-analytics':
                return activeCampaignId ? (
                    <CampaignAnalyticsPage
                        campaignId={activeCampaignId}
                        onBack={handleBackToNewsletter}
                    />
                ) : null;
            case 'event-creator':
                return (
                    <EventCreatorPage
                        onBack={() => setCurrentPage('calendar')}
                        onCreated={handleEventCreated}
                    />
                );
        }
    };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 py-3 backdrop-blur-sm">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="group hidden md:flex h-full w-16 items-center justify-center border-r border-white/10 text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Toggle sidebar"
          >
            <div className="relative flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/5 p-3 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-sky-500/20 group-hover:to-blue-500/20 group-hover:shadow-lg group-hover:shadow-sky-500/20">
              <span className={`h-0.5 w-5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300 ${sidebarCollapsed ? 'group-hover:w-6' : 'group-hover:w-4'}`} />
              <span className={`h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300 ${sidebarCollapsed ? 'w-5 group-hover:w-6' : 'w-4 group-hover:w-3'}`} />
              <span className={`h-0.5 w-5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300 ${sidebarCollapsed ? 'group-hover:w-6' : 'group-hover:w-4'}`} />
            </div>
          </button>
          <button 
            onClick={onNavigateHome}
            className="flex items-center px-4 md:px-6 cursor-pointer group hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <img 
              src="/sinod-logo.png" 
              alt="Sinod' Logo" 
              className="h-10 w-auto"
            />
            <div className="relative hidden sm:block ml-0">
              <span className="text-2xl font-extrabold tracking-tighter text-white">Sinod'</span>
            </div>
          </button>
        </div>

        {/* Center: Search bar — desktop only */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className={`relative w-full transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Delay blur so clicks on results register
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              placeholder="Search events, documents, or pages..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-sky-500/50 focus:bg-white/10 focus:ring-1 focus:ring-sky-500/30"
            />
            <SearchOverlay
              query={searchQuery}
              isVisible={isSearchFocused}
              onClose={() => {
                setIsSearchFocused(false);
                setSearchQuery('');
                searchRef.current?.blur();
              }}
              onNavigate={(page) => {
                if (page === '__settings__') {
                  setIsSettingsOpen(true);
                } else if (page === '__notifications__') {
                  setIsNotificationsOpen(true);
                } else {
                  handleNavigate(page);
                }
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              onOpenDocument={(docId) => {
                handleOpenDocument(docId);
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              onOpenWhiteboard={(wbId) => {
                handleOpenWhiteboard(wbId);
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* User Avatar + Name */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="relative flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
            aria-label="User profile and settings"
          >
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg overflow-hidden">
              {currentUser?.prefs?.['profile-pic-url'] ? (
                <img
                  src={currentUser.prefs['profile-pic-url']}
                  alt={currentUser?.name || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-white leading-tight">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500">Admin Account</p>
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex h-full">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onNavigate={handleNavigate}
            currentPage={currentPage}
            onOpenSettings={() => setIsSettingsOpen(true)}
            developerMode={developerMode}
            onCreateEvent={handleCreateEvent}
            onCreateQuiz={handleCreateQuiz}
            onCreateForm={handleCreateForm}
            onCreateCampaign={handleCreateCampaign}
          />
        </div>

        <main className="relative flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
          {renderCurrentPage()}
        </main>
      </div>

      <footer className="relative hidden md:block border-t border-white/10 bg-black/30 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">
        Powered by Lexrunit
      </footer>

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onCreateEvent={handleCreateEvent}
        onCreateQuiz={handleCreateQuiz}
        onCreateForm={handleCreateForm}
        onCreateCampaign={handleCreateCampaign}
      />

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onDeveloperModeChange={handleDeveloperModeChange}
        developerMode={developerMode}
        userId={currentUser?.$id || 'user123'}
        userName={currentUser?.name || 'User'}
      />

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};export default Dashboard;
