import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Star, Calendar, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import VoteComponent from '../common/VoteComponent';
import RatingComponent from '../common/RatingComponent';

const Feed: React.FC = () => {
  const { posts, reviews, entities, setPosts } = useApp();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'posts' | 'reviews'>('all');
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);

  // Load user ratings from localStorage on component mount
  React.useEffect(() => {
    if (user?.id) {
      const storedRatings = localStorage.getItem(`userRatings_${user.id}`);
      if (storedRatings) {
        try {
          const parsedRatings = JSON.parse(storedRatings);
          setUserRatings(parsedRatings);
        } catch (error) {
          console.error('Error loading user ratings:', error);
        }
      }
    }
  }, [user?.id]);

  // Fetch following users from server to ensure we have the latest data
  React.useEffect(() => {
    const fetchFollowingUsers = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`http://localhost:3000/api/users/${user.id}/following-users`);
        if (response.ok) {
          const followingData = await response.json();
          console.log('Fetched following users from server:', followingData);
          // Convert to strings for consistent comparison - backend returns user_id as integers
          const followingIds = followingData.map((u: any) => (u.following_id || u.user_id).toString());
          setFollowingUsers(followingIds);
        } else {
          console.log('Failed to fetch following users, using local data');
          setFollowingUsers((user.following || []).map(id => id.toString()));
        }
      } catch (error) {
        console.error('Error fetching following users:', error);
        setFollowingUsers((user.following || []).map(id => id.toString()));
      }
    };

    fetchFollowingUsers();
  }, [user?.id, user?.following]);

  // Handle rating a post
  const handleRatePost = async (postId: string, rating: number) => {
    if (!user) return;
    
    try {
      console.log('Rating post:', postId, 'with rating:', rating);
      
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          rating: rating
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Rating submitted successfully:', result);
      
      // Store the user's rating in local state and localStorage
      setUserRatings(prev => {
        const newRatings = {
          ...prev,
          [postId]: rating
        };
        
        // Persist to localStorage
        if (user?.id) {
          localStorage.setItem(`userRatings_${user.id}`, JSON.stringify(newRatings));
        }
        
        return newRatings;
      });

      // Update the posts context data with the new rating information
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              ratingpoint: rating, // Update the rating point from backend
              averageRating: rating, // For now, since backend only stores latest rating
              userRating: rating
            };
          }
          return post;
        })
      );
      
    } catch (error) {
      console.error('Error rating post:', error);
      throw error;
    }
  };

  // Combine posts and reviews for the feed based on user's follows and activities
  const feedItems = React.useMemo(() => {
    if (!user) return [];
    
    console.log('Current user:', user);
    console.log('Following users (from state):', followingUsers);
    console.log('Following users (from user):', user.following);
    console.log('All posts:', posts);
    
    // Use followingUsers state if available, otherwise fallback to user.following (ensure all are strings)
    const actualFollowing = followingUsers.length > 0 ? followingUsers : (user.following || []).map(id => id.toString());
    console.log('Actual following list to use:', actualFollowing);
    
    let items: any[] = [];

    if (filter === 'all' || filter === 'posts') {
      // 1. User's own posts (always included)
      const userPosts = posts.filter(post => 
        post.userId === user.id || post.user_id?.toString() === user.id
      );
      console.log('User posts:', userPosts);
      
      // 2. Posts from users that the current user follows
      const followedUsersPosts = posts.filter(post => {
        // Convert user_id (integer) to string for comparison with actualFollowing (array of strings)
        const postUserIdString = post.userId || post.user_id?.toString();
        const isFollowed = postUserIdString && actualFollowing.includes(postUserIdString);
        if (isFollowed) {
          console.log('Found followed user post:', post, 'Post user ID:', postUserIdString);
        }
        return isFollowed;
      });
      console.log('Followed users posts:', followedUsersPosts);
      
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
      console.log('User reviews:', userReviews);
      
      // 4. Reviews by users that the current user follows
      const followedUsersReviews = reviews.filter(review => {
        const reviewUserIdString = review.userId?.toString();
        const isFollowed = reviewUserIdString && actualFollowing.includes(reviewUserIdString);
        if (isFollowed) {
          console.log('Found followed user review:', review, 'Review user ID:', reviewUserIdString);
        }
        return isFollowed;
      });
      console.log('Followed users reviews:', followedUsersReviews);
      
      // 5. Reviews of entities that the user has reviewed (community activity on entities they care about)
      const userReviewedEntityIds = reviews
        .filter(review => review.userId === user.id)
        .map(review => review.entityId);
      
      const reviewsOnUserReviewedEntities = reviews.filter(review => {
        const entityId = review.entityId;
        const reviewUserId = review.userId;
        return userReviewedEntityIds.includes(entityId) && 
               reviewUserId !== user.id; // Exclude user's own reviews (already included above)
      });
      console.log('Reviews on user reviewed entities:', reviewsOnUserReviewedEntities);
      
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

    console.log('Final feed items:', uniqueItems);

    // Sort by creation date (recent first) - handle different date field names
    return uniqueItems.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [posts, reviews, filter, user, followingUsers]);

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
    
    const itemUserIdString = item.userId || item.user_id?.toString();
    const actualFollowing = followingUsers.length > 0 ? followingUsers : (user.following || []).map(id => id.toString());
    
    if (itemUserIdString === user.id) {
      return { text: 'Your content', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (itemUserIdString && actualFollowing.includes(itemUserIdString)) {
      return { text: 'Following', color: 'bg-green-100 text-green-800' };
    }
    
    if (item.itemType === 'review') {
      const userReviewedEntityIds = reviews
        .filter(review => review.userId === user.id)
        .map(review => review.entityId);
      
      const itemEntityId = item.entityId;
      if (userReviewedEntityIds.includes(itemEntityId)) {
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
                  <Link 
                    to={`/profile/${(item.userId || item.user_id)?.toString()}`}
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow cursor-pointer"
                    title={`View ${item.userName || item.user_name || 'user'}'s profile`}
                  >
                    <span className="text-white font-medium text-lg">
                      {(item.userName || item.user_name || 'U').charAt(0)}
                    </span>
                  </Link>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/profile/${(item.userId || item.user_id)?.toString()}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                            title={`View ${item.userName || item.user_name || 'user'}'s profile`}
                          >
                            {item.userName || item.user_name || 'Unknown User'}
                          </Link>
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
                          {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <span className="capitalize">{item.itemType}</span>
                        </div>
                      </div>
                      {item.itemType === 'review' && (
                        <div className="flex items-center">
                          {renderStars(item.rating || item.ratingpoint || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                {item.itemType === 'post' ? (
                  <div>
                    {(item.type === 'rate-my-work' || item.isRatedEnabled || item.is_rate_enabled) ? (
                      <div>
                        <p className="text-gray-700 mb-4">{item.description || item.content || item.post_text || ''}</p>
                        {item.image && (
                          <img
                            src={item.image}
                            alt="Rate my work"
                            className="w-full max-w-md h-64 object-cover rounded-lg mb-4"
                          />
                        )}
                        
                        {/* Rating Component for Rate My Work Posts */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <RatingComponent
                            postId={item.id}
                            currentUserRating={userRatings[item.id] || Number(item.userRating) || 0}
                            averageRating={Number(item.averageRating) || Number(item.ratingpoint) || 0}
                            totalRatings={Number(item.totalRatings) || 0}
                            onRate={(rating) => handleRatePost(item.id, rating)}
                            disabled={(item.userId || item.user_id?.toString()) === user?.id} // Don't allow users to rate their own posts
                          />
                          {(item.userId || item.user_id?.toString()) === user?.id && (
                            <p className="text-sm text-gray-500 mt-2">
                              You cannot rate your own post
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <VoteComponent 
                            entityType="post" 
                            entityId={parseInt(item.id.toString())} 
                            className="flex-1"
                          />
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>{item.comments?.length || 0} comments</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-4">{item.content || item.post_text || ''}</p>
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
                            <span>{item.comments?.length || 0} comments</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title || item.review_title || 'Review'}</h4>
                    <p className="text-gray-700 mb-4">{item.body || item.review_text || item.content}</p>
                    
                    {/* Review voting component */}
                    <div className="mb-4">
                      <VoteComponent 
                        entityType="review" 
                        entityId={parseInt(item.id.toString())}
                      />
                    </div>
                    
                    {(() => {
                      const entity = entities.find(e => e.id === (item.entityId || item.item_id) || e.item_id?.toString() === (item.entityId || item.item_id));
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