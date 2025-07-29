import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Reply, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportButton from '../Reports/ReportButton';

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
  autoExpand?: boolean;
  highlightUserId?: string;
  isAdminMode?: boolean;
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  entityType,
  entityId,
  className = '',
  autoExpand = false,
  highlightUserId,
  isAdminMode = false
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    // Initial load of comment count
    fetchCommentCount();
    
    // Poll for comment count every 5 seconds to keep data fresh
    const interval = setInterval(() => {
      if (!showComments) {
        // Only poll for count when comments are closed to reduce API calls
        fetchCommentCount();
      }
    }, 500000);

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

  // Handle auto-expand from URL or props
  useEffect(() => {
    if (autoExpand && !showComments) {
      setShowComments(true);
    }
  }, [autoExpand]);

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${entityType}/${entityId}/stats`);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${entityType}/${entityId}`);
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

    // Prevent admin users from commenting
    if (user?.isAdmin || user?.role === 'admin') {
      alert('Admin users cannot add comments');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments`, {
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

  const handleEditComment = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!user || !editText.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-id': user.id.toString()
        },
        body: JSON.stringify({
          commentText: editText.trim()
        }),
      });

      console.log('Update response status:', response.status);
      console.log('Update response ok:', response.ok);
      
      const responseData = await response.json();
      console.log('Update response data:', responseData);

      if (response.ok && responseData.success) {
        // Update the comment in the local state
        setComments(prev => prev.map(comment => {
          if (comment.comment_id === commentId) {
            return { ...comment, comment_text: editText.trim() };
          }
          // Handle nested replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.comment_id === commentId 
                  ? { ...reply, comment_text: editText.trim() }
                  : reply
              )
            };
          }
          return comment;
        }));
        setEditingCommentId(null);
        setEditText('');
        console.log('Comment updated successfully in frontend');
      } else {
        console.error('Failed to update comment - Response not ok or success false:', {
          status: response.status,
          ok: response.ok,
          responseData
        });
        alert(`Failed to update comment: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Error updating comment');
    }
  };

  const handleDeleteComment = async (commentId: number, commentText: string) => {
    if (!user) return;

    // Find the comment in all levels (including nested replies)
    const findComment = (commentList: Comment[], targetId: number): Comment | null => {
      for (const comment of commentList) {
        if (comment.comment_id === targetId) {
          return comment;
        }
        if (comment.replies && comment.replies.length > 0) {
          const found = findComment(comment.replies, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const targetComment = findComment(comments, commentId);
    const isOwner = targetComment?.user_id === parseInt(user.id.toString());
    
    // Unified confirmation message
    const confirmMessage = `Are you sure you want to delete this comment? This will also delete all replies to this comment.

Comment: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`;
    
    const confirmDelete = window.confirm(confirmMessage);
    
    if (!confirmDelete) return;

    try {
      console.log('Deleting comment:', { 
        commentId, 
        isAdminMode, 
        isOwner, 
        userId: user.id,
        hasToken: !!localStorage.getItem('token'),
        token: localStorage.getItem('token')?.substring(0, 20) + '...' // Log partial token for debugging
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'user-id': user.id.toString(),
        ...(isAdminMode && { 'x-admin-mode': 'true' })
      };

      // Only add Authorization header if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Request headers:', headers);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('Comment deleted successfully:', result);
        
        // Remove the comment and its replies from local state
        setComments(prev => {
          const removeComment = (commentList: Comment[]): Comment[] => {
            return commentList
              .filter(comment => comment.comment_id !== commentId)
              .map(comment => ({
                ...comment,
                replies: comment.replies ? removeComment(comment.replies) : []
              }));
          };
          return removeComment(prev);
        });

        // Update comment count
        fetchCommentCount();
        
        // Show success message
        alert(`Comment deleted successfully. ${result.totalDeleted} total items deleted (comment + replies).`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to delete comment:', { 
          status: response.status, 
          statusText: response.statusText, 
          errorData 
        });
        alert(`Failed to delete comment: ${errorData.error || response.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(`Error deleting comment: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    // Prevent admin users from replying to comments
    if (user?.isAdmin || user?.role === 'admin') {
      alert('Admin users cannot reply to comments');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments`, {
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

  const renderComment = (comment: Comment, isReply = false) => {
    // Check if this comment should be highlighted
    const shouldHighlight = highlightUserId && comment.user_id.toString() === highlightUserId;
    
    return (
      <div key={comment.comment_id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4 ${
        shouldHighlight ? 'ring-2 ring-yellow-400 bg-yellow-50 rounded-lg p-2' : ''
      }`}>
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {comment.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            {shouldHighlight && (
              <div className="mb-2 text-xs text-yellow-700 font-medium">
                📍 Highlighted comment from notification
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900">{comment.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                  {/* Edit button for comment owner only (not for admin mode) */}
                  {user && comment.user_id === parseInt(user.id.toString()) && !isAdminMode && (
                    <button
                      onClick={() => handleEditComment(comment.comment_id, comment.comment_text)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                  {/* Delete button for comment owner or admin */}
                  {user && (comment.user_id === parseInt(user.id.toString()) || isAdminMode) && (
                    <button
                      onClick={() => handleDeleteComment(comment.comment_id, comment.comment_text)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {editingCommentId === comment.comment_id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(comment.comment_id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 text-sm">{comment.comment_text}</p>
              )}
            </div>

          {/* Reply button and actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3">
              {/* Only show reply button for non-admin users */}
              {user && !user?.isAdmin && user?.role !== 'admin' && !isAdminMode && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.comment_id ? null : comment.comment_id)}
                  className="text-gray-500 hover:text-blue-600 text-xs font-medium flex items-center"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </button>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-gray-500">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
            <ReportButton
              itemType="comment"
              itemId={comment.comment_id}
              reportedUserId={comment.user_id}
              className="!p-1"
            />
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
  }

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
        data-comment-toggle="true"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span>{showComments ? comments.length : commentCount} comment{(showComments ? comments.length : commentCount) !== 1 ? 's' : ''}</span>
      </button>

      {/* Comments section */}
      {showComments && (
        <div className={`space-y-4 ${className?.includes('inline-flex') ? 'absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-96 z-20' : ''}`}>
          {/* Add comment form - only for non-admin users */}
          {user && !user?.isAdmin && user?.role !== 'admin' && !isAdminMode && (
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
