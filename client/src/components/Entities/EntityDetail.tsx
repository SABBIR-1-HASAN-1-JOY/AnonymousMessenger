import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Calendar, Plus, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateReview from './CreateReview';
import VoteComponent from '../common/VoteComponent';
import PhotoGallery from '../common/PhotoGallery';
import CommentComponent from '../common/CommentComponent';
import ReportButton from '../Reports/ReportButton';

interface EntityDetailData {
  id: string;
  item_id?: string; // Database uses item_id
  name: string; // Mapped from item_name by backend
  item_name?: string; // Original database field
  description: string;
  category: string;
  sector?: string;
  picture?: string;
  images?: string[];
  overallRating: number;
  overallrating?: number; // Database lowercase version
  reviewCount: number;
  reviewcount?: number; // Database lowercase version
  followers: string[];
  createdAt: string;
  reviews?: any[];
}

const EntityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos' | 'info'>('reviews');
  const [entity, setEntity] = useState<EntityDetailData | null>(null);
  const [entityReviews, setEntityReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add click handler for reviews
  const handleReviewClick = (review: any, event: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((event.target as HTMLElement).closest('button, a, .vote-component, .comment-component, .report-button')) {
      return;
    }
    
    const reviewId = review.review_id || review.id;
    navigate(`/reviews/${reviewId}`);
  };

  // Fetch entity details from server
  useEffect(() => {
    const fetchEntityDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:3000/api/entities/${id}/details`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Entity not found');
          } else {
            setError(`Failed to fetch entity details: ${response.status}`);
          }
          return;
        }
        
        const entityData = await response.json();
        console.log('Entity details received:', entityData);
        console.log('Reviews data:', entityData.reviews);
        
        // Check if the response has the entity nested inside an 'entity' property
        const actualEntityData = entityData.entity ? entityData.entity[0] : entityData;
        console.log('Actual entity data:', actualEntityData);
        
        // Create the properly formatted entity object
        const formattedEntity = {
          id: actualEntityData.item_id?.toString() || actualEntityData.id,
          item_id: actualEntityData.item_id,
          name: actualEntityData.item_name || actualEntityData.name,
          item_name: actualEntityData.item_name,
          description: actualEntityData.description || '',
          category: actualEntityData.category_name || actualEntityData.category || 'Unknown',
          sector: actualEntityData.sector_name || actualEntityData.sector || '',
          picture: actualEntityData.picture || '',
          images: actualEntityData.images || [],
          overallRating: parseFloat(actualEntityData.average_rating) || actualEntityData.overallRating || 0,
          reviewCount: parseInt(actualEntityData.review_count) || actualEntityData.reviewCount || 0,
          followers: actualEntityData.followers || [],
          createdAt: actualEntityData.created_at || actualEntityData.createdAt || new Date().toISOString(),
          reviews: entityData.reviews || []
        };
        
        // Calculate actual average rating from reviews if available
        const reviews = entityData.reviews || [];
        if (reviews.length > 0) {
          const validRatings = reviews
            .map((review: any) => {
              const rating = review.rating || review.ratingpoint || 0;
              const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
              return isNaN(numRating) ? 0 : numRating;
            })
            .filter((rating: number) => rating > 0);
          
          if (validRatings.length > 0) {
            const calculatedAverage = validRatings.reduce((sum: number, rating: number) => sum + rating, 0) / validRatings.length;
            formattedEntity.overallRating = calculatedAverage;
            formattedEntity.reviewCount = validRatings.length;
          }
        } else {
          // Ensure we have valid numbers from the backend data
          const backendRating = parseFloat(actualEntityData.average_rating) || actualEntityData.overallRating || 0;
          const backendCount = parseInt(actualEntityData.review_count) || actualEntityData.reviewCount || 0;
          formattedEntity.overallRating = isNaN(backendRating) ? 0 : backendRating;
          formattedEntity.reviewCount = isNaN(backendCount) ? 0 : backendCount;
        }
        
        setEntity(formattedEntity);
        setEntityReviews(entityData.reviews || []);
        
      } catch (err) {
        console.error('Error fetching entity details:', err);
        setError('Failed to load entity details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntityDetail();
  }, [id]);

  // Handle a newly created review for immediate front-end update
  const handleReviewSuccess = (newReview: any) => {
    // Prepend new review
    const updated = [newReview, ...entityReviews];
    setEntityReviews(updated);
    
    // The actual rating will be recalculated automatically from the updated entityReviews
    // No need to manually update entity state since we're using calculated values
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading entity details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Entity not found'}
          </h2>
          <Link to="/entities" className="text-blue-600 hover:text-blue-700">
            Back to entities
          </Link>
        </div>
      </div>
    );
  }

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

  // Calculate actual average from current reviews
  const calculateActualRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0;
    
    const validRatings = reviews
      .map(review => {
        const rating = review.rating || review.ratingpoint || 0;
        const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        return isNaN(numRating) ? 0 : numRating;
      })
      .filter(rating => rating > 0); // Only count valid positive ratings
    
    if (validRatings.length === 0) return 0;
    
    const totalRating = validRatings.reduce((sum: number, rating: number) => sum + rating, 0);
    return totalRating / validRatings.length;
  };

  const actualAverageRating = calculateActualRating(entityReviews);
  const actualReviewCount = entityReviews ? entityReviews.length : 0;

  // Use calculated rating if available, otherwise fall back to entity's stored rating
  const displayRating = actualReviewCount > 0 ? actualAverageRating : (entity?.overallRating || entity?.overallrating || 0);
  const displayReviewCount = actualReviewCount > 0 ? actualReviewCount : (entity?.reviewCount || entity?.reviewcount || 0);

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    if (!entityReviews || entityReviews.length === 0) {
      return {
        rating,
        count: 0,
        percentage: 0
      };
    }
    
    const count = entityReviews.filter(r => {
      const reviewRating = r.rating || r.ratingpoint || 0;
      const numRating = typeof reviewRating === 'string' ? parseFloat(reviewRating) : reviewRating;
      return !isNaN(numRating) && Math.round(numRating) === rating;
    }).length;
    
    return {
      rating,
      count,
      percentage: entityReviews.length > 0 ? (count / entityReviews.length) * 100 : 0
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-4">
            <Link
              to="/entities"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to entities
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Entity Image */}
            <div className="lg:w-1/3">
              <div className="aspect-w-16 aspect-h-12 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={entity.name || entity.item_name}
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>

            {/* Entity Info */}
            <div className="lg:w-2/3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-2">
                    {entity.category}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {entity.name || entity.item_name || 'No Name Found'}
                  </h1>
                  {/* Debug info */}
                  <div className="text-xs text-red-500 mb-2">
                    {/* Debug - name: "{entity.name}" | item_name: "{entity.item_name}" */}
                  </div>
                  <p className="text-gray-600 text-lg mb-4">{entity.description}</p>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-4xl font-bold text-gray-900 mr-3">
                      {(displayRating || 0).toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        {renderStars(Math.round(displayRating || 0))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Based on {displayReviewCount || 0} reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center text-sm">
                      <span className="w-8 text-gray-600 font-medium">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-gray-600 text-right">
                        {count} {count === 1 ? 'review' : 'reviews'}
                      </span>
                      <span className="w-12 text-gray-500 text-right text-xs ml-2">
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {user && !user?.isAdmin && user?.role !== 'admin' && (
                  <button
                    onClick={() => setShowCreateReview(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Write Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews ({entityReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Information
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* {(() => {
              console.log('Rendering reviews tab, entityReviews:', entityReviews);
              console.log('entityReviews.length:', entityReviews.length);
              console.log('entityReviews array:', JSON.stringify(entityReviews, null, 2));
              return null;
            })()} */}
            {entityReviews.length > 0 ? (
              <div>
                {/* {(() => {
                  console.log('About to render reviews...');
                  return null;
                })()} */}
                {entityReviews
                  .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
                  .map((review, index) => {
                    console.log(`Review ${index} fields:`, Object.keys(review));
                    console.log(`Review ${index} text content:`, {
                      review_text: review.review_text,
                      body: review.body,
                      content: review.content,
                      text: review.text
                    });
                    const reviewId = review.review_id || review.id || index;
                    
                    return (
                      <div 
                        key={reviewId} 
                        id={`review-${reviewId}`}
                        className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 cursor-pointer hover:shadow-lg"
                        onClick={(e) => handleReviewClick(review, e)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <Link 
                              to={`/profile/${(review.user_id || review.userId)?.toString()}`}
                              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow cursor-pointer"
                              title={`View ${review.userName || review.username || 'user'}'s profile`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-white font-medium text-lg">
                                {(review.userName || review.username || 'U').charAt(0)}
                              </span>
                            </Link>
                            <div className="ml-4">
                              <Link 
                                to={`/profile/${(review.user_id || review.userId)?.toString()}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                                title={`View ${review.userName || review.username || 'user'}'s profile`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {review.userName || review.username || 'Anonymous'}
                              </Link>
                              <div className="flex items-center">
                                <div className="flex items-center mr-3">
                                  {renderStars(review.rating || review.ratingpoint || 0)}
                                </div>
                                <span className="text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 inline mr-1" />
                                  {new Date(review.created_at || review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{review.title || review.review_title || 'Review'}</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {review.review_text || review.body || review.content || review.text || 'No review text'}
                        </p>
                        
                        {/* Review Photos */}
                        <div className="mb-4">
                          <PhotoGallery
                            type="reviews"
                            sourceId={parseInt((review.review_id || review.id || index).toString())}
                            canDelete={false}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <VoteComponent 
                            entityType="review" 
                            entityId={parseInt((review.review_id || review.id || index).toString())}
                            className="flex items-center space-x-4 vote-component"
                          />
                          <div className="flex items-center space-x-4 relative">
                            <CommentComponent
                              entityType="review"
                              entityId={parseInt((review.review_id || review.id || index).toString())}
                              className="inline-flex comment-component"
                            />
                            <ReportButton
                              itemType="review"
                              itemId={parseInt((review.review_id || review.id || index).toString())}
                              reportedUserId={parseInt((review.user_id || review.userId)?.toString() || '0')}
                              className="inline-flex report-button"
                            />
                            <span>{review.upvotes || 0} helpful</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600 mb-6">Be the first to review this entity!</p>
                {user && !user?.isAdmin && user?.role !== 'admin' && (
                  <button
                    onClick={() => setShowCreateReview(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Write the first review
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Entity Photos</h3>
            </div>
            <PhotoGallery
              type="entities"
              sourceId={parseInt(entity.id || entity.item_id || '0')}
              canDelete={false} // Only admins should be able to delete entity photos
              className="w-full"
            />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Entity Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-gray-900">{entity.name || entity.item_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <p className="text-gray-900">{entity.category}</p>
              </div>
              {entity.sector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <p className="text-gray-900">{entity.sector}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                <p className="text-gray-900">{new Date(entity.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900">{entity.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showCreateReview && (
        <CreateReview
          entityId={entity.id}
          entityName={entity.name || entity.item_name || 'Unknown Entity'}
          onClose={() => setShowCreateReview(false)}
          onSuccess={(newReview) => {
            setShowCreateReview(false);
            handleReviewSuccess(newReview);
          }}
        />
      )}
    </div>
  );
};

export default EntityDetail;