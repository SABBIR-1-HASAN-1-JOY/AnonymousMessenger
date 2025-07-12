// controllers/reviewControllers.js
const { 
  createNewReview, 
  fetchAllReviews, 
  fetchReviewsByUserId, 
  fetchReviewsByItemId 
} = require('../services/reviewServices');

const createReview = async (req, res) => {
  try {
    console.log('=== CREATE REVIEW ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    
    const { userId, itemId, rating, reviewText, title, upvotes, pictures } = req.body;
    
    // Validate required fields
    if (!userId || !itemId || !rating || !reviewText) {
      return res.status(400).json({ error: 'User ID, item ID, rating, and review text are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const reviewData = {
      userId,
      itemId,
      rating,
      reviewText,
      title: title || 'Review'
    };
    console.log('Review data to be created:', reviewData);
    
    const newReview = await createNewReview(reviewData);
    
    // Format response to match frontend expectations
    const responseData = {
      id: newReview.review_id.toString(),
      review_id: newReview.review_id,
      entityId: newReview.item_id.toString(),
      userId: newReview.user_id.toString(),
      user_id: newReview.user_id,
      userName: newReview.user_name || 'Unknown User',
      title: newReview.title, // Use title from database
      body: newReview.review_text,
      rating: newReview.ratingpoint, // Use ratingpoint from DB
      createdAt: newReview.created_at,
      created_at: newReview.created_at,
      upvotes: upvotes || 0, // Use upvotes from request since DB doesn't store it
      downvotes: 0, // Not supported in current schema
      pictures: pictures || [] // Use pictures from request since DB doesn't store it
    };
    
    console.log('Review created successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    console.log('=== GET ALL REVIEWS ENDPOINT HIT ===');
    
    const reviews = await fetchAllReviews();
    
    // Format response to match frontend expectations
    const responseData = reviews.map(review => ({
      id: review.review_id.toString(),
      review_id: review.review_id,
      entityId: review.item_id.toString(),
      userId: review.user_id.toString(),
      user_id: review.user_id,
      userName: review.user_name,
      title: review.title, // Use title from database
      body: review.review_text,
      rating: review.ratingpoint, // Use ratingpoint from DB
      createdAt: review.created_at,
      created_at: review.created_at,
      upvotes: 0, // Default since DB doesn't store it
      downvotes: 0, // Not supported in current schema
      pictures: [] // Default since DB doesn't store it
    }));
    
    console.log(`Found ${responseData.length} reviews`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReviewsByUser = async (req, res) => {
  try {
    console.log('=== GET REVIEWS BY USER ENDPOINT HIT ===');
    const { userId } = req.params;
    console.log('User ID:', userId);
    
    const reviews = await fetchReviewsByUserId(userId);
    
    // Format response to match frontend expectations
    const responseData = reviews.map(review => ({
      id: review.review_id.toString(),
      review_id: review.review_id,
      entityId: review.item_id.toString(),
      userId: review.user_id.toString(),
      user_id: review.user_id,
      userName: review.user_name,
      title: review.title, // Use title from database
      body: review.review_text,
      rating: review.ratingpoint, // Use ratingpoint from DB
      createdAt: review.created_at,
      created_at: review.created_at,
      upvotes: 0, // Default since DB doesn't store it
      downvotes: 0, // Not supported in current schema
      pictures: [] // Default since DB doesn't store it
    }));
    
    console.log(`Found ${responseData.length} reviews for user ${userId}`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReviewsByItem = async (req, res) => {
  try {
    console.log('=== GET REVIEWS BY ITEM ENDPOINT HIT ===');
    const { itemId } = req.params;
    console.log('Item ID:', itemId);
    
    const reviews = await fetchReviewsByItemId(itemId);
    
    // Format response to match frontend expectations
    const responseData = reviews.map(review => ({
      id: review.review_id.toString(),
      review_id: review.review_id,
      entityId: review.item_id.toString(),
      userId: review.user_id.toString(),
      user_id: review.user_id,
      userName: review.user_name,
      title: review.title, // Use title from database
      body: review.review_text,
      rating: review.ratingpoint, // Use ratingpoint from DB
      createdAt: review.created_at,
      created_at: review.created_at,
      upvotes: 0, // Default since DB doesn't store it
      downvotes: 0, // Not supported in current schema
      pictures: [] // Default since DB doesn't store it
    }));
    
    console.log(`Found ${responseData.length} reviews for item ${itemId}`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching item reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewsByUser,
  getReviewsByItem
};
