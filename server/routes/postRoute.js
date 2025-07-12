// routes/postRoute.js
const express = require('express');
const { 
  createPost, 
  getAllPosts, 
  getPostsByUser, 
  votePost 
} = require('../controllers/postControllers');

const router = express.Router();

// Create a new post
router.post('/', createPost);

// Get all posts
router.get('/', getAllPosts);

// Get posts by user ID
router.get('/user/:userId', getPostsByUser);

// Vote on a post
router.post('/:postId/vote', votePost);

module.exports = router;
