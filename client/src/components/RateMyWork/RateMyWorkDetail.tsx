import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import CommentComponent from '../common/CommentComponent';
import VoteComponent from '../common/VoteComponent';
import ReportButton from '../Reports/ReportButton';
import RatingComponent from '../common/RatingComponent';

// Extended interface for work items that includes all possible properties
interface WorkItem {
  id: string;
  type: 'rate-my-work' | 'simple';
  userId: string;
  user_id?: number;
  userName: string;
  userAvatar?: string;
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  images?: string[];
  skills?: string[];
  category?: string;
  createdAt: string;
  averageRating?: number;
  ratingpoint?: number;
  totalRatings?: number;
  userRating?: number;
  upvotes?: number;
  downvotes?: number;
  comments?: any[];
  ratings?: { userId: string; rating: number }[];
}

const RateMyWorkDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts } = useApp(); // Use posts array for rate-my-work posts
  const [work, setWork] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({});
  const [postData, setPostData] = useState<any>(null);

  const fetchPostData = useCallback(async () => {
    if (!id) return;
    
    try {
      // Try to get detailed post data including ratings
      const response = await fetch(`http://localhost:3000/api/posts/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched post data:', data);
        setPostData(data);
        
        // Update the work object with fresh rating data
        setWork((prev: WorkItem | null) => {
          if (!prev) return prev;
          return {
            ...prev,
            averageRating: data.averageRating || data.ratingpoint || prev.averageRating,
            totalRatings: data.totalRatings || prev.totalRatings,
            ratingpoint: data.ratingpoint || prev.ratingpoint
          };
        });
      } else {
        console.warn('Failed to fetch detailed post data, using existing work data');
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    }
  }, [id]);

  const loadUserRatings = useCallback(() => {
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

  useEffect(() => {
    if (id && posts) {
      const foundWork = posts.find((w: any) => 
        w.id?.toString() === id && w.type === 'rate-my-work'
      );
      
      if (foundWork) {
        setWork(foundWork as WorkItem);
        setLoading(false);
        
        // Debug: Log the work object to see what rating data we have
        console.log('Work object rating data:', {
          ratingpoint: foundWork.ratingpoint,
          averageRating: foundWork.averageRating,
          totalRatings: foundWork.totalRatings,
          userRating: foundWork.userRating
        });
      } else {
        setLoading(false);
      }
    }
  }, [id, posts]);

  // Separate effect for data fetching after work is set
  useEffect(() => {
    if (work) {
      fetchPostData();
      loadUserRatings();
    }
  }, [work, fetchPostData, loadUserRatings]);

  const handleRatePost = useCallback(async (postId: string, rating: number) => {
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
      
      // Update work object with new rating data
      if (result.post) {
        setWork((prev: WorkItem | null) => {
          if (!prev) return prev;
          return {
            ...prev,
            ratingpoint: result.post.ratingpoint,
            averageRating: result.averageRating || result.post.ratingpoint,
            totalRatings: result.totalRatings || 1
          };
        });
      }
      
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

      // Refresh post data to get updated averages
      fetchPostData();
      
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  }, [user, fetchPostData]);

  const handleDelete = async () => {
    if (!work || !user) return;
    
    const isConfirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${work.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id.toString(),
        },
      });

      if (response.ok) {
        navigate('/feed');
      } else {
        console.error('Failed to delete post');
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rate my work...</p>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Work not found</h2>
          <p className="text-gray-600 mb-4">The work you're looking for doesn't exist or has been removed.</p>
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
    
    if (work.userId === user.id) {
      return { text: 'Your work', color: 'bg-purple-100 text-purple-800' };
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

        {/* Rate My Work Detail Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <Link 
                to={`/profile/${work.userId}`}
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <span className="text-white font-medium text-lg">
                  {(work.userName || 'U').charAt(0)}
                </span>
              </Link>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    to={`/profile/${work.userId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {work.userName || 'Unknown User'}
                  </Link>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(work.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Rate My Work</span>
                  {work.category && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-purple-600 font-medium">{work.category}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {work.userId === user?.id && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <ReportButton
                  itemType="post"
                  itemId={parseInt((work.id || '0').toString())}
                  reportedUserId={parseInt((work.userId || '0').toString())}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              {work.title && (
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {work.title}
                </h2>
              )}
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                {work.description}
              </p>

              {/* Work Content/Media */}
              {work.content && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Work Content</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {work.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {((work.images && work.images.length > 0) || work.image) && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {work.images && work.images.length > 0 ? (
                      work.images.map((image: string, index: number) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Work image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        />
                      ))
                    ) : work.image ? (
                      <img 
                        src={work.image} 
                        alt="Work image"
                        className="w-full h-64 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      />
                    ) : null}
                  </div>
                </div>
              )}

              {/* Skills/Tags */}
              {work.skills && work.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Skills & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {work.skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rating Section for Rate My Work Posts */}
            {work.type === 'rate-my-work' && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <RatingComponent
                  postId={work.id?.toString() || ''}
                  currentUserRating={userRatings[work.id || ''] || Number(work.userRating) || 0}
                  averageRating={Number(work.averageRating) || Number(work.ratingpoint) || Number(postData?.averageRating) || 0}
                  totalRatings={Number(work.totalRatings) || Number(postData?.totalRatings) || (work.ratingpoint ? 1 : 0)}
                  onRate={work.userId === user?.id || user?.isAdmin || user?.role === 'admin' ? undefined : (rating) => handleRatePost(work.id || '', rating)}
                  disabled={
                    work.userId === user?.id || // Don't allow users to rate their own posts
                    user?.isAdmin || user?.role === 'admin' // Don't allow admin users to rate posts
                  }
                />
                {work.userId === user?.id && (
                  <p className="text-sm text-gray-500 mt-2">
                    You cannot rate your own post
                  </p>
                )}
              </div>
            )}

            {/* Vote Component */}
            <div className="mt-6">
              <VoteComponent
                entityType="post"
                entityId={parseInt((work.id || '0').toString())}
              />
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <CommentComponent
                entityType="post"
                entityId={parseInt((work.id || '0').toString())}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateMyWorkDetail;
