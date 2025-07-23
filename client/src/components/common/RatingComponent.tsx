import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingComponentProps {
  postId: string;
  currentUserRating?: number;
  averageRating?: number;
  totalRatings?: number;
  onRate?: (rating: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  postId,
  currentUserRating = 0,
  averageRating = 0,
  totalRatings = 0,
  onRate,
  disabled = false,
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (rating: number) => {
    if (disabled || isSubmitting || !onRate) return;
    
    setIsSubmitting(true);
    try {
      await onRate(rating);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = interactive 
        ? (hoveredRating > 0 ? starValue <= hoveredRating : starValue <= currentUserRating)
        : starValue <= (averageRating || 0);

      return (
        <Star
          key={index}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isActive 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300 hover:text-yellow-300'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          onMouseEnter={() => interactive && !disabled && setHoveredRating(starValue)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
          onClick={() => interactive && handleRating(starValue)}
        />
      );
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Interactive Rating (for user to rate) */}
      {onRate && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Rate this post:</p>
          <div className="flex items-center space-x-1">
            {renderStars(true)}
            {currentUserRating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                Your rating: {currentUserRating}/5
              </span>
            )}
          </div>
        </div>
      )}

      {/* Average Rating Display */}
      {totalRatings > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Average rating:</p>
          <div className="flex items-center space-x-2">
            {renderStars(false)}
            <span className="text-sm text-gray-600">
              {(averageRating || 0).toFixed(1)}/5 ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      )}

      {/* No ratings yet */}
      {totalRatings === 0 && !onRate && (
        <p className="text-sm text-gray-500">No ratings yet</p>
      )}

      {isSubmitting && (
        <p className="text-sm text-blue-600">Submitting rating...</p>
      )}
    </div>
  );
};

export default RatingComponent;
