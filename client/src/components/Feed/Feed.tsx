import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Star, Calendar, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import VoteComponent from '../common/VoteComponent';

const Feed: React.FC = () => {
  const { posts, reviews, entities } = useApp();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'posts' | 'reviews'>('all');

  // Combine posts and reviews for the feed based on user's follows and activities
  const feedItems = React.useMemo(() => {
    if (!user) return [];
    
    let items: any[] = [];

    if (filter === 'all' || filter === 'posts') {
      // 1. User's own posts (always included)
      const userPosts = posts.filter(post => 
        post.userId === user.id
      );
      
      // 2. Posts from users that the current user follows
      const followedUsersPosts = posts.filter(post => 
        user.following && user.following.includes(post.userId)
      );
      
      items = [...items, 
        ...userPosts.map(post => ({ ...post, itemType: 'post' })),
        ...followedUsersPosts.map(post => ({ ...post, itemType: 'post' }))
      ];
    }

    if (filter === 'all' || filter === 'reviews') {
      // 3. User's own reviews (always included)
      const userReviews = reviews.filter(review => 
        review.userId === user.id
      );
      
      // 4. Reviews by users that the current user follows
      const followedUsersReviews = reviews.filter(review => 
        user.following && user.following.includes(review.userId)
      );
      
      // 5. Reviews of entities that the user has reviewed (community activity on entities they care about)
      const userReviewedEntityIds = reviews
        .filter(review => review.userId === user.id)
        .map(review => review.entityId);
      
      const reviewsOnUserReviewedEntities = reviews.filter(review => 
        userReviewedEntityIds.includes(review.entityId) && 
        review.userId !== user.id // Exclude user's own reviews (already included above)
      );
      
      items = [...items, 
        ...userReviews.map(review => ({ ...review, itemType: 'review' })),
        ...followedUsersReviews.map(review => ({ ...review, itemType: 'review' })),
        ...reviewsOnUserReviewedEntities.map(review => ({ ...review, itemType: 'review' }))
      ];
    }

    // Remove duplicates (in case of overlapping criteria)
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex(i => i.itemType === item.itemType && i.id === item.id)
    );

    // Sort by creation date (recent first)
    return uniqueItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, reviews, filter, user]);

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

  const getRelationshipTag = (item: any) => {
    if (!user) return null;
    
    if (item.userId === user.id) {
      return { text: 'Your content', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (user.following && user.following.includes(item.userId)) {
      return { text: 'Following', color: 'bg-green-100 text-green-800' };
    }
    
    if (item.itemType === 'review') {
      const userReviewedEntityIds = reviews
        .filter(review => review.userId === user.id)
        .map(review => review.entityId);
      
      if (userReviewedEntityIds.includes(item.entityId)) {
        return { text: 'Entity you reviewed', color: 'bg-purple-100 text-purple-800' };
      }
    }
    
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your feed</h2>
          <Link to="/login" className="text-blue-600 hover:text-blue-700">
            Sign in here
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Personalized Feed</h1>
          <p className="text-gray-600">
            See posts and reviews from people you follow, plus activity on entities you've reviewed
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setFilter('posts')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'posts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts Only
            </button>
            <button
              onClick={() => setFilter('reviews')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'reviews'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews Only
            </button>
          </div>
        </div>

        {/* Feed Items */}
        <div className="space-y-6">
          {feedItems.length > 0 ? (
            feedItems.map((item) => (
              <div key={`${item.itemType}-${item.id}`} className="bg-white rounded-xl shadow-md p-6">
                {/* Header */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {item.userName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{item.userName}</h3>
                          {(() => {
                            const tag = getRelationshipTag(item);
                            return tag ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${tag.color}`}>
                                {tag.text}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.createdAt).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <span className="capitalize">{item.itemType}</span>
                        </div>
                      </div>
                      {item.itemType === 'review' && (
                        <div className="flex items-center">
                          {renderStars(item.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                {item.itemType === 'post' ? (
                  <div>
                    {item.type === 'rate-my-work' ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-gray-700 mb-4">{item.description}</p>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full max-w-md h-64 object-cover rounded-lg mb-4"
                          />
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <VoteComponent 
                            entityType="post" 
                            entityId={parseInt(item.id.toString())} 
                            className="flex-1"
                          />
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>{item.comments.length} comments</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-4">{item.content}</p>
                        {item.image && (
                          <img
                            src={item.image}
                            alt="Post image"
                            className="w-full max-w-md h-64 object-cover rounded-lg mb-4"
                          />
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <VoteComponent 
                            entityType="post" 
                            entityId={parseInt(item.id.toString())}
                            className="flex-1"
                          />
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>{item.comments.length} comments</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-700 mb-4">{item.body}</p>
                    
                    {/* Review voting component */}
                    <div className="mb-4">
                      <VoteComponent 
                        entityType="review" 
                        entityId={parseInt(item.id.toString())}
                      />
                    </div>
                    
                    {(() => {
                      const entity = entities.find(e => e.id === item.entityId || e.item_id?.toString() === item.entityId);
                      return entity ? (
                        <Link
                          to={`/entities/${entity.item_id || entity.id}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <User className="w-4 h-4 mr-1" />
                          Review for {entity.name || entity.item_name}
                        </Link>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your personalized feed is empty</h3>
              <p className="text-gray-600 mb-6">
                Follow users to see their posts and reviews, or create your own content to get started
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/entities"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Discover & Review Entities
                </Link>
                <Link
                  to="/create-post"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Create Post
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;