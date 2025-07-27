// routes/postRoute.js
const express = require('express');
const { 
  createPost, 
  getAllPosts, 
  getPostsByUser, 
  votePost,
  ratePost,
  updatePost,
  deletePost,
  getPostById,
  getPostRatingDetails,
  getUserPostRating,
  removePostRating,
  getTopRatedPosts
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

// Get top rated posts
router.get('/top-rated', getTopRatedPosts);

// Get posts by user ID
router.get('/user/:userId', validateGetPostsByUser, getPostsByUser);

// Get individual post by ID
router.get('/:postId', getPostById);

// Get detailed rating information for a post
router.get('/:postId/ratings', getPostRatingDetails);

// Get user's rating for a specific post
router.get('/:postId/ratings/user', getUserPostRating);

// Vote on a post
router.post('/:postId/vote', validateVotePost, votePost);

// Rate a post (for rate-my-work posts)
router.post('/:postId/rate', ratePost);

// Remove user's rating for a post
router.delete('/:postId/rate', removePostRating);

// Update a post
router.put('/:postId', updatePost);

// Delete a post
router.delete('/:postId', deletePost);

module.exports = router;
