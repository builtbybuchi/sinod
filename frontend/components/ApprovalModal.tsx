import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (customMessage?: string) => Promise<void>;
  attendeeName: string;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  attendeeName,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [includeCustomMessage, setIncludeCustomMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(includeCustomMessage ? customMessage : undefined);
      onClose();
      setCustomMessage('');
      setIncludeCustomMessage(false);
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700/50 max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">Approve Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            You are about to approve <span className="font-semibold text-white">{attendeeName}</span>'s registration.
          </p>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeCustomMessage}
                onChange={(e) => setIncludeCustomMessage(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                Include custom approval message
              </span>
            </label>

            {includeCustomMessage && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Custom Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter a personalized message for the attendee (optional)"
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-gray-400">
                  This message will be included in the approval email along with the event details.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-700/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Approving...' : 'Approve Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
