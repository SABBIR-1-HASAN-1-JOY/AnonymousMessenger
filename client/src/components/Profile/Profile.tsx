import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Edit, Star, MessageSquare, Users, Heart, Loader, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import VoteComponent from '../common/VoteComponent';
import RatingComponent from '../common/RatingComponent';

interface Review {
  review_id: number;
  item_id: number;
  user_id: number;
  ratingpoint: number;
  review_text: string;
  created_at: string;
  share_link: string;
  ishide: boolean;
}

interface Post {
  post_id: number;
  user_id: number;
  post_text: string;
  created_at: string;
  post_title?: string;
  is_rate_enabled?: boolean;
  ratingpoint?: number;
}

interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  bio?: string;
  profile_picture?: string;
  location?: string;
  created_at: string;
  isAdmin: boolean;
  post_count?: number;
  review_count?: number;
  entity_count?: number;
  followerCount?: number;
  followingCount?: number;
  posts?: Post[];
  reviews?: Review[];
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { id: paramId } = useParams<{ id?: string }>();
  const profileId = paramId || user?.id?.toString();
  const { entities } = useApp();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'following'>('posts');
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || ''
  });

  // Check if this is the current user's own profile
  const isOwnProfile = !paramId || paramId === user?.id?.toString();

  // Fetch user profile from server
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching user profile for user ID:', profileId);
        const response = await fetch(`http://localhost:3000/api/userProfile/${profileId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Profile fetch response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User profile not found');
          } else {
            setError(`Failed to fetch profile: ${response.status}`);
          }
          return;
        }
        
        const profileData = await response.json();
        console.log('Profile data received:', profileData);
        setUserProfile(profileData);
        
        // Update edit data with server data
        setEditData({
          displayName: profileData.username || '',
          bio: profileData.bio || ''
        });
        
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    const fetchFollowStatus = async () => {
      // Check follow status for other profiles
      if (profileId && user?.id && profileId !== user.id.toString()) {
        try {
          console.log('Checking follow status for:', { followerId: user.id, followingId: profileId });
          const response = await fetch(`http://localhost:3000/api/users/${profileId}/status?followerId=${user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Follow status response:', data);
            setIsFollowing(data.isFollowing);
          } else {
            console.log('Failed to fetch follow status:', response.status);
            setIsFollowing(false); // Default to not following if check fails
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
          setIsFollowing(false); // Default to not following if check fails
        }
      }
    };

    const fetchFollowingUsers = async () => {
      try {
        console.log('Fetching following users for user:', profileId);
        const response = await fetch(`http://localhost:3000/api/users/${profileId}/following-users`);
        
        if (response.ok) {
          const followingData = await response.json();
          console.log('Following users response:', followingData);
          setFollowingUsers(followingData);
        } else {
          console.log('Failed to fetch following users:', response.status);
          setFollowingUsers([]);
        }
      } catch (error) {
        console.error('Error fetching following users:', error);
        setFollowingUsers([]);
      }
    };

    // Load user ratings for posts (if any exist in local storage or from previous session)
    const loadUserRatings = () => {
      if (user?.id) {
        const storedRatings = localStorage.getItem(`userRatings_${user.id}`);
        if (storedRatings) {
          try {
            const parsedRatings = JSON.parse(storedRatings);
            setUserRatings(parsedRatings);
            console.log('Loaded user ratings from storage:', parsedRatings);
          } catch (error) {
            console.error('Error loading user ratings:', error);
          }
        }
      }
    };

    fetchUserProfile();
    fetchFollowStatus();
    fetchFollowingUsers();
    loadUserRatings();
  }, [profileId, user?.id]);

  // Update user profile on server
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Updating user profile:', editData);
      const response = await fetch(`http://localhost:3000/api/userProfile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editData.displayName,
          bio: editData.bio
        }),
      });
      
      console.log('Profile update response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      const updatedProfile = await response.json();
      console.log('Profile updated successfully:', updatedProfile);
      setUserProfile(updatedProfile);
      
      // Update local auth context
      updateProfile(editData);
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileId) return;
    
    try {
      setLoading(true);
      console.log('Following user:', { followerId: user.id, followingId: profileId });
      
      const response = await fetch(`http://localhost:3000/api/users/${profileId}/follow`, {
        method: 'POST', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ followerId: user.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Follow successful:', result);
        setIsFollowing(true);
        
        // Update follower count if we have profile data
        if (userProfile) {
          setUserProfile(prev => prev ? {
            ...prev,
            followerCount: (prev.followerCount || 0) + 1
          } : prev);
        }
      } else {
        const error = await response.json();
        console.error('Follow failed:', error);
        setError(error.error || 'Failed to follow user');
      }
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !profileId) return;
    
    try {
      setLoading(true);
      console.log('Unfollowing user:', { followerId: user.id, followingId: profileId });
      
      const response = await fetch(`http://localhost:3000/api/users/${profileId}/unfollow`, {
        method: 'DELETE', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ followerId: user.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Unfollow successful:', result);
        setIsFollowing(false);
        
        // Update follower count if we have profile data
        if (userProfile) {
          setUserProfile(prev => prev ? {
            ...prev,
            followerCount: Math.max((prev.followerCount || 0) - 1, 0)
          } : prev);
        }
      } else {
        const error = await response.json();
        console.error('Unfollow failed:', error);
        setError(error.error || 'Failed to unfollow user');
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Failed to unfollow user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle rating a post
  const handleRatePost = async (postId: string, rating: number) => {
    if (!user?.id) {
      setError('You must be logged in to rate posts');
      return;
    }

    try {
      console.log('Rating post:', { postId, userId: user.id, rating });
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      const result = await response.json();
      console.log('Rating submitted successfully:', result);

      // Store the user's rating in local state
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

      // Update the post in the local state to reflect the new rating
      if (userProfile) {
        setUserProfile(prev => {
          if (!prev) return prev;
          
          const updatedPosts = prev.posts?.map(post => {
            if (post.post_id.toString() === postId) {
              return {
                ...post,
                ratingpoint: rating
              };
            }
            return post;
          });

          return {
            ...prev,
            posts: updatedPosts
          };
        });
      }

    } catch (err) {
      console.error('Error rating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  };

  // Loading state
  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  const userPosts = userProfile?.posts || [];
  const userReviews = userProfile?.reviews || [];

  // Use server profile data if available, fallback to auth context data
  const displayProfile = userProfile || {
    username: user.displayName,
    email: user.email,
    bio: user.bio,
    profile_picture: user.profilePicture,
    location: '',
    created_at: user.createdAt,
    isAdmin: false,
    post_count: userPosts.length,
    review_count: userReviews.length,
    entity_count: 0,
    followerCount: 0,
    followingCount: 0,
    posts: [],
    reviews: []
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

  const userPostsCount = userPosts.length;
  const followingCount = userProfile?.followingCount ?? 0;
  const userReviewsCount = userReviews.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
  
        {/* Server Connection Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Server Connection</h3>
              <p className="text-xs text-blue-700">
                {userProfile 
                  ? '✓ Connected to server database' 
                  : '⚠ Using local data (server unavailable)'
                }
              </p>
            </div>
            {loading && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-start -mt-16 mb-4">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                {displayProfile.profile_picture ? (
                  <img
                    src={displayProfile.profile_picture}
                    alt={displayProfile.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-600">
                    {displayProfile.username?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              <div className="ml-6 flex-1 mt-16">
                <div className="flex items-center justify-between">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.displayName}
                        onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">{displayProfile.username}</h1>
                    )}
                    <p className="text-gray-600">{displayProfile.email}</p>
                    {displayProfile.location && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {displayProfile.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      // Show edit profile for own profile
                      isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={loading}
                          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </button>
                      )
                    ) : (
                      // Show follow/unfollow for other users' profiles
                      isFollowing ? (
                        <button
                          onClick={handleUnfollow}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          {loading ? 'Unfollowing...' : 'Unfollow'}
                        </button>
                      ) : (
                        <button
                          onClick={handleFollow}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {loading ? 'Following...' : 'Follow'}
                        </button>
                      )
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  {isEditing ? (
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {displayProfile.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-4 space-x-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(displayProfile.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {displayProfile.followerCount || 0} followers
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {displayProfile.followingCount || 0} following
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {userPostsCount}
            </div>
            <div className="text-gray-600">Posts</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {userReviewsCount}
            </div>
            <div className="text-gray-600">Reviews</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {followingCount}
            </div>
            <div className="text-gray-600">Following</div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts ({userPostsCount})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews ({userReviewsCount})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'following'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Following ({followingCount})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {userPosts.length > 0 ? (
                  userPosts
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((post) => (
                      <div key={post.post_id} className="border border-gray-200 rounded-lg p-4">
                        {post.post_title && (
                          <h3 className="font-semibold text-gray-900 mb-2">{post.post_title}</h3>
                        )}
                        <p className="text-gray-700 mb-3">{post.post_text}</p>
                        
                        {/* Rating Section for rate-my-work posts */}
                        {post.is_rate_enabled && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <RatingComponent
                              postId={post.post_id.toString()}
                              currentUserRating={userRatings[post.post_id.toString()] || 0}
                              averageRating={Number(post.ratingpoint) || 0}
                              totalRatings={post.ratingpoint ? 1 : 0} // Simple approach - indicates if rated
                              onRate={
                                // Only allow rating if it's not the user's own post
                                post.user_id.toString() !== user?.id?.toString()
                                  ? (rating) => handleRatePost(post.post_id.toString(), rating)
                                  : undefined
                              }
                              disabled={post.user_id.toString() === user?.id?.toString()}
                              className="w-full"
                            />
                            {post.user_id.toString() === user?.id?.toString() && (
                              <p className="text-sm text-gray-500 mt-2">
                                You cannot rate your own post
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Voting and Comments Section */}
                        <div className="flex items-center justify-between border-t pt-3 mt-3">
                          <VoteComponent 
                            entityType="post" 
                            entityId={parseInt(post.post_id.toString())}
                            className="flex-1"
                          />
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span>0 comments</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-2">
                          Posted on {new Date(post.created_at).toLocaleDateString()}
                          {post.is_rate_enabled && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Rate My Work
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No posts yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {userReviews.length > 0 ? (
                  userReviews
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((review) => {
                      const entity = entities.find(e => 
                        e.id === review.item_id.toString() || 
                        e.item_id === review.item_id.toString() ||
                        parseInt(e.id || '0') === review.item_id ||
                        parseInt(e.item_id || '0') === review.item_id
                      );
                      return (
                        <div key={review.review_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">Review for {entity?.name || entity?.item_name || 'an entity'}</h3>
                            <div className="flex items-center">
                              {renderStars(review.ratingpoint)}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.review_text}</p>
                          
                          {/* Voting Section */}
                          <div className="border-t pt-3 mb-3">
                            <VoteComponent 
                              entityType="review" 
                              entityId={parseInt(review.review_id.toString())}
                            />
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="space-y-6">
                {followingUsers.length > 0 ? (
                  followingUsers.map((followedUser) => {
                    return (
                      <div key={followedUser.following_id || followedUser.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                              <img
                                src={followedUser.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(followedUser.username || 'User')}&background=6366f1&color=fff`}
                                alt={followedUser.username || 'User'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {followedUser.username || 'Unknown User'}
                              </h3>
                              {followedUser.bio && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {followedUser.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => window.location.href = `/profile/${followedUser.following_id || followedUser.user_id}`}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {isOwnProfile ? "You haven't followed any users yet." : `${displayProfile.username} hasn't followed any users yet.`}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Follow other users to see them here!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;