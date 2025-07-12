// routes/reviewRoute.js
const express = require('express');
const { 
  createReview, 
  getAllReviews, 
  getReviewsByUser, 
  getReviewsByItem 
} = require('../controllers/reviewControllers');

const router = express.Router();

// Create a new review
router.post('/', createReview);

// Get all reviews
router.get('/', getAllReviews);

// Get reviews by user ID
router.get('/user/:userId', getReviewsByUser);

// Get reviews by item/entity ID
router.get('/item/:itemId', getReviewsByItem);

module.exports = router;
