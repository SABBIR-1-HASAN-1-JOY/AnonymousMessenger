import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Star, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import VoteComponent from '../common/VoteComponent';

interface Review {
  id: number;
  entityId: number;
  userId: number;
  userName: string;
  title: string;
  body: string;
  rating: number;
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  showAuthor?: boolean;
  showEntity?: boolean;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  showAuthor = true, 
  showEntity = true,
  className = '' 
}) => {
  const { user } = useAuth();
  const { entities } = useApp();

  const getRelationshipTag = () => {
    if (!user) return null;
    
    if (review.userId === parseInt(user.id.toString())) {
      return { text: 'Your review', color: 'bg-blue-100 text-blue-800' };
    }
    
    return null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const entity = entities.find(e => 
    (parseInt(e.id?.toString() || '0') === review.entityId) || 
    (parseInt(e.item_id?.toString() || '0') === review.entityId)
  );

  const relationshipTag = getRelationshipTag();

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {/* Header */}
      {showAuthor && (
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {review.userName.charAt(0)}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(review.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Review</span>
                </div>
              </div>
              <div className="flex items-center">
                {renderStars(review.rating)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{review.title}</h4>
        <p className="text-gray-700 mb-4">{review.body}</p>
        
        {/* Review voting component */}
        <div className="mb-4">
          <VoteComponent 
            entityType="review" 
            entityId={review.id}
          />
        </div>
        
        {/* Entity link */}
        {showEntity && entity && (
          <Link
            to={`/entities/${entity.item_id || entity.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
          >
            <User className="w-4 h-4 mr-1" />
            Review for {entity.name || entity.item_name}
          </Link>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
