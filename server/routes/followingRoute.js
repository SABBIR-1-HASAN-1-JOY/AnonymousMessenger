// routes/followingRoute.js
const express = require('express');
const router = express.Router();
const { 
  followUser, 
  unfollowUser, 
  checkFollowStatus, 
  getUserFollowers, 
  getUserFollowing 
} = require('../controllers/followingControllers');

// Follow a user
router.post('/:userId/follow', followUser);

// Unfollow a user
router.delete('/:userId/unfollow', unfollowUser);

// Check if following a user
router.get('/:userId/status', checkFollowStatus);

// Get user's followers
router.get('/:userId/followers', getUserFollowers);

// Get users that a user is following
router.get('/:userId/following', getUserFollowing);

module.exports = router;
