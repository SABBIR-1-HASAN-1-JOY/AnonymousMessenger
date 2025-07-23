// routes/postRoute.js
const express = require('express');
const { 
  createPost, 
  getAllPosts, 
  getPostsByUser, 
  votePost,
  ratePost
} = require('../controllers/postControllers');

const {
  validateCreatePost,
  validateVotePost,
  validateGetPostsByUser,
  validateGetAllPostsQuery
} = require('../validators/postValidators');

const router = express.Router();

// Create a new post
router.post('/', validateCreatePost, createPost);

// Get all posts (with optional query parameters for pagination, sorting, filtering)
router.get('/', validateGetAllPostsQuery, getAllPosts);

// Get posts by user ID
router.get('/user/:userId', validateGetPostsByUser, getPostsByUser);

// Vote on a post
router.post('/:postId/vote', validateVotePost, votePost);

// Rate a post (for rate-my-work posts)
router.post('/:postId/rate', ratePost);

module.exports = router;
