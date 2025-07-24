import React, { useState } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';

interface EntityPhotoUploadProps {
  entityId: number;
  userId: number;
  isAdmin: boolean;
  onPhotoUploaded?: (photoUrl: string) => void;
  className?: string;
}

const EntityPhotoUpload: React.FC<EntityPhotoUploadProps> = ({
  entityId,
  userId,
  isAdmin,
  onPhotoUploaded,
  className = ''
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      alert('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file sizes (5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Each photo must be less than 5MB');
      return;
    }

    setSelectedPhotos(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Clean up URL object
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedPhotos(newPhotos);
    setPreviewUrls(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedPhotos.length === 0 || !isAdmin) return;

    setUploading(true);

    try {
      const uploadedPhotos = [];

      for (const photo of selectedPhotos) {
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('userId', userId.toString());
        formData.append('type', 'entities');
        formData.append('typeId', entityId.toString());
        formData.append('isAdmin', 'true');

        const response = await fetch('http://localhost:3000/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload photo');
        }

        const uploadedPhoto = await response.json();
        uploadedPhotos.push(uploadedPhoto);
      }

      // Clear selections
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedPhotos([]);
      setPreviewUrls([]);

      // Notify parent
      if (onPhotoUploaded && uploadedPhotos.length > 0) {
        onPhotoUploaded(`http://localhost:3000${uploadedPhotos[0].url}`);
      }

      alert(`${uploadedPhotos.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedPhotos([]);
    setPreviewUrls([]);
  };

  // Only show to admin users
  if (!isAdmin) {
    return (
      <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Only administrators can upload entity photos
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="entity-photo-upload"
            max={5}
          />
          <label htmlFor="entity-photo-upload" className="cursor-pointer">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload entity photos (Max 5, up to 5MB each)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, GIF, WebP supported • Admin only
            </p>
          </label>
        </div>

        {/* Photo Previews */}
        {previewUrls.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </>
                )}
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityPhotoUpload;
