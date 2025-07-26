import React, { useState, useEffect } from 'react';
import { X, Download, Loader } from 'lucide-react';

interface Photo {
  id: number;
  photo_id: number;
  type: string;
  filename: string;
  url: string;
  sourceId: number;
  userId: number | null;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
}

interface PhotoGalleryProps {
  type: 'profile' | 'reviews' | 'entities';
  sourceId: number;
  canDelete?: boolean;
  userId?: number;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  type, 
  sourceId, 
  canDelete = false, 
  userId,
  className = '' 
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Fetch photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/photos/${type}/${sourceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }
        
        const photosData = await response.json();
        setPhotos(photosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [type, sourceId]);

  // Delete photo
  const handleDeletePhoto = async (photoId: number) => {
    if (!canDelete) return;
    
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      setDeleting(photoId);
      const response = await fetch(`http://localhost:3000/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId?.toString() || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      // Remove photo from local state
      setPhotos(photos.filter(photo => photo.photo_id !== photoId));
      
      // Close modal if the deleted photo was selected
      if (selectedPhoto?.photo_id === photoId) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading photos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return null; // Don't render anything if no photos
  }

  return (
    <div className={className}>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div key={photo.photo_id} className="relative group">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer">
              <img
                src={`http://localhost:3000${photo.url}`}
                alt="Photo"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => setSelectedPhoto(photo)}
              />
            </div>
            
            {/* Delete button */}
            {canDelete && (
              <button
                onClick={() => handleDeletePhoto(photo.photo_id)}
                disabled={deleting === photo.photo_id}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                {deleting === photo.photo_id ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`http://localhost:3000${selectedPhoto.url}`}
              alt="Photo"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Download button */}
            <a
              href={`http://localhost:3000${selectedPhoto.url}`}
              download={selectedPhoto.filename}
              className="absolute top-4 left-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>
            
            {/* Photo info */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Size:</span> {formatFileSize(selectedPhoto.fileSize)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Uploaded:</span> {new Date(selectedPhoto.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
