import React, { useState } from 'react';
import { X, Bell, Check, CheckCheck, Trash2, Loader } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
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

  if (!isOpen) return null;

  // Filter notifications
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    // Mark as read
    await markAsRead(notificationId);
    
    // Navigate if action URL exists
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    try {
      await deleteNotification(notificationId);
    } finally {
      setDeletingId(null);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TEAM_INVITE:
      case NotificationType.MEMBER_ADDED:
        return '👥';
      case NotificationType.MEMBER_REMOVED:
        return '👋';
      case NotificationType.MESSAGE_MENTION:
        return '💬';
      case NotificationType.EVENT_INVITE:
      case NotificationType.EVENT_UPDATE:
        return '📅';
      case NotificationType.DOCUMENT_SHARED:
        return '📄';
      case NotificationType.WHITEBOARD_SHARED:
        return '🎨';
      case NotificationType.SYSTEM:
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-700">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Bell className="text-blue-500" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between px-6 pb-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Bell className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-400 text-sm">
                {filter === 'unread'
                  ? 'All caught up! Check back later for new updates.'
                  : 'You don\'t have any notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.$id}
                  onClick={() => handleNotificationClick(notification.$id, notification.actionUrl)}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{notification.title}</h4>
                          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatTime(notification.createdAt)}</span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(notification.$id, e)}
                          disabled={deletingId === notification.$id}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === notification.$id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
