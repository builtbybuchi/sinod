/**
 * Notification Context
 * Global state management for the notification system
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import {
  NotificationWithData,
  NotificationState,
  NotificationActions,
  CreateNotificationParams,
  UnsubscribeFunction,
} from '../types/notification';

// ============================================================================
// Context Definition
// ============================================================================

interface NotificationContextValue extends NotificationState, NotificationActions {}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<NotificationWithData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription cleanup
  const [unsubscribe, setUnsubscribe] = useState<UnsubscribeFunction | null>(null);

  // ============================================================================
  // Fetch Notifications
  // ============================================================================

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.$id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedNotifications = await notificationService.fetchNotifications(currentUser.$id);
      setNotifications(fetchedNotifications);
      
      // Update unread count
      const unread = fetchedNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============================================================================
  // Mark as Read
  // ============================================================================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.$id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  // ============================================================================
  // Mark All as Read
  // ============================================================================

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.$id) return;

    try {
      await notificationService.markAllAsRead(currentUser.$id);
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [currentUser]);

  // ============================================================================
  // Delete Notification
  // ============================================================================

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications((prev) => {
        const notification = prev.find((n) => n.$id === notificationId);
        const newNotifications = prev.filter((n) => n.$id !== notificationId);
        
        // Update unread count if deleted notification was unread
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        
        return newNotifications;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  // ============================================================================
  // Clear All Notifications
  // ============================================================================

  const clearAll = useCallback(async () => {
    if (!currentUser?.$id) return;

    try {
      await notificationService.clearAllNotifications(currentUser.$id);
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  }, [currentUser]);

  // ============================================================================
  // Create Notification
  // ============================================================================

  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      await notificationService.createNotification(params);
      // Real-time subscription will handle updating the list
    } catch (err) {
      console.error('Error creating notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to create notification');
    }
  }, []);

  // ============================================================================
  // Initialize and Subscribe
  // ============================================================================

  useEffect(() => {
    if (!currentUser?.$id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time updates
    const unsub = notificationService.subscribeToNotifications(
      currentUser.$id,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        const unread = updatedNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    );

    setUnsubscribe(() => unsub);

    // Cleanup
    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [currentUser, fetchNotifications]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: NotificationContextValue = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
