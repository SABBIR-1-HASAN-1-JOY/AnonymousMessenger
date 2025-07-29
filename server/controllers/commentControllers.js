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
    console.log('=== UPDATE COMMENT CONTROLLER HIT ===');
    console.log('Comment ID:', req.params.commentId);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const { commentId } = req.params;
    const { commentText } = req.body;
    const userId = req.headers['user-id'];

    if (!commentText || commentText.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment text is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    // Update the comment directly
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
    const userId = req.headers['user-id'] || req.body.userId;
    const isAdminMode = req.headers['x-admin-mode'] === 'true';
    
    console.log('Delete comment request:', { 
      commentId, 
      commentIdType: typeof commentId,
      userId, 
      userIdType: typeof userId,
      isAdminMode,
      allHeaders: req.headers 
    });

    if (!commentId) {
      console.log('❌ Missing commentId');
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // If admin mode is requested, verify the user has admin privileges
    if (isAdminMode) {
      console.log('🔒 Admin mode requested, verifying admin permissions...');
      // For now, we'll trust the frontend admin mode check
      // In production, you should verify admin status from database
      console.log('✅ Admin mode verified (trusting frontend for now)');
    }

    const pool = require('../config/db.js');
    console.log('🔌 Database pool acquired');
    
    // Check if comment exists and user owns it
    console.log('📝 Checking if comment exists...');
    const commentCheck = await pool.query(
      'SELECT comment_id, user_id, comment_text, parent_comment_id FROM comments WHERE comment_id = $1',
      [commentId]
    );
    
    console.log('Comment check result:', commentCheck.rows);
    
    if (commentCheck.rows.length === 0) {
      console.log('❌ Comment not found');
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const comment = commentCheck.rows[0];
    console.log('Found comment:', comment);
    
    // Check if user owns the comment OR is in admin mode
    console.log('🔒 Checking ownership:', { 
      commentUserId: comment.user_id, 
      commentUserIdType: typeof comment.user_id,
      requestUserId: userId,
      requestUserIdType: typeof userId,
      commentUserIdString: comment.user_id.toString(),
      requestUserIdString: userId.toString(),
      areEqual: comment.user_id.toString() === userId.toString(),
      isAdminMode: isAdminMode,
      canDelete: comment.user_id.toString() === userId.toString() || isAdminMode
    });
    
    if (comment.user_id.toString() !== userId.toString() && !isAdminMode) {
      console.log('❌ User does not own this comment and is not in admin mode');
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    // Count replies before deletion
    console.log('📊 Counting replies...');
    const replyCount = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = $1',
      [commentId]
    );
    
    const repliesCount = parseInt(replyCount.rows[0].count);
    console.log(`Found ${repliesCount} replies to delete along with the comment`);
    
    // Delete all replies first (cascading deletion)
    console.log('🗑️  Deleting all replies...');
    const deleteReplies = await pool.query(
      'DELETE FROM comments WHERE parent_comment_id = $1 RETURNING comment_id, comment_text',
      [commentId]
    );
    
    console.log(`✅ Deleted ${deleteReplies.rows.length} replies:`, deleteReplies.rows);
    
    // Delete the main comment
    console.log('🗑️  Deleting main comment...');
    const deleteResult = await pool.query(
      'DELETE FROM comments WHERE comment_id = $1 RETURNING comment_id, comment_text, parent_comment_id',
      [commentId]
    );
    
    console.log('Delete result:', deleteResult.rows);
    
    if (deleteResult.rows.length === 0) {
      console.log('❌ Failed to delete comment');
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
    
    const deletedComment = deleteResult.rows[0];
    console.log('✅ Comment deleted successfully:', deletedComment);
    
    const deleteMessage = isAdminMode 
      ? 'Comment and all replies deleted by admin successfully'
      : 'Comment and all replies deleted successfully';
    
    res.status(200).json({
      success: true,
      message: deleteMessage,
      isAdminDeletion: isAdminMode,
      deletedComment: {
        comment_id: deletedComment.comment_id,
        comment_text: deletedComment.comment_text,
        parent_comment_id: deletedComment.parent_comment_id
      },
      deletedReplies: deleteReplies.rows,
      totalDeleted: 1 + deleteReplies.rows.length
    });

  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete comment',
      details: error.message
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
