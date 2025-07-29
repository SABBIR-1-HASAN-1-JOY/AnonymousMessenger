// services/reviewServices.js
const { 
  createReview, 
  getAllReviews, 
  getReviewsByUserId, 
  getReviewsByItemId,
  getReviewById
} = require('../queries/reviewQueries');

const createNewReview = async (reviewData) => {
  try {
    console.log('Creating new review:', reviewData);
    const review = await createReview(reviewData);
    return review;
  } catch (error) {
    throw error;
  }
};

const fetchAllReviews = async () => {
  try {
    console.log('Fetching all reviews');
    const reviews = await getAllReviews();
    return reviews;
  } catch (error) {
    throw error;
  }
};

const fetchReviewsByUserId = async (userId) => {
  try {
    console.log('Fetching reviews for user ID:', userId);
    const reviews = await getReviewsByUserId(userId);
    return reviews;
  } catch (error) {
    throw error;
  }
};

const fetchReviewsByItemId = async (itemId) => {
  try {
    console.log('Fetching reviews for item ID:', itemId);
    const reviews = await getReviewsByItemId(itemId);
    return reviews;
  } catch (error) {
    throw error;
  }
};

const fetchReviewById = async (reviewId) => {
  try {
    console.log('Fetching review by ID:', reviewId);
    const review = await getReviewById(reviewId);
    return review;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNewReview,
  fetchAllReviews,
  fetchReviewsByUserId,
  fetchReviewsByItemId,
  fetchReviewById
};
