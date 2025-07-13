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

const {
  validateFollowUser,
  validateUnfollowUser,
  validateCheckFollowStatus,
  validateGetUserFollowers,
  validateGetUserFollowing
} = require('../validators/followingValidators');

// Follow a user
router.post('/:userId/follow', validateFollowUser, followUser);

// Unfollow a user
router.delete('/:userId/unfollow', validateUnfollowUser, unfollowUser);

// Check if following a user
router.get('/:userId/status', validateCheckFollowStatus, checkFollowStatus);

// Get user's followers
router.get('/:userId/followers', validateGetUserFollowers, getUserFollowers);

// Get users that a user is following
router.get('/:userId/following', validateGetUserFollowing, getUserFollowing);

// Get users that a user is following with detailed user info
router.get('/:userId/following-users', validateGetUserFollowing, getUserFollowing);

module.exports = router;
