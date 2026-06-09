/**
 * ChatPage Component
 * Main chat page integrating all chat functionality
 */

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChat } from '../../../contexts/ChatContext';
import ConversationList from '../../../components/chat/ConversationList';
import ChatWindow from '../../../components/chat/ChatWindow';
import NewChatModal from '../../../components/chat/NewChatModal';
import GroupChatModal from '../../../components/chat/GroupChatModal';
import ManageTeamMembersModal from '../../../components/chat/ManageTeamMembersModal';
import { getOrCreateAIConversation } from '../../../services/aiService';

const ChatPage: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId,
    typingUsers,
    loading,
    error,
    setActiveConversation,
    createDirectConversation,
    createGroupConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
  } = useChat();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);

  if (!currentUser || !currentUser.email) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-white/60">Please sign in to use chat</p>
        </div>
      </div>
    );
  }

  // Get active conversation data
  const activeConversation = conversations.find(
    (conv) => conv.$id === activeConversationId
  ) || null;

  // Get messages for active conversation
  const activeMessages = activeConversationId
    ? messages[activeConversationId] || []
    : [];

  // Get typing users for active conversation
  const activeTypingUsers = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];

  // Handler for creating a new direct conversation
  const handleCreateDirectChat = async (email: string, name: string) => {
    await createDirectConversation({
      otherUserEmail: email,
      otherUserName: name,
    });
  };

  // Handler for creating a new group conversation
  const handleCreateGroup = async (
    name: string,
    description: string,
    participantEmails: string[],
    participantNames: string[]
  ) => {
    await createGroupConversation({
      name,
      description,
      participantEmails,
      participantNames,
    });
  };

  // Handler for sending a message
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!activeConversationId || !currentUser?.email || !currentUser?.name) return;
    
    // Check if this is an AI conversation
    const activeConv = conversations.find(c => c.$id === activeConversationId);
    const { isAIConversation, sendAIMessage } = await import('../../../services/aiService');
    
    if (activeConv && isAIConversation(activeConv.participants)) {
      // Handle AI message
      if (content.trim() && !files?.length) {
        try {
          console.log('Sending message to AI:', content);
          await sendAIMessage({
            conversationId: activeConversationId,
            message: content,
            userEmail: currentUser.email,
            userName: currentUser.name,
            senderAvatar: currentUser.avatar,
            includeEvents: true,
            includeDocuments: false,
            includeTasks: false,
          });
        } catch (error) {
          console.error('Failed to send AI message:', error);
          throw error;
        }
      }
      return;
    }
    
    // Regular message handling
    // If there are files, upload them first
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Upload file using chatService
          const { default: chatService } = await import('../../../services/chatService');
          const { fileUrl } = await chatService.uploadChatFile(file);
          
          // Determine message type based on file type
          const messageType = file.type.startsWith('image/') ? 'image' : 'file';
          
          // Send message with attachment
          await sendMessage({
            conversationId: activeConversationId,
            content: content || file.name,
            type: messageType as any,
            attachmentUrl: fileUrl,
            attachmentName: file.name,
            attachmentSize: file.size,
          });
        } catch (error) {
          console.error('Failed to upload file:', error);
          throw error;
        }
      }
    } else if (content.trim()) {
      // Send text-only message
      await sendMessage({
        conversationId: activeConversationId,
        content,
      });
    }
  };

  // Handler for editing a message
  const handleEditMessage = async (messageId: string, content: string) => {
    await editMessage(messageId, content);
  };

  // Handler for deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  // Handler for marking messages as read
  const handleMarkAsRead = async () => {
    if (!activeConversationId) return;
    await markAsRead(activeConversationId);
  };

  // Handler for starting AI chat
  const handleAIChat = async () => {
    if (!currentUser?.email || !currentUser?.name) return;
    
    try {
      const conversationId = await getOrCreateAIConversation(
        currentUser.email,
        currentUser.name
      );
      
      // Select the AI conversation
      setActiveConversation(conversationId);
    } catch (error) {
      console.error('Failed to create AI conversation:', error);
    }
  };

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversation}
        onNewChat={() => setShowNewChatModal(true)}
        onNewGroup={() => setShowGroupModal(true)}
        onAIChat={handleAIChat}
        loading={loading}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConversation}
        messages={activeMessages}
        currentUserEmail={currentUser.email}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onMarkAsRead={handleMarkAsRead}
        onManageMembers={() => setShowManageMembersModal(true)}
        typingUsers={activeTypingUsers}
        loading={loading}
        hasMore={false}
      />

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleCreateDirectChat}
        currentUserEmail={currentUser.email}
      />

      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreateGroup={handleCreateGroup}
        currentUserEmail={currentUser.email}
      />

      <ManageTeamMembersModal
        isOpen={showManageMembersModal}
        onClose={() => setShowManageMembersModal(false)}
        conversation={activeConversation}
      />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-500 max-w-md shadow-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;