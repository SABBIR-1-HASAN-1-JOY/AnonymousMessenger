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
    
    const { userId, itemId, rating, reviewText, title, user_id, item_id, ratingpoint, review_text, review_title } = req.body;
    console.log('Review data:', { userId, itemId, rating, reviewText, title });
    // Validate required fields - support both naming conventions
    const finalUserId = userId || user_id;
    const finalItemId = itemId || item_id;
    const finalRating = rating || ratingpoint;
    const finalReviewText = reviewText || review_text;
    const finalTitle = title || review_title;

    if (!finalUserId || !finalItemId || !finalRating || !finalReviewText) {
      return res.status(400).json({ error: 'User ID, item ID, rating, and review text are required' });
    }
    
    if (finalRating < 1 || finalRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const reviewData = {
      userId: finalUserId,
      itemId: finalItemId,
      rating: finalRating,
      reviewText: finalReviewText,
      title: finalTitle || 'Review'
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
      upvotes: 0, // Default since DB doesn't store it
      downvotes: 0, // Not supported in current schema
      pictures: [] // Default since DB doesn't store it
    };
    
    console.log('Review created successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle duplicate review constraint
    if (error.code === '23505' && error.constraint === 'review_user_id_item_id_key') {
      return res.status(400).json({ 
        error: 'You have already reviewed this item. Each user can only review an item once.' 
      });
    }
    
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
