import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account } from 'appwrite';
import appwriteClient from '../../services/appwrite';
import QRCodeModal from '../QRCodeModal';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDeveloperModeChange?: (enabled: boolean) => void;
  developerMode?: boolean;
  userId?: string;
  userName?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onDeveloperModeChange, developerMode = false, userId = 'user123', userName = 'User' }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handleNotificationsChange = useCallback((enabled: boolean) => {
    setNotifications(enabled);
    // In a real app, update notification settings
  }, []);

  const handleDeveloperModeChange = useCallback((enabled: boolean) => {
    onDeveloperModeChange?.(enabled);
  }, [onDeveloperModeChange]);

  const handleShowQRCode = useCallback(() => {
    setIsQRCodeOpen(true);
    onClose();
  }, [onClose]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      
      // Use AuthContext logout to properly update state
      await logout();
      
      // Navigate to about page
      navigate('/about');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to navigate to about
      navigate('/about');
    } finally {
      setSigningOut(false);
    }
  }, [logout, navigate]);

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      >
        <div
          ref={panelRef}
          className={`absolute top-16 right-6 w-80 rounded-xl border border-gray-700/50 bg-gray-900/95 shadow-2xl backdrop-blur-xl transform transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded" aria-label="Close settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Notifications</h3>
              <label className="flex items-center">
                <input type="checkbox" checked={notifications} onChange={(e) => handleNotificationsChange(e.target.checked)} className="mr-3 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-300">Enable notifications</span>
              </label>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Developer</h3>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={developerMode} 
                  onChange={(e) => handleDeveloperModeChange(e.target.checked)} 
                  className="mr-3 text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm text-gray-300">Enable developer mode</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Shows developer tools and API console in the sidebar</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Account</h3>
              <button 
                onClick={handleShowQRCode}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
              >
                Show QR Code
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors">Profile Settings</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors">Privacy</button>
              <button 
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {signingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing Out...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QRCodeModal
        isOpen={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
        userId={userId}
        userName={userName}
      />
    </>
  );
};

export default SettingsPanel;