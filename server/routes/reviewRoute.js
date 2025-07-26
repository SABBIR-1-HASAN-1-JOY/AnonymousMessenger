// routes/reviewRoute.js
const express = require('express');
const { 
  createReview, 
  getAllReviews, 
  getReviewsByUser, 
  getReviewsByItem,
  updateReview 
} = require('../controllers/reviewControllers');
const {
  validateCreateReview,
  validateUserIdParam,
  validateItemIdParam
} = require('../validators/reviewValidators');

const router = express.Router();

// Create a new review (with validation)
router.post('/', validateCreateReview, createReview);

// Get all reviews (no validation needed)
router.get('/', getAllReviews);

// Get reviews by user ID (with user ID validation)
router.get('/user/:userId', validateUserIdParam, getReviewsByUser);

// Get reviews by item/entity ID (with item ID validation)
router.get('/item/:itemId', validateItemIdParam, getReviewsByItem);

// Update a review
router.put('/:reviewId', updateReview);

module.exports = router;
