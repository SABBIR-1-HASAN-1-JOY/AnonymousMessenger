import React, { useState } from 'react';
import { Calendar, MapPin, Link as LinkIcon, Edit, Star, MessageSquare, Users, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { posts, reviews, entities } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews' | 'following'>('posts');
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || ''
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  const userPosts = posts.filter(post => post.userId === user.id);
  const userReviews = reviews.filter(review => review.userId === user.id);
  const followingEntities = entities.filter(entity => entity.followers.includes(user.id));

  const handleSaveProfile = () => {
    updateProfile(editData);
    setIsEditing(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-start -mt-16 mb-4">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-600">
                    {user.displayName.charAt(0)}
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
                      <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                    )}
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                      {user.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-4 space-x-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {user.followers.length} followers
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {user.following.length} following
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
            <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
            <div className="text-gray-600">Posts</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userReviews.length}</div>
            <div className="text-gray-600">Reviews</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{followingEntities.length}</div>
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
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews ({userReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'following'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Following ({followingEntities.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {userPosts.length > 0 ? (
                  userPosts
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                        {post.type === 'rate-my-work' ? (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                            <p className="text-gray-700 mb-3">{post.description}</p>
                            {post.image && (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                              />
                            )}
                            <div className="text-sm text-gray-500">
                              {post.ratings.length} ratings • {post.comments.length} comments
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-700 mb-3">{post.content}</p>
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post"
                                className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                              />
                            )}
                            <div className="text-sm text-gray-500">
                              {post.upvotes} upvotes • {post.comments.length} comments
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(post.createdAt).toLocaleDateString()}
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
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((review) => {
                      const entity = entities.find(e => e.id === review.entityId);
                      return (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{review.title}</h3>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.body}</p>
                          {entity && (
                            <p className="text-sm text-blue-600 mb-2">
                              Review for {entity.name}
                            </p>
                          )}
                          <div className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followingEntities.length > 0 ? (
                  followingEntities.map((entity) => (
                    <div key={entity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <img
                          src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                          alt={entity.name}
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                          <p className="text-sm text-gray-600">{entity.category}</p>
                          <div className="flex items-center mt-1">
                            {renderStars(Math.round(entity.overallRating))}
                            <span className="ml-1 text-sm text-gray-500">
                              ({entity.reviewCount})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Not following any entities yet</p>
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