// routes/commentRoute.js
const express = require('express');
const router = express.Router();
const commentControllers = require('../controllers/commentControllers');
const {
  validateCreateComment,
  validateCommentIdParam,
  validateGetComments,
  validateUpdateComment
} = require('../validators/commentValidators');

// =====================================
// COMMENT ROUTES
// =====================================

// POST /api/comments - Create a new comment
router.post('/', validateCreateComment, commentControllers.createComment);

// GET /api/comments/:entityType/:entityId - Get all comments for an entity
router.get('/:entityType/:entityId', validateGetComments, commentControllers.getCommentsByEntity);

// GET /api/comments/:commentId - Get a specific comment by ID
router.get('/:commentId', validateCommentIdParam, commentControllers.getCommentById);

// PUT /api/comments/:commentId - Update a comment
router.put('/:commentId', validateCommentIdParam, validateUpdateComment, commentControllers.updateComment);

// DELETE /api/comments/:commentId - Delete a comment
router.delete('/:commentId', validateCommentIdParam, commentControllers.deleteComment);

// GET /api/comments/:commentId/replies - Get replies for a comment
router.get('/:commentId/replies', validateCommentIdParam, commentControllers.getCommentReplies);

// GET /api/comments/:entityType/:entityId/stats - Get comment statistics for an entity
router.get('/:entityType/:entityId/stats', validateGetComments, commentControllers.getCommentStats);

module.exports = router;
