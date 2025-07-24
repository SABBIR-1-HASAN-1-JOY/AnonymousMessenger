import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Reply } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Comment {
  comment_id: number;
  user_id: number;
  username: string;
  profile_picture?: string;
  comment_text: string;
  entity_type: string;
  entity_id: number;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

interface CommentComponentProps {
  entityType: 'post' | 'review';
  entityId: number;
  className?: string;
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  entityType,
  entityId,
  className = ''
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // Initial load of comment count
    fetchCommentCount();
    
    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(() => {
      if (!showComments) {
        // Only poll for count when comments are closed to reduce API calls
        fetchCommentCount();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [entityType, entityId]);

  useEffect(() => {
    // Fetch full comments when showing, just count when hiding
    if (showComments) {
      fetchComments();
    } else {
      fetchCommentCount();
    }
  }, [showComments, entityType, entityId]);

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/comments/${entityType}/${entityId}/stats`);
      const data = await response.json();
      
      if (data.success && data.stats) {
        setCommentCount(data.stats.totalComments || data.stats.commentCount || 0);
      } else {
        console.warn('Failed to fetch comment count:', data.error);
        // Fallback: if stats endpoint doesn't work, fetch full comments
        fetchComments();
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
      // Fallback: if stats endpoint doesn't exist, fetch full comments
      fetchComments();
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/comments/${entityType}/${entityId}`);
      const data = await response.json();
      
      if (data.success) {
        // Group comments by parent-child relationship
        const organizedComments = organizeComments(data.comments);
        setComments(organizedComments);
        setCommentCount(data.comments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const organizeComments = (commentList: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    commentList.forEach(comment => {
      commentMap.set(comment.comment_id, { ...comment, replies: [] });
    });

    // Second pass: organize parent-child relationships
    commentList.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.comment_id)!;
      
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          commentText: newComment.trim(),
          entityType,
          entityId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        setCommentCount(prev => prev + 1); // Update count immediately
        if (showComments) {
          fetchComments(); // This will update the full comment list and sync the count
        } else {
          // If comments are closed, just update the count from server to ensure accuracy
          setTimeout(() => fetchCommentCount(), 500);
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          commentText: replyText.trim(),
          entityType,
          entityId,
          parentCommentId: parentId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReplyText('');
        setReplyTo(null);
        setCommentCount(prev => prev + 1); // Update count immediately
        if (showComments) {
          fetchComments(); // This will update the full comment list and sync the count
        } else {
          // If comments are closed, just update the count from server to ensure accuracy
          setTimeout(() => fetchCommentCount(), 500);
        }
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.comment_id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-medium text-sm">
            {comment.username?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-900">{comment.username}</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
            </div>
            <p className="text-gray-800 text-sm">{comment.comment_text}</p>
          </div>

          {/* Reply button */}
          <div className="flex items-center mt-2 space-x-3">
            <button
              onClick={() => setReplyTo(replyTo === comment.comment_id ? null : comment.comment_id)}
              className="text-gray-500 hover:text-blue-600 text-xs font-medium flex items-center"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <span className="text-xs text-gray-500">
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Reply form */}
          {replyTo === comment.comment_id && (
            <form onSubmit={(e) => handleSubmitReply(e, comment.comment_id)} className="mt-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || !replyText.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Comments toggle button - inline style when className contains 'inline-flex' */}
      <button
        onClick={() => {
          console.log('Comment toggle clicked, current state:', showComments);
          setShowComments(!showComments);
        }}
        className={`flex items-center text-gray-500 hover:text-blue-600 text-sm font-medium cursor-pointer z-10 relative ${
          className?.includes('inline-flex') 
            ? 'mb-0' 
            : 'mb-4'
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span>{showComments ? comments.length : commentCount} comment{(showComments ? comments.length : commentCount) !== 1 ? 's' : ''}</span>
      </button>

      {/* Comments section */}
      {showComments && (
        <div className={`space-y-4 ${className?.includes('inline-flex') ? 'absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-96 z-20' : ''}`}>
          {/* Add comment form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {loading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments list */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentComponent;
