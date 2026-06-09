import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authApi from '../services/authApiService';

export interface User {
  id: string;
  $id?: string; // For backward compatibility
  email: string;
  name: string;
  avatar?: string;
  uniqueId?: string;
  qrCode?: string;
  prefs?: Record<string, any>;
}

interface AuthContextType {
  currentUser: User | null;
  userDocumentId: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { name?: string; prefs?: Record<string, any> }) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDocumentId, setUserDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (user) {
          // Add $id for backward compatibility
          const userWithLegacyId = { ...user, $id: user.id };
          setCurrentUser(userWithLegacyId);
          setUserDocumentId(user.id);
        } else {
          setCurrentUser(null);
          setUserDocumentId(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setCurrentUser(null);
        setUserDocumentId(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { user } = await authApi.login({ email, password: pass });
      // Add $id for backward compatibility
      const userWithLegacyId = { ...user, $id: user.id };
      setCurrentUser(userWithLegacyId);
      setUserDocumentId(user.id);
    } catch (error) {
      setCurrentUser(null);
      setUserDocumentId(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setCurrentUser(null);
      setUserDocumentId(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: { name?: string; prefs?: Record<string, any> }) => {
    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(data);
      // Add $id for backward compatibility
      const userWithLegacyId = { ...updatedUser, $id: updatedUser.id };
      setCurrentUser(userWithLegacyId);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userDocumentId,
    login,
    logout,
    updateUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
