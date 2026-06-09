/**
 * Presence Tracking API Service
 * Handles real-time presence tracking for documents, whiteboards, and chat
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PresenceUpdate {
  resource_type: 'document' | 'whiteboard' | 'chat' | 'event';
  resource_id: string;
  user_email: string;
  user_name?: string;
  is_active: boolean;
  metadata?: {
    cursor_position?: { x: number; y: number };
    is_typing?: boolean;
    current_page?: number;
    [key: string]: any;
  };
}

export interface PresenceResponse {
  id: string;
  resource_type: string;
  resource_id: string;
  user_email: string;
  user_name: string;
  user_color: string;
  is_active: boolean;
  metadata: Record<string, any>;
  last_seen: string;
}

export interface ActiveUsersResponse {
  resource_type: string;
  resource_id: string;
  active_users: PresenceResponse[];
  total: number;
}

class PresenceApiService {
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
   * Update user presence for a resource
   * Call this periodically (every 10-15 seconds) to maintain active status
   */
  async updatePresence(data: PresenceUpdate): Promise<PresenceResponse> {
    return this.request<PresenceResponse>('/api/presence/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all active users for a resource
   */
  async getActiveUsers(
    resourceType: string,
    resourceId: string
  ): Promise<ActiveUsersResponse> {
    return this.request<ActiveUsersResponse>(
      `/api/presence/${resourceType}/${resourceId}`
    );
  }

  /**
   * Deactivate user presence (call when user leaves)
   */
  async deactivatePresence(
    resourceType: string,
    resourceId: string,
    userEmail: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/presence/${resourceType}/${resourceId}?user_email=${encodeURIComponent(userEmail)}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Create a presence tracker that automatically updates at intervals
   */
  createPresenceTracker(
    resourceType: 'document' | 'whiteboard' | 'chat' | 'event',
    resourceId: string,
    userEmail: string,
    userName?: string,
    updateInterval: number = 15000 // 15 seconds
  ) {
    let intervalId: number | null = null;
    let metadata: Record<string, any> = {};

    const update = async () => {
      try {
        await this.updatePresence({
          resource_type: resourceType,
          resource_id: resourceId,
          user_email: userEmail,
          user_name: userName,
          is_active: true,
          metadata,
        });
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    };

    const start = () => {
      // Update immediately
      update();
      // Then update at intervals
      intervalId = window.setInterval(update, updateInterval);
    };

    const stop = async () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      
      // Mark as inactive
      try {
        await this.deactivatePresence(resourceType, resourceId, userEmail);
      } catch (error) {
        console.error('Failed to deactivate presence:', error);
      }
    };

    const updateMetadata = (newMetadata: Record<string, any>) => {
      metadata = { ...metadata, ...newMetadata };
    };

    return {
      start,
      stop,
      updateMetadata,
    };
  }
}

export const presenceApiService = new PresenceApiService();
