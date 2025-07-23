import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SimplePost, RateMyWorkPost } from '../../types';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { posts, setPosts } = useApp(); // Use posts and setPosts from context
  const { user } = useAuth();
  const [postType, setPostType] = useState<'simple' | 'rate-my-work'>('simple');
  const [simplePostData, setSimplePostData] = useState({
    content: ''
  });
  const [rateMyWorkData, setRateMyWorkData] = useState({
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createPost = async (postData: Omit<SimplePost | RateMyWorkPost, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding post to backend:', postData);
      
      const requestBody: any = {
        userId: parseInt(postData.userId),
        content: postData.type === 'simple' ? (postData as SimplePost).content : (postData as RateMyWorkPost).description,
        is_rate_enabled: postData.type === 'rate-my-work'
      };

      console.log('Request body being sent:', requestBody);
      console.log('Post type:', postData.type);
      console.log('is_rate_enabled will be:', postData.type === 'rate-my-work');

      // Use single endpoint for both post types
      const endpoint = 'http://localhost:3000/api/posts';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newPost = await response.json();
      console.log('Post created successfully:', newPost);
      
      // Update local state
      const updatedPosts = [...posts, newPost];
      setPosts(updatedPosts);
      
      return newPost;
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (postType === 'simple') {
        await createPost({
          type: 'simple',
          userId: user.id,
          userName: user.displayName,
          content: simplePostData.content,
          upvotes: 0,
          downvotes: 0,
          comments: []
        } as Omit<SimplePost, 'id' | 'createdAt'>);
      } else {
        await createPost({
          type: 'rate-my-work',
          userId: user.id,
          userName: user.displayName,
          description: rateMyWorkData.description,
          ratings: [],
          comments: []
        } as Omit<RateMyWorkPost, 'id' | 'createdAt'>);
      }
      
      // Navigate to feed on successful creation
      navigate('/feed');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimplePostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSimplePostData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRateMyWorkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRateMyWorkData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to create a post</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          <p className="mt-2 text-gray-600">
            Share your thoughts or get feedback on your work
          </p>
        </div>

        {/* Post Type Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Post Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setPostType('simple')}
              className={`p-4 border-2 rounded-lg transition-all ${
                postType === 'simple'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Simple Post</h3>
              <p className="text-sm text-gray-600 mt-1">
                Share thoughts, experiences, or general content
              </p>
            </button>
            
            <button
              onClick={() => setPostType('rate-my-work')}
              className={`p-4 border-2 rounded-lg transition-all ${
                postType === 'rate-my-work'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Star className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900">Rate My Work</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get feedback and ratings on your projects or creations
              </p>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {postType === 'simple' ? (
              /* Simple Post Form */
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  What's on your mind? *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={simplePostData.content}
                  onChange={handleSimplePostChange}
                  required
                  rows={6}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            ) : (
              /* Rate My Work Form */
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want feedback on? *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={rateMyWorkData.description}
                  onChange={handleRateMyWorkChange}
                  required
                  rows={6}
                  placeholder="Describe your work and what kind of feedback you're looking for..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            )}

            {/* Image URL - Commented out as not supported in current database schema */}
            {/* <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value=""
                onChange={() => {}}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div> */}

            {/* Photo Upload Placeholder - Commented out as not supported in current database schema */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo (Coming Soon)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Photo upload feature will be available soon
                </p>
              </div>
            </div> */}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (postType === 'simple' ? !simplePostData.content.trim() : !rateMyWorkData.description.trim())}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;