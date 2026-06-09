import { ID, Storage } from 'appwrite';
import appwriteClient from './appwrite';

const PROFILE_PIC_BUCKET_ID = '68ed9015000a0ba7c893';

// Initialize storage service
const storage = new Storage(appwriteClient);

/**
 * Upload a profile picture to Appwrite storage
 * @param file - The image file to upload
 * @returns The URL of the uploaded file
 */
export const uploadProfilePicture = async (file: File): Promise<string> => {
  try {
    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 2MB limit');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP');
    }

    // Upload file to Appwrite storage
    const response = await storage.createFile(
      PROFILE_PIC_BUCKET_ID,
      ID.unique(),
      file
    );

    // Get the file URL
    const fileUrl = storage.getFileView(PROFILE_PIC_BUCKET_ID, response.$id);

    return fileUrl.toString();
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Delete a profile picture from Appwrite storage
 * @param fileId - The ID of the file to delete
 */
export const deleteProfilePicture = async (fileId: string): Promise<void> => {
  try {
    await storage.deleteFile(PROFILE_PIC_BUCKET_ID, fileId);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

/**
 * Extract file ID from Appwrite storage URL
 * @param url - The storage URL
 * @returns The file ID or null if not found
 */
export const extractFileIdFromUrl = (url: string): string | null => {
  try {
    // URL format: https://cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view
    const match = url.match(/\/files\/([^/]+)\/view/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting file ID from URL:', error);
    return null;
  }
};

/**
 * Get the preview URL for a file
 * @param fileId - The ID of the file
 * @param width - The desired width (optional)
 * @param height - The desired height (optional)
 * @returns The preview URL
 */
export const getProfilePicturePreview = (
  fileId: string,
  width?: number,
  height?: number
): string => {
  const preview = storage.getFilePreview(
    PROFILE_PIC_BUCKET_ID,
    fileId,
    width,
    height
  );
  return preview.toString();
};
