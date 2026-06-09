/**
 * Notification API Service
 * Handles notifications (in-app, email, push)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export enum NotificationType {
  INVITE = 'invite',
  MENTION = 'mention',
  COMMENT = 'comment',
  EVENT_REMINDER = 'event_reminder',
  PAYMENT = 'payment',
  WITHDRAWAL = 'withdrawal',
  CHAT = 'chat',
  DOCUMENT = 'document',
  WHITEBOARD = 'whiteboard',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

export interface CreateNotification {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  action_url?: string;
  metadata?: Record<string, any>;
  expires_at?: string; // ISO date string
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  action_url?: string;
  metadata: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationPreferences {
  user_id: string;
  enable_email: boolean;
  enable_push: boolean;
  enable_in_app: boolean;
  notification_types: Record<string, boolean>;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
}

class NotificationApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.detail || 'Request failed');
    }

    return response.json();
  }

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotification): Promise<{ success: boolean; notification: Notification | null; message: string }> {
    return this.request('/api/notifications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      unread_only: String(unreadOnly),
      limit: String(limit),
      offset: String(offset),
    });
    
    return this.request(`/api/notifications/?${params}`);
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.request<{ success: boolean; count: number }>(
      '/api/notifications/unread-count'
    );
    return response.count;
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<{ success: boolean; count: number; message: string }> {
    return this.request('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notification_ids: notificationIds }),
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number; message: string }> {
    return this.request('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/notifications/${notificationId}/archive`, {
      method: 'POST',
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return this.request('/api/notifications/preferences');
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return this.request('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Helper: Send invite notification
   */
  async sendInviteNotification(
    userId: string,
    resourceType: 'document' | 'whiteboard' | 'event',
    resourceTitle: string,
    resourceId: string,
    inviterName: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: NotificationType.INVITE,
      title: `Invitation to ${resourceType}`,
      message: `${inviterName} invited you to collaborate on "${resourceTitle}"`,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      action_url: `/${resourceType}s/${resourceId}`,
      metadata: {
        resource_type: resourceType,
        resource_id: resourceId,
        inviter_name: inviterName,
      },
    });
  }

  /**
   * Helper: Send mention notification
   */
  async sendMentionNotification(
    userId: string,
    mentionerName: string,
    resourceType: 'document' | 'whiteboard' | 'chat',
    resourceId: string,
    message: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: NotificationType.MENTION,
      title: `${mentionerName} mentioned you`,
      message: message,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      action_url: `/${resourceType}s/${resourceId}`,
      metadata: {
        mentioner_name: mentionerName,
        resource_type: resourceType,
        resource_id: resourceId,
      },
    });
  }

  /**
   * Helper: Send event reminder notification
   */
  async sendEventReminder(
    userId: string,
    eventTitle: string,
    eventId: string,
    eventDate: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: NotificationType.EVENT_REMINDER,
      title: 'Event Reminder',
      message: `"${eventTitle}" is starting soon`,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
      action_url: `/event/${eventId}`,
      metadata: {
        event_id: eventId,
        event_date: eventDate,
      },
    });
  }

  /**
   * Helper: Send payment notification
   */
  async sendPaymentNotification(
    userId: string,
    amount: number,
    status: 'success' | 'failed' | 'pending',
    transactionId: string
  ): Promise<void> {
    const messages = {
      success: `Payment of ${amount} NGN was successful`,
      failed: `Payment of ${amount} NGN failed`,
      pending: `Payment of ${amount} NGN is being processed`,
    };

    await this.createNotification({
      user_id: userId,
      type: NotificationType.PAYMENT,
      title: 'Payment Update',
      message: messages[status],
      priority: status === 'failed' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      action_url: '/dashboard/payments',
      metadata: {
        amount,
        status,
        transaction_id: transactionId,
      },
    });
  }
}

export const notificationApiService = new NotificationApiService();
