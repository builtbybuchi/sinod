/**
 * Notification Service
 * Handles all notification operations with Appwrite
 */

import { Databases, ID, Query } from 'appwrite';
import appwriteClient from './appwrite';
import {
  Notification,
  NotificationWithData,
  CreateNotificationParams,
  NotificationType,
  UnsubscribeFunction,
} from '../types/notification';

const databases = new Databases(appwriteClient);

// Appwrite configuration
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const NOTIFICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';

/**
 * Fetch all notifications for a user
 */
export const fetchNotifications = async (userId: string): Promise<NotificationWithData[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]
    );

    return response.documents.map(parseNotification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Fetch unread notifications count
 */
export const fetchUnreadCount = async (userId: string): Promise<number> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('read', false),
        Query.limit(1),
      ]
    );

    return response.total;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (
  params: CreateNotificationParams
): Promise<Notification> => {
  try {
    const notification = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : null,
        actionUrl: params.actionUrl || null,
        read: false,
        createdAt: new Date().toISOString(),
      }
    );

    return notification as unknown as Notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId,
      { read: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('read', false),
      ]
    );

    // Update each unread notification
    await Promise.all(
      response.documents.map((doc) =>
        databases.updateDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          doc.$id,
          { read: true }
        )
      )
    );
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
export const clearAllNotifications = async (userId: string): Promise<void> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    await Promise.all(
      response.documents.map((doc) =>
        databases.deleteDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          doc.$id
        )
      )
    );
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notification updates
 */
export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: NotificationWithData[]) => void
): UnsubscribeFunction => {
  const channelName = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`;

  const unsubscribe = appwriteClient.subscribe(channelName, (response) => {
    const { events, payload } = response as any;
    
    // Check if the notification is for the current user
    if (payload.userId !== userId) return;

    // Refetch all notifications when any change occurs
    fetchNotifications(userId)
      .then(onUpdate)
      .catch((error) => console.error('Error fetching notifications after update:', error));
  });

  return () => {
    unsubscribe();
  };
};

/**
 * Parse notification data from JSON string
 */
const parseNotification = (doc: any): NotificationWithData => {
  const notification = doc as Notification;
  
  return {
    ...notification,
    parsedData: notification.data ? tryParseJSON(notification.data) : undefined,
  };
};

/**
 * Safely parse JSON string
 */
const tryParseJSON = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing notification data:', error);
    return null;
  }
};

// ============================================================================
// Helper Functions for Creating Notifications
// ============================================================================

/**
 * Create a team invite notification
 */
export const notifyTeamInvite = async (
  userId: string,
  conversationId: string,
  conversationName: string,
  invitedByName: string
): Promise<void> => {
  await createNotification({
    userId,
    type: NotificationType.TEAM_INVITE,
    title: 'Team Invitation',
    message: `${invitedByName} added you to ${conversationName}`,
    data: {
      conversationId,
      conversationName,
      invitedBy: userId,
      invitedByName,
    } as any,
    actionUrl: `/dashboard?tab=chat&conversation=${conversationId}`,
  });
};

/**
 * Create a member added notification
 */
export const notifyMemberAdded = async (
  userId: string,
  conversationId: string,
  conversationName: string,
  memberName: string,
  actionByName: string
): Promise<void> => {
  await createNotification({
    userId,
    type: NotificationType.MEMBER_ADDED,
    title: 'Member Added',
    message: `${actionByName} added ${memberName} to ${conversationName}`,
    data: {
      conversationId,
      conversationName,
      memberName,
      actionByName,
    } as any,
    actionUrl: `/dashboard?tab=chat&conversation=${conversationId}`,
  });
};

/**
 * Create a member removed notification
 */
export const notifyMemberRemoved = async (
  userId: string,
  conversationId: string,
  conversationName: string,
  memberName: string,
  actionByName: string
): Promise<void> => {
  await createNotification({
    userId,
    type: NotificationType.MEMBER_REMOVED,
    title: 'Member Removed',
    message: `${actionByName} removed ${memberName} from ${conversationName}`,
    data: {
      conversationId,
      conversationName,
      memberName,
      actionByName,
    } as any,
    actionUrl: `/dashboard?tab=chat&conversation=${conversationId}`,
  });
};

export default {
  fetchNotifications,
  fetchUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribeToNotifications,
  notifyTeamInvite,
  notifyMemberAdded,
  notifyMemberRemoved,
};
