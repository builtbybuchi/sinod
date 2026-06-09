/**
 * Chat System Type Definitions
 * Defines all interfaces and types for the chat feature
 */

// ============================================================================
// Enums
// ============================================================================

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}

// ============================================================================
// Core Models (Appwrite Documents)
// ============================================================================

/**
 * Conversation document from Appwrite
 */
export interface Conversation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  type: ConversationType;
  name?: string;
  description?: string;
  avatarUrl?: string;
  participants: string[];
  participantNames: string[];
  participantAvatars?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageBy?: string;
  lastMessageAt?: string;
  unreadCounts: string; // JSON string: {"email": count}
}

/**
 * Message document from Appwrite
 */
export interface Message {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  readBy: string[];
  replyTo?: string;
}

/**
 * User presence document from Appwrite
 */
export interface UserPresence {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userEmail: string;
  userName: string;
  status: UserStatus;
  lastSeen: string;
  typingIn?: string;
}

// ============================================================================
// UI/Display Models
// ============================================================================

/**
 * Conversation list item with computed properties
 */
export interface ConversationListItem extends Conversation {
  displayName: string;
  displayAvatar?: string;
  unreadCount: number;
  isOnline?: boolean;
  lastMessagePreview?: string;
  otherParticipants?: ParticipantInfo[];
}

/**
 * Participant information
 */
export interface ParticipantInfo {
  email: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  status?: UserStatus;
}

/**
 * Message with sender info populated
 */
export interface MessageWithSender extends Message {
  isOwn: boolean;
  sender: ParticipantInfo;
  replyToMessage?: Message;
}

// ============================================================================
// Creation/Update Params
// ============================================================================

/**
 * Parameters for creating a new direct conversation
 */
export interface CreateDirectConversationParams {
  otherUserEmail: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

/**
 * Parameters for creating a new group conversation
 */
export interface CreateGroupConversationParams {
  name: string;
  description?: string;
  participantEmails: string[];
  participantNames: string[];
  participantAvatars?: string[];
}

/**
 * Parameters for sending a new message
 */
export interface SendMessageParams {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  replyTo?: string;
}

/**
 * Parameters for updating a conversation
 */
export interface UpdateConversationParams {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

/**
 * Parameters for adding participants to a group
 */
export interface AddParticipantsParams {
  participantEmails: string[];
  participantNames: string[];
  participantAvatars?: string[];
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Chat context state
 */
export interface ChatState {
  conversations: ConversationListItem[];
  messages: Record<string, Message[]>; // Keyed by conversationId
  activeConversationId: string | null;
  unreadCounts: Record<string, number>; // Keyed by conversationId
  onlineUsers: Record<string, UserPresence>; // Keyed by userEmail
  typingUsers: Record<string, string[]>; // conversationId -> userEmails[]
  loading: boolean;
  error: string | null;
}

/**
 * Chat context actions
 */
export interface ChatActions {
  // Conversations
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  createDirectConversation: (params: CreateDirectConversationParams) => Promise<Conversation>;
  createGroupConversation: (params: CreateGroupConversationParams) => Promise<Conversation>;
  updateConversation: (conversationId: string, params: UpdateConversationParams) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  addParticipants: (conversationId: string, params: AddParticipantsParams) => Promise<void>;
  removeParticipant: (conversationId: string, participantEmail: string) => Promise<void>;
  
  // Messages
  loadMessages: (conversationId: string, limit?: number, offset?: number) => Promise<void>;
  sendMessage: (params: SendMessageParams) => Promise<Message>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  
  // Presence & Typing
  updatePresence: (status: UserStatus) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  
  // Real-time subscriptions
  subscribeToConversations: () => void;
  subscribeToMessages: (conversationId: string) => void;
  subscribeToPresence: () => void;
  unsubscribeAll: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Unread counts map
 */
export interface UnreadCountsMap {
  [email: string]: number;
}

/**
 * Search result for users
 */
export interface UserSearchResult {
  email: string;
  name: string;
  avatar?: string;
  status?: UserStatus;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Real-time subscription handler
 */
export type UnsubscribeFunction = () => void;

/**
 * Message group (for display optimization)
 */
export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messages: MessageWithSender[];
  date: string;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ConversationList component
 */
export interface ConversationListProps {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  loading?: boolean;
}

/**
 * Props for ChatWindow component
 */
export interface ChatWindowProps {
  conversation: ConversationListItem | null;
  messages: MessageWithSender[];
  currentUserEmail: string;
  onSendMessage: (content: string, replyTo?: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  onMarkAsRead: () => void;
  typingUsers: string[];
  loading?: boolean;
  hasMore?: boolean;
}

/**
 * Props for MessageBubble component
 */
export interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

/**
 * Props for NewChatModal component
 */
export interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (params: CreateDirectConversationParams) => Promise<void>;
  currentUserEmail: string;
}

/**
 * Props for GroupChatModal component
 */
export interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (params: CreateGroupConversationParams) => Promise<void>;
  currentUserEmail: string;
  mode?: 'create' | 'edit';
  existingConversation?: Conversation;
}

// ============================================================================
// Error Types
// ============================================================================

export class ChatError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export enum ChatErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}
