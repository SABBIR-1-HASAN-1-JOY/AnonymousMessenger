const express = require('express');
const router = express.Router();
const voteControllers = require('../controllers/voteControllers');

// Middleware to check if user is authenticated
const authMiddleware = (req, res, next) => {
  // Simple auth check - in real app, you'd verify JWT token
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { id: parseInt(userId) };
  next();
};

// Cast vote (upvote/downvote)
router.post('/vote', authMiddleware, voteControllers.castVote);

// Note: Rate endpoint removed since vote table has no rating column

// Get vote counts for an entity
router.get('/counts/:entityType/:entityId', voteControllers.getVoteCounts);

// Get user's vote for an entity
router.get('/user/:entityType/:entityId', authMiddleware, voteControllers.getUserVote);

module.exports = router;
