import React, { useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, userId, userName }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative rounded-xl border border-gray-700/50 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your QR Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <div className="mb-4 p-4 bg-white rounded-lg inline-block">
            <QRCodeCanvas
              value={userId}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">{userName}</h3>
          <p className="text-sm text-gray-400 mb-4">Unique ID: {userId}</p>
          <p className="text-xs text-gray-500">
            Share this QR code for event check-in and verification
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              // TODO: Implement download functionality
              console.log('Download QR code');
            }}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;