import React, { useState } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfilePhotoUploadProps {
  userId: number;
  currentPhotoUrl?: string;
  onPhotoUploaded?: (photoUrl: string) => void;
  className?: string;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  className = ''
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if user can upload (only own profile)
  const canUpload = user && (user.id === userId.toString());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('userId', userId.toString());
      formData.append('type', 'profile');
      formData.append('typeId', userId.toString()); // For profile photos, typeId is the same as userId
      formData.append('isAdmin', 'false');

      const response = await fetch('http://localhost:3000/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const uploadedPhoto = await response.json();
      
      // Clear preview
      setPreviewUrl(null);
      setSelectedFile(null);
      
      // Notify parent component
      if (onPhotoUploaded) {
        onPhotoUploaded(`http://localhost:3000${uploadedPhoto.url}`);
      }

      alert('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current/Preview Photo */}
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg mx-auto">
        <img
          src={previewUrl || currentPhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Upload Controls */}
      {canUpload && (
        <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2">
          {!previewUrl ? (
            // Upload button
            <label htmlFor="profile-photo-upload" className="cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
              </div>
              <input
                type="file"
                id="profile-photo-upload"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            // Upload actions when file is selected
            <div className="flex space-x-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {uploading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload instructions */}
      {canUpload && !previewUrl && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Click camera icon to upload
        </p>
      )}

      {previewUrl && (
        <p className="text-xs text-blue-600 text-center mt-2">
          Click ✓ to upload or ✗ to cancel
        </p>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;
