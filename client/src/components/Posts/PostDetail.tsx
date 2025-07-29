import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import CommentComponent from '../common/CommentComponent';
import VoteComponent from '../common/VoteComponent';
import ReportButton from '../Reports/ReportButton';

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts } = useApp();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (id && posts) {
        // First try to find the post in the existing posts array
        const foundPost = posts.find(p => 
          p.id?.toString() === id
        );
        
        if (foundPost) {
          setPost(foundPost);
          setEditContent((foundPost as any).post_text || (foundPost as any).content || (foundPost as any).description || '');
          setEditTitle((foundPost as any).title || '');
          setLoading(false);
        } else {
          // If not found in context, try to fetch it directly from the server
          try {
            const response = await fetch(`http://localhost:3000/api/posts/${id}`);
            if (response.ok) {
              const postData = await response.json();
              setPost(postData);
              setEditContent((postData as any).post_text || (postData as any).content || (postData as any).description || '');
              setEditTitle((postData as any).title || '');
            }
          } catch (error) {
            console.error('Error fetching post:', error);
          }
          setLoading(false);
        }
      } else if (id && posts && posts.length === 0) {
        // Posts array is loaded but empty
        setLoading(false);
      }
      // If posts is null/undefined, keep loading state true
    };

    fetchPost();
  }, [id, posts]); // Added 'posts' back to dependency array

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent((post as any).post_text || (post as any).content || (post as any).description || '');
    setEditTitle((post as any).title || '');
  };

  const handleEditSave = async () => {
    if (!post || !user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: editContent,
          title: editTitle
        })
      });

      if (response.ok) {
        setPost({ ...post, 
          post_text: editContent, 
          content: editContent,
          description: editContent,
          title: editTitle 
        });
        setIsEditing(false);
      } else {
        console.error('Failed to update post');
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Navigate back to feed after successful deletion
      navigate('/feed');
      
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Post not found</h2>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been removed.</p>
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
    
    if (post.user_id === user.id || post.userId === user.id) {
      return { text: 'Your post', color: 'bg-blue-100 text-blue-800' };
    }
    
    return null;
  };

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

        {/* Post Detail Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <Link 
                to={`/profile/${post.user_id || post.userId}`}
                className="w-12 h-12 rounded-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                title={`View ${post.user_name || post.userName || 'user'}'s profile`}
              >
                {post.userProfilePicture || post.user_profile_picture ? (
                  <img 
                    src={post.userProfilePicture || post.user_profile_picture} 
                    alt={`${post.user_name || post.userName || 'User'}'s profile`}
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
                  className={`w-full h-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center ${
                    post.userProfilePicture || post.user_profile_picture ? 'hidden' : 'flex'
                  }`}
                  style={{
                    display: post.userProfilePicture || post.user_profile_picture ? 'none' : 'flex'
                  }}
                >
                  <span className="text-white font-medium text-lg">
                    {(post.user_name || post.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    to={`/profile/${post.user_id || post.userId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {post.user_name || post.userName || 'Unknown User'}
                  </Link>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(post.created_at || post.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Post</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(post.user_id === user?.id || post.userId === user?.id) && (
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
                  itemType="post"
                  itemId={parseInt((post.id).toString())}
                  reportedUserId={parseInt((post.user_id || post.userId).toString())}
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
                      Content
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={6}
                      placeholder="What's on your mind?"
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
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {post.post_text || post.content || post.description}
                </p>
              )}
              
              {post.image && (
                <div className="mt-4">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Rate My Work specific content */}
              {post.type === 'rate-my-work' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 font-medium">⭐ Rate My Work</span>
                  </div>
                  {post.is_rate_enabled && (
                    <p className="text-sm text-gray-600">
                      Rating: {post.ratingpoint || 'No ratings yet'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vote Component */}
            <div className="mt-6">
              <VoteComponent
                entityType="post"
                entityId={parseInt((post.id).toString())}
              />
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <CommentComponent
                entityType="post"
                entityId={parseInt((post.id).toString())}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
