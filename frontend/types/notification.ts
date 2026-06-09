/**
 * Notification System Type Definitions
 */

// ============================================================================
// Enums
// ============================================================================

export enum NotificationType {
  TEAM_INVITE = 'team_invite',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  MESSAGE_MENTION = 'message_mention',
  EVENT_INVITE = 'event_invite',
  EVENT_UPDATE = 'event_update',
  DOCUMENT_SHARED = 'document_shared',
  WHITEBOARD_SHARED = 'whiteboard_shared',
  SYSTEM = 'system',
}

// ============================================================================
// Core Models
// ============================================================================

/**
 * Notification document from Appwrite
 */
export interface Notification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string; // Recipient user ID
  type: NotificationType;
  title: string;
  message: string;
  data?: string; // JSON string with additional data
  actionUrl?: string; // URL to navigate to
  read: boolean;
  createdAt: string;
}

/**
 * Notification with parsed data
 */
export interface NotificationWithData extends Notification {
  parsedData?: NotificationData;
}

/**
 * Notification data structures for different types
 */
export type NotificationData =
  | TeamInviteData
  | MemberChangeData
  | MessageMentionData
  | EventInviteData
  | EventUpdateData
  | DocumentSharedData
  | WhiteboardSharedData;

export interface TeamInviteData {
  conversationId: string;
  conversationName: string;
  invitedBy: string;
  invitedByName: string;
}

export interface MemberChangeData {
  conversationId: string;
  conversationName: string;
  memberEmail: string;
  memberName: string;
  actionBy: string;
  actionByName: string;
}

export interface MessageMentionData {
  conversationId: string;
  conversationName: string;
  messageId: string;
  mentionedBy: string;
  mentionedByName: string;
  messagePreview: string;
}

export interface EventInviteData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  invitedBy: string;
  invitedByName: string;
}

export interface EventUpdateData {
  eventId: string;
  eventTitle: string;
  changeType: 'date' | 'time' | 'location' | 'details';
  updatedBy: string;
  updatedByName: string;
}

export interface DocumentSharedData {
  documentId: string;
  documentTitle: string;
  sharedBy: string;
  sharedByName: string;
}

export interface WhiteboardSharedData {
  whiteboardId: string;
  whiteboardTitle: string;
  sharedBy: string;
  sharedByName: string;
}

// ============================================================================
// Creation Params
// ============================================================================

/**
 * Parameters for creating a new notification
 */
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  actionUrl?: string;
}

// ============================================================================
// Context State & Actions
// ============================================================================

export interface NotificationState {
  notifications: NotificationWithData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  createNotification: (params: CreateNotificationParams) => Promise<void>;
}

export type UnsubscribeFunction = () => void;
