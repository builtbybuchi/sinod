import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, User, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadProfilePicture as uploadToStorage } from '../../services/storage';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.prefs?.bio || '',
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>(
    currentUser?.prefs?.['profile-pic-url'] || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.prefs?.bio || '',
      });
      setProfilePicturePreview(currentUser.prefs?.['profile-pic-url'] || '');
    }
  }, [currentUser]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Profile picture must be less than 2MB');
      return;
    }

    setProfilePicture(file);
    setError('');
    setSuccess('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    setProfilePicturePreview(currentUser?.prefs?.['profile-pic-url'] || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate name
      if (!formData.name.trim()) {
        setError('Name is required');
        setIsSaving(false);
        return;
      }

      let profilePicUrl = currentUser?.prefs?.['profile-pic-url'] || '';

      // Upload profile picture if changed
      if (profilePicture) {
        setIsUploading(true);
        try {
          profilePicUrl = await uploadToStorage(profilePicture);
        } catch (uploadError) {
          setIsUploading(false);
          throw uploadError;
        }
        setIsUploading(false);
      }

      // Update user profile
      await updateUserProfile({
        name: formData.name,
        prefs: {
          bio: formData.bio,
          'profile-pic-url': profilePicUrl,
        },
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const userInitial = currentUser?.name?.[0]?.toUpperCase() || 
                      currentUser?.email?.[0]?.toUpperCase() || 
                      '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
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
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
              {success}
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              {/* Current/Preview Picture */}
              <div className="relative">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt={currentUser?.name || 'Profile'}
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-2 border-blue-500">
                    {userInitial}
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Buttons */}
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Upload size={18} />
                  Upload Photo
                </button>
                {(profilePicture || profilePicturePreview) && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={isUploading || isSaving}
                    className="px-4 py-2 text-red-400 hover:bg-red-500/10 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF or WebP. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Display Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={isSaving}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.bio.length}/500
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 bg-gray-900/95 backdrop-blur border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-gray-300 hover:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
