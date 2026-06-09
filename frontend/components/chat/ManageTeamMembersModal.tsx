import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Loader, Search, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { ConversationListItem } from '../../types/chat';

interface ManageTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationListItem | null;
}

const ManageTeamMembersModal: React.FC<ManageTeamMembersModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const { currentUser } = useAuth();
  const { addParticipants, removeParticipant } = useChat();
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewMemberEmail('');
      setSearchQuery('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !conversation) return null;

  const currentUserEmail = currentUser?.email || '';
  const isCreator = conversation.createdBy === currentUserEmail;

  // Filter members based on search
  const filteredMembers = conversation.otherParticipants.filter((participant) => {
    const query = searchQuery.toLowerCase();
    return (
      participant.name?.toLowerCase().includes(query) ||
      participant.email.toLowerCase().includes(query)
    );
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newMemberEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if already a member
    if (conversation.participants.includes(newMemberEmail.toLowerCase())) {
      setError('This user is already a member');
      return;
    }

    setIsAdding(true);
    try {
      await addParticipants(conversation.$id, {
        participantEmails: [newMemberEmail.toLowerCase()],
        participantNames: [newMemberEmail.split('@')[0]], // Use email username as default name
      });
      setSuccess(`Added ${newMemberEmail} to the group`);
      setNewMemberEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (participantEmail: string) => {
    if (!isCreator) {
      setError('Only the group creator can remove members');
      return;
    }

    if (participantEmail === currentUserEmail) {
      setError('You cannot remove yourself from the group');
      return;
    }

    setError('');
    setSuccess('');
    setRemovingEmail(participantEmail);

    try {
      await removeParticipant(conversation.$id, participantEmail);
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingEmail(null);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || '?';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Team Members</h2>
            <p className="text-sm text-gray-400 mt-1">{conversation.name || 'Group'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
              <Check size={18} />
              {success}
            </div>
          )}

          {/* Permission Notice */}
          {!isCreator && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg text-blue-400 text-sm">
              ℹ️ Only the group creator can add or remove members
            </div>
          )}

          {/* Add Member Form */}
          {isCreator && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Add New Member
              </label>
              <form onSubmit={handleAddMember} className="flex gap-3">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={isAdding}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isAdding || !newMemberEmail.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {isAdding ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Add
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Search Members */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Current Members ({conversation.participants.length})
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Current User */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {currentUser?.prefs?.['profile-pic-url'] ? (
                  <img
                    src={currentUser.prefs['profile-pic-url']}
                    alt={currentUser?.name || 'You'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {getInitials(currentUser?.name, currentUser?.email)}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">
                    {currentUser?.name || 'You'} (You)
                  </p>
                  <p className="text-sm text-gray-400">{currentUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCreator && (
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                    Creator
                  </span>
                )}
              </div>
            </div>

            {/* Other Members */}
            {filteredMembers.map((participant) => (
              <div
                key={participant.email}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.name || participant.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                      {getInitials(participant.name, participant.email)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {participant.name || participant.email}
                    </p>
                    <p className="text-sm text-gray-400">{participant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {participant.email === conversation.createdBy && (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                      Creator
                    </span>
                  )}
                  {isCreator && participant.email !== conversation.createdBy && (
                    <button
                      onClick={() => handleRemoveMember(participant.email)}
                      disabled={removingEmail === participant.email}
                      className="p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      aria-label="Remove member"
                      title="Remove member"
                    >
                      {removingEmail === participant.email ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && searchQuery && (
              <div className="text-center py-8 text-gray-500">
                No members found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 bg-gray-900/95 backdrop-blur border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeamMembersModal;
