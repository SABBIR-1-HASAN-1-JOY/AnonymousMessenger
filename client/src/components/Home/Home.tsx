import React from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Users, MessageSquare, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { entities, reviews, posts } = useApp();

  // Get featured entities (highest rated)
  const featuredEntities = entities
    .sort((a, b) => b.overallRating - a.overallRating)
    .slice(0, 6);

  // Get recent posts
  const recentPosts = posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Get recent reviews
  const recentReviews = reviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-yellow-300">Jachai</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover, review, and share everything that matters to you. Join our community of reviewers and social enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    to="/entities"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105"
                  >
                    Explore Entities
                  </Link>
                  <Link
                    to="/create-post"
                    className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors transform hover:scale-105"
                  >
                    Create Post
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105 flex items-center"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors transform hover:scale-105 flex items-center"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
            
            {/* Demo User Info */}
            {!user && (
              <div className="mt-8 p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4">Try Demo Accounts:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="font-medium">john@demo.com</p>
                    <p className="text-blue-100">Tech enthusiast</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="font-medium">sarah@demo.com</p>
                    <p className="text-blue-100">Travel blogger</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="font-medium">mike@demo.com</p>
                    <p className="text-blue-100">Software developer</p>
                  </div>
                </div>
                <p className="text-sm text-blue-100 mt-3">Password: demo (for all accounts)</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{entities.length}</div>
              <div className="text-gray-600">Entities</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-teal-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{reviews.length}</div>
              <div className="text-gray-600">Reviews</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <div className="text-gray-600">Demo Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Entities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Entities</h2>
            <p className="text-gray-600">Discover the highest-rated entities on our platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEntities.map((entity) => (
              <Link
                key={entity.id}
                to={`/entities/${entity.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow transform hover:scale-105"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={entity.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {entity.category}
                    </span>
                    <div className="flex items-center">
                      {renderStars(Math.round(entity.overallRating))}
                      <span className="ml-2 text-sm text-gray-600">
                        {entity.overallRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{entity.name}</h3>
                  <p className="text-gray-600 text-sm">{entity.description}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    {entity.reviewCount} reviews
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-600">See what's happening in the community</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Recent Posts */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Latest Posts</h3>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {post.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{post.userName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {post.type === 'rate-my-work' ? (
                      <div>
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{post.description}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{post.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Latest Reviews</h3>
              <div className="space-y-4">
                {recentReviews.map((review) => {
                  const entity = entities.find(e => e.id === review.entityId);
                  return (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {review.userName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900">{review.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{review.body}</p>
                      {entity && (
                        <p className="text-xs text-blue-600 mt-2">for {entity.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Community?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Share your experiences, discover new favorites, and connect with like-minded reviewers.
          </p>
          {!user && (
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              Sign Up Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;