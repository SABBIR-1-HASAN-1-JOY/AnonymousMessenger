// services/commentServices.js
const {
  createComment,
  getCommentsByEntity,
  getCommentReplies,
  getCommentById,
  updateComment,
  deleteComment,
  getCommentCount,
  getNestedComments
} = require('../queries/commentQueries');

// Service to create a new comment
const createNewComment = async (commentData) => {
  try {
    console.log('Creating new comment:', commentData);
    const comment = await createComment(commentData);
    return {
      success: true,
      comment: comment
    };
  } catch (error) {
    console.error('Error in createNewComment service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to fetch comments for an entity
const fetchCommentsByEntity = async (entityType, entityId) => {
  try {
    console.log('Fetching comments for entity:', { entityType, entityId });
    const comments = await getCommentsByEntity(entityType, entityId);
    return {
      success: true,
      comments: comments
    };
  } catch (error) {
    console.error('Error in fetchCommentsByEntity service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to fetch nested comments structure
const fetchNestedComments = async (entityType, entityId) => {
  try {
    console.log('Fetching nested comments for entity:', { entityType, entityId });
    const comments = await getNestedComments(entityType, entityId);
    
    // Organize comments into nested structure
    const commentMap = new Map();
    const topLevelComments = [];
    
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.comment_id, comment);
      
      if (comment.parent_comment_id === null) {
        topLevelComments.push(comment);
      } else {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });
    
    return topLevelComments;
  } catch (error) {
    throw error;
  }
};

// Service to fetch comment replies
const fetchCommentReplies = async (parentCommentId) => {
  try {
    console.log('Fetching replies for comment:', parentCommentId);
    const replies = await getCommentReplies(parentCommentId);
    return replies;
  } catch (error) {
    throw error;
  }
};

// Service to fetch comment by ID
const fetchCommentById = async (commentId) => {
  try {
    console.log('Fetching comment by ID:', commentId);
    const comment = await getCommentById(commentId);
    return comment;
  } catch (error) {
    throw error;
  }
};

// Service to update comment
const updateCommentById = async (commentId, commentText) => {
  try {
    console.log('Updating comment:', { commentId, commentText });
    const updatedComment = await updateComment(commentId, commentText);
    return updatedComment;
  } catch (error) {
    throw error;
  }
};

// Service to delete comment
const deleteCommentById = async (commentId) => {
  try {
    console.log('Deleting comment:', commentId);
    const deletedComment = await deleteComment(commentId);
    return deletedComment;
  } catch (error) {
    throw error;
  }
};

// Service to get comment count
const fetchCommentCount = async (entityType, entityId) => {
  try {
    const count = await getCommentCount(entityType, entityId);
    
    return {
      success: true,
      stats: {
        totalComments: count,
        commentCount: count
      }
    };
  } catch (error) {
    console.error('Error in fetchCommentCount service:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch comment count'
    };
  }
};

module.exports = {
  createComment: createNewComment,
  getCommentsByEntity: fetchCommentsByEntity,
  getNestedComments: fetchNestedComments,
  getCommentReplies: fetchCommentReplies,
  getCommentById: fetchCommentById,
  updateComment: updateCommentById,
  deleteComment: deleteCommentById,
  getCommentStats: fetchCommentCount
};
