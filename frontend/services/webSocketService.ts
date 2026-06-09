/**
 * WebSocket Chat Service
 * 
 * Handles real-time chat communication via WebSocket.
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Conversation subscriptions
 * - Typing indicators
 * - Message broadcasting
 * - Connection state management
 */

import type { Message, Conversation } from '../types/chat';

type MessageHandler = (data: any) => void;

interface WebSocketMessage {
  type: string;
  conversation_id?: string;
  message?: any;
  user_email?: string;
  is_typing?: boolean;
  timestamp?: string;
}

export class WebSocketChatService {
  private ws: WebSocket | null = null;
  private url: string;
  private userEmail: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;

  constructor(backendUrl: string) {
    // Convert HTTP URL to WebSocket URL
    this.url = backendUrl.replace(/^http/, 'ws');
  }

  /**
   * Connect to WebSocket server
   */
  connect(userEmail: string, onMessage: MessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('✅ Already connected to WebSocket');
        this.messageHandlers.add(onMessage);
        resolve();
        return;
      }

      this.userEmail = userEmail;
      this.messageHandlers.add(onMessage);
      this.isManuallyDisconnected = false;

      const wsUrl = `${this.url}/ws/chat/${encodeURIComponent(userEmail)}`;
      console.log(`📡 Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.startPing();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data.type);

          // Notify all handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected (code: ${event.code})`);
        this.stopPing();

        if (!this.isManuallyDisconnected) {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      // Timeout if connection takes too long
      setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.stopPing();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
    console.log('🔌 Manually disconnected from WebSocket');
  }

  /**
   * Subscribe to a conversation for real-time updates
   */
  subscribeToConversation(conversationId: string): void {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot subscribe - not connected');
      return;
    }

    this.send({
      type: 'subscribe',
      conversation_id: conversationId
    });

    console.log(`📡 Subscribed to conversation: ${conversationId}`);
  }

  /**
   * Unsubscribe from a conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    if (!this.isConnected()) {
      return;
    }

    this.send({
      type: 'unsubscribe',
      conversation_id: conversationId
    });

    console.log(`🔕 Unsubscribed from conversation: ${conversationId}`);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.isConnected()) {
      return;
    }

    this.send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping
    });
  }

  /**
   * Get list of online users in a conversation
   */
  getOnlineUsers(conversationId: string): void {
    if (!this.isConnected()) {
      return;
    }

    this.send({
      type: 'get_online_users',
      conversation_id: conversationId
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ Cannot send - WebSocket not open');
    }
  }

  /**
   * Start ping/pong to keep connection alive
   */
  private startPing(): void {
    this.stopPing();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping/pong
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      // Notify handlers of permanent disconnection
      this.messageHandlers.forEach(handler => {
        handler({
          type: 'connection_failed',
          message: 'Failed to reconnect after multiple attempts'
        });
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.userEmail && !this.isManuallyDisconnected) {
        console.log('🔄 Attempting to reconnect...');
        const handlers = Array.from(this.messageHandlers);
        this.messageHandlers.clear();
        
        this.connect(this.userEmail, handlers[0])
          .then(() => {
            console.log('✅ Reconnected successfully');
            // Re-add all handlers
            handlers.forEach(h => this.messageHandlers.add(h));
            
            // Notify handlers of reconnection
            handlers.forEach(handler => {
              handler({
                type: 'reconnected',
                message: 'Successfully reconnected to WebSocket'
              });
            });
          })
          .catch((error) => {
            console.error('❌ Reconnection failed:', error);
            this.handleReconnect(); // Try again
          });
      }
    }, delay);
  }
}

// Singleton instance
let webSocketService: WebSocketChatService | null = null;

/**
 * Get or create WebSocket service instance
 */
export function getWebSocketService(backendUrl: string): WebSocketChatService {
  if (!webSocketService) {
    webSocketService = new WebSocketChatService(backendUrl);
  }
  return webSocketService;
}

/**
 * Reset WebSocket service (for testing or cleanup)
 */
export function resetWebSocketService(): void {
  if (webSocketService) {
    webSocketService.disconnect();
    webSocketService = null;
  }
}
