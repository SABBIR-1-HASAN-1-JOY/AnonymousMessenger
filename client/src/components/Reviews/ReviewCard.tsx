import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Star, User, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import VoteComponent from '../common/VoteComponent';
import CommentComponent from '../common/CommentComponent';
import ReportButton from '../Reports/ReportButton';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(review.title);
  const [editBody, setEditBody] = useState(review.body);
  const [editRating, setEditRating] = useState(review.rating);
  const [saving, setSaving] = useState(false);
  const [currentReview, setCurrentReview] = useState(review);

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(currentReview.title);
    setEditBody(currentReview.body);
    setEditRating(currentReview.rating);
  };

  const handleEditSave = async () => {
    if (!currentReview || !user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/${currentReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: editTitle,
          body: editBody,
          rating: editRating
        })
      });

      if (response.ok) {
        const updatedReview = { 
          ...currentReview, 
          title: editTitle,
          body: editBody,
          rating: editRating
        };
        setCurrentReview(updatedReview);
        setIsEditing(false);
      } else {
        console.error('Failed to update review');
        alert('Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Error updating review');
    } finally {
      setSaving(false);
    }
  };

  const getRelationshipTag = () => {
    if (!user) return null;
    
    if (currentReview.userId === parseInt(user.id.toString())) {
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
    (parseInt(e.id?.toString() || '0') === currentReview.entityId) || 
    (parseInt(e.item_id?.toString() || '0') === currentReview.entityId)
  );

  const relationshipTag = getRelationshipTag();

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {/* Header */}
      {showAuthor && (
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {currentReview.userName.charAt(0)}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{currentReview.userName}</h3>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(currentReview.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Review</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(currentReview.rating)}
                {currentReview.userId === parseInt(user?.id?.toString() || '0') && (
                  <button
                    onClick={handleEditStart}
                    className="ml-2 flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {isEditing ? (
          <div className="space-y-4 mb-4">
            {/* Edit form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Review title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setEditRating(i + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        i < editRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {editRating} out of 5 stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Content
              </label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                placeholder="Write your review..."
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditCancel}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{currentReview.title}</h4>
            <p className="text-gray-700 mb-4">{currentReview.body}</p>
          </>
        )}
        
        {/* Review voting and report component */}
        <div className="mb-4 flex items-center justify-between">
          <VoteComponent 
            entityType="review" 
            entityId={currentReview.id}
          />
          <ReportButton
            itemType="review"
            itemId={currentReview.id}
            reportedUserId={currentReview.userId}
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

        {/* Comments section */}
        <div className="mt-4 border-t pt-4">
          <CommentComponent 
            entityType="review" 
            entityId={currentReview.id} 
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
