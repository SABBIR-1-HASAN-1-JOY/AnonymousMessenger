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

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { title, body, rating } = req.body;
    
    // Note: In a real application, you should verify the user owns this review
    // For now, we'll assume authorization is handled elsewhere
    
    const query = `
      UPDATE reviews 
      SET title = $1, review_text = $2, ratingpoint = $3, updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $4
      RETURNING *
    `;
    
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    
    const result = await pool.query(query, [title, body, rating, reviewId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }

    // First check if the review exists and belongs to the user
    const checkQuery = `
      SELECT user_id 
      FROM review 
      WHERE review_id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [reviewId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the user owns the review
    if (checkResult.rows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }
    
    // Delete the review
    const deleteQuery = `
      DELETE FROM review 
      WHERE review_id = $1 
      RETURNING review_id
    `;
    
    const result = await pool.query(deleteQuery, [reviewId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      reviewId: result.rows[0].review_id
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewsByUser,
  getReviewsByItem,
  updateReview,
  deleteReview
};
