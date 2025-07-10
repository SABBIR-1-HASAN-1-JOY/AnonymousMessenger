import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Link as LinkIcon, Edit, Star, MessageSquare, Users, Heart, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

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
  const { entities } = useApp();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'following'>('posts');
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || ''
  });

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
        
        console.log('Fetching user profile for user ID:', user.id);
        const response = await fetch(`http://localhost:3000/api/userProfile/${user.id}`, {
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
        console.log('Follower count from server:', profileData.followerCount);
        console.log('Following count from server:', profileData.followingCount);
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

    fetchUserProfile();
  }, [user?.id]);

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
                    {isEditing ? (
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
                        <div className="text-xs text-gray-400 mt-2">
                          Posted on {new Date(post.created_at).toLocaleDateString()}
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
                      const entity = entities.find(e => e.id === review.item_id.toString());
                      return (
                        <div key={review.review_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">Review for {entity?.name || 'an entity'}</h3>
                            <div className="flex items-center">
                              {renderStars(review.ratingpoint)}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.review_text}</p>
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
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  You are following {followingCount} entities.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  A detailed list of followed entities is coming soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;