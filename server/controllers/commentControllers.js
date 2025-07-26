// controllers/commentControllers.js
const commentServices = require('../services/commentServices');

// Create a new comment
const createComment = async (req, res) => {
  try {
    console.log('=== CREATE COMMENT CONTROLLER ===');
    console.log('Request body:', req.body);
    
    const { userId, commentText, entityType, entityId, parentCommentId } = req.body;

    // Validate required fields
    if (!userId || !commentText || !entityType || !entityId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'User ID, comment text, entity type, and entity ID are required'
      });
    }

    // Validate entity type
    const validEntityTypes = ['post', 'review', 'comment'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        error: 'Invalid entity type',
        details: 'Entity type must be one of: post, review, comment'
      });
    }

    const commentData = {
      userId: parseInt(userId),
      commentText: commentText.trim(),
      entityType,
      entityId: parseInt(entityId),
      parentCommentId: parentCommentId ? parseInt(parentCommentId) : null
    };

    console.log('Creating comment with data:', commentData);

    const result = await commentServices.createComment(commentData);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to create comment'
      });
    }

    console.log('Comment created successfully:', result.comment);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: result.comment
    });

  } catch (error) {
    console.error('Error in createComment controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create comment'
    });
  }
};

// Get comments for an entity
const getCommentsByEntity = async (req, res) => {
  try {
    console.log('=== GET COMMENTS BY ENTITY CONTROLLER ===');
    console.log('Request params:', req.params);
    
    const { entityType, entityId } = req.params;

    // Validate entity type
    const validEntityTypes = ['post', 'review', 'comment'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        error: 'Invalid entity type',
        details: 'Entity type must be one of: post, review, comment'
      });
    }

    const result = await commentServices.getCommentsByEntity(entityType, parseInt(entityId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch comments'
      });
    }

    console.log(`Found ${result.comments.length} comments for ${entityType} ${entityId}`);

    res.status(200).json({
      success: true,
      comments: result.comments,
      count: result.comments.length
    });

  } catch (error) {
    console.error('Error in getCommentsByEntity controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch comments'
    });
  }
};

// Get a specific comment by ID
const getCommentById = async (req, res) => {
  try {
    console.log('=== GET COMMENT BY ID CONTROLLER ===');
    console.log('Comment ID:', req.params.commentId);
    
    const { commentId } = req.params;

    const result = await commentServices.getCommentById(parseInt(commentId));
    
    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Comment not found'
      });
    }

    console.log('Found comment:', result.comment);

    res.status(200).json({
      success: true,
      comment: result.comment
    });

  } catch (error) {
    console.error('Error in getCommentById controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch comment'
    });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    console.log('=== UPDATE COMMENT CONTROLLER ===');
    console.log('Comment ID:', req.params.commentId);
    console.log('Request body:', req.body);
    
    const { commentId } = req.params;
    const { commentText } = req.body;

    if (!commentText || commentText.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment text is required'
      });
    }

    const result = await commentServices.updateComment(parseInt(commentId), commentText.trim());
    
    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Failed to update comment'
      });
    }

    console.log('Comment updated successfully:', result.comment);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: result.comment
    });

  } catch (error) {
    console.error('Error in updateComment controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update comment'
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    console.log('=== DELETE COMMENT CONTROLLER ===');
    console.log('Comment ID:', req.params.commentId);
    
    const { commentId } = req.params;

    const result = await commentServices.deleteComment(parseInt(commentId));
    
    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Failed to delete comment'
      });
    }

    console.log('Comment deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteComment controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete comment'
    });
  }
};

// Get nested comments (replies) for a comment
const getCommentReplies = async (req, res) => {
  try {
    console.log('=== GET COMMENT REPLIES CONTROLLER ===');
    console.log('Parent comment ID:', req.params.commentId);
    
    const { commentId } = req.params;

    const result = await commentServices.getCommentReplies(parseInt(commentId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch comment replies'
      });
    }

    console.log(`Found ${result.replies.length} replies for comment ${commentId}`);

    res.status(200).json({
      success: true,
      replies: result.replies,
      count: result.replies.length
    });

  } catch (error) {
    console.error('Error in getCommentReplies controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch comment replies'
    });
  }
};

// Get comment statistics (total count, recent activity)
const getCommentStats = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Validate entity type
    const validEntityTypes = ['post', 'review', 'comment'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        error: 'Invalid entity type',
        details: 'Entity type must be one of: post, review, comment'
      });
    }

    const result = await commentServices.getCommentStats(entityType, parseInt(entityId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch comment statistics'
      });
    }

    res.status(200).json({
      success: true,
      stats: result.stats
    });

  } catch (error) {
    console.error('Error in getCommentStats controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch comment statistics'
    });
  }
};

module.exports = {
  createComment,
  getCommentsByEntity,
  getCommentById,
  updateComment,
  deleteComment,
  getCommentReplies,
  getCommentStats
};
