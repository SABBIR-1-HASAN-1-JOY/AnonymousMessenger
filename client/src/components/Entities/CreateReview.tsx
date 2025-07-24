import React, { useState, useEffect } from 'react';
import { X, Star, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CreateReviewProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
  onSuccess?: (newReview: any) => void;
}

const CreateReview: React.FC<CreateReviewProps> = ({ entityId, entityName, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(previewUrls);
  };

  // Remove photo from selection
  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Clean up URL object
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setSelectedPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviews);
  };

  // Upload photos for the review
  const uploadReviewPhotos = async (reviewId: string) => {
    if (selectedPhotos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotos = [];

    try {
      for (const photo of selectedPhotos) {
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('userId', user!.id);
        formData.append('type', 'reviews');
        formData.append('typeId', reviewId);
        formData.append('isAdmin', 'false'); // Regular users uploading review photos

        const response = await fetch('http://localhost:3000/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload photo: ${response.statusText}`);
        }

        const uploadedPhoto = await response.json();
        uploadedPhotos.push(uploadedPhoto);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }

    return uploadedPhotos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || formData.rating === 0) return;

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          itemId: entityId,
          title: formData.title,
          reviewText: formData.body,
          rating: formData.rating
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        let errorMessage = 'Failed to create review';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        alert(errorMessage); // Show user-friendly error message
        throw new Error(`Failed to create review: ${response.status} - ${errorText}`);
      }

      const newReview = await response.json();
      
      // Upload photos if any are selected
      let uploadedPhotos = [];
      if (selectedPhotos.length > 0) {
        try {
          uploadedPhotos = await uploadReviewPhotos(newReview.id || newReview.review_id);
        } catch (photoError) {
          console.error('Error uploading photos (review created successfully):', photoError);
          // Don't fail the whole process if photo upload fails
          alert('Review created successfully, but there was an error uploading photos.');
        }
      }
      
      // Call onSuccess callback with the new review data
      if (onSuccess) {
        onSuccess({
          ...newReview,
          userName: user.displayName,
          username: user.displayName,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          rating: formData.rating,
          ratingpoint: formData.rating,
          title: formData.title,
          review_title: formData.title,
          body: formData.body,
          review_text: formData.body,
          upvotes: 0,
          photos: uploadedPhotos
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const setRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Review {entityName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-gray-600">
                {formData.rating > 0 && `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Review Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Share your detailed experience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos (Optional)
            </label>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                  max={5}
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload photos (Max 5, up to 5MB each)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, GIF, WebP supported
                  </p>
                </label>
              </div>
              
              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photoPreviewUrls.map((url, index) => (
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
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingPhotos || formData.rating === 0 || !formData.title.trim() || !formData.body.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? 'Publishing...' : uploadingPhotos ? 'Uploading Photos...' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReview;