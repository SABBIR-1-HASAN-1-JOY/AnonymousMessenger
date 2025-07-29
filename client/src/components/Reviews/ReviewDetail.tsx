import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Star, User, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import CommentComponent from '../common/CommentComponent';
import VoteComponent from '../common/VoteComponent';
import ReportButton from '../Reports/ReportButton';

const ReviewDetail: React.FC = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reviews, entities } = useApp();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadReview = async () => {
      if (!reviewId) {
        setLoading(false);
        return;
      }

      // First try to find review in context
      if (reviews) {
        const foundReview = reviews.find(r => 
          r.id?.toString() === reviewId
        );
        
        if (foundReview) {
          setReview(foundReview);
          setEditTitle(foundReview.title || '');
          setEditBody(foundReview.body || foundReview.reviewText || '');
          setEditRating(foundReview.rating || 1);
          setLoading(false);
          return;
        }
      }

      // If not found in context, fetch from API
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/${reviewId}`);
        if (response.ok) {
          const reviewData = await response.json();
          setReview(reviewData);
          setEditTitle(reviewData.title || '');
          setEditBody(reviewData.reviewText || '');
          setEditRating(reviewData.rating || 1);
        } else {
          console.error('Review not found');
          navigate('/'); // Redirect if review not found
        }
      } catch (error) {
        console.error('Error fetching review:', error);
        navigate('/'); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [reviewId, reviews, navigate]); // Added navigate to dependencies

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(review?.title || '');
    setEditBody(review?.body || review?.reviewText || '');
    setEditRating(review?.rating || 1);
  };

  const handleEditSave = async () => {
    if (!review || !user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/${review.id}`, {
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
        setReview({ 
          ...review, 
          title: editTitle,
          body: editBody,
          rating: editRating
        });
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

  const handleDelete = async () => {
    if (!review || !user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this review? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/reviews/${review.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      // Navigate back to feed after successful deletion
      navigate('/feed');
      
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review not found</h2>
          <p className="text-gray-600 mb-4">The review you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/feed')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const getRelationshipTag = () => {
    if (!user) return null;
    
    if (review.userId === user.id) {
      return { text: 'Your review', color: 'bg-blue-100 text-blue-800' };
    }
    
    return null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const entity = entities.find(e => 
    (parseInt(e.id?.toString() || '0') === parseInt(review.entityId)) || 
    (parseInt(e.item_id?.toString() || '0') === parseInt(review.entityId))
  );

  const relationshipTag = getRelationshipTag();

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Review Detail Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <Link 
                to={`/profile/${review.userId}`}
                className="w-12 h-12 rounded-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                title={`View ${review.userName || 'user'}'s profile`}
              >
                {review.userProfilePicture || review.user_profile_picture ? (
                  <img 
                    src={review.userProfilePicture || review.user_profile_picture} 
                    alt={`${review.userName || 'User'}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to letter avatar if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center ${
                    review.userProfilePicture || review.user_profile_picture ? 'hidden' : 'flex'
                  }`}
                  style={{
                    display: review.userProfilePicture || review.user_profile_picture ? 'none' : 'flex'
                  }}
                >
                  <span className="text-white font-medium text-lg">
                    {(review.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    to={`/profile/${review.userId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {review.userName || 'Unknown User'}
                  </Link>
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
              <div className="flex items-center mr-4">
                {renderStars(review.rating || 0)}
              </div>
              <div className="flex items-center gap-2">
                {review.userId === user?.id && (
                  <>
                    <button
                      onClick={handleEditStart}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                <ReportButton
                  itemType="review"
                  itemId={parseInt(review.id.toString())}
                  reportedUserId={parseInt(review.userId.toString())}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Edit form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Review title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setEditRating(i + 1)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Content
                    </label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={6}
                      placeholder="Write your review..."
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={saving}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {review.title}
                  </h2>
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {review.body || review.reviewText}
                  </p>
                </>
              )}

              {/* Entity link */}
              {entity && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Link
                    to={`/entities/${entity.item_id || entity.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Review for {entity.name || entity.item_name}
                  </Link>
                </div>
              )}
            </div>

            {/* Vote Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <VoteComponent
                entityType="review"
                entityId={parseInt(review.id.toString())}
                className="justify-center"
              />
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <CommentComponent
                entityType="review"
                entityId={parseInt(review.id.toString())}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;
