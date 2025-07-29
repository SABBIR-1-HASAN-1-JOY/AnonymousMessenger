// queries/reviewQueries.js
const pool = require('../config/db.js');

// Create a new review
const createReview = async (reviewData) => {
  try {
    const { userId, itemId, rating, reviewText,title } = reviewData;
    console.log('Creating new review with data:', { userId, itemId, rating, reviewText,title });

    // Check if the required fields exist
    if (!userId || !itemId || !rating || !reviewText) {
      throw new Error('Missing required fields for review creation');
    }
    
    console.log('About to execute SQL query...');
    const result = await pool.query(`
      INSERT INTO review (user_id, item_id, ratingpoint, review_text,title, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING review_id, user_id, item_id, ratingpoint, review_text, title, created_at
    `, [userId, itemId, rating, reviewText,title]);
    
    // Get the created review with user information
    const reviewWithUser = await pool.query(`
      SELECT 
        r.review_id,
        r.user_id,
        r.item_id,
        r.ratingpoint,
        r.review_text,
        r.title,
        r.created_at,
        u.username as user_name,
        ph.photo_name as user_profile_picture
      FROM review r
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE r.review_id = $1
    `, [result.rows[0].review_id]);
    
    console.log('Review created successfully with user info:', reviewWithUser.rows[0]);
    return reviewWithUser.rows[0];
  } catch (error) {
    console.error('Error in createReview:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      position: error.position
    });
    throw error;
  }
};

// Get all reviews
const getAllReviews = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        r.review_id,
        r.user_id,
        r.item_id,
        r.ratingpoint,
        r.review_text,
        r.title,
        r.created_at,
        u.username as user_name,
        ph.photo_name as user_profile_picture
      FROM review r
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      ORDER BY r.created_at DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    throw error;
  }
};

// Get reviews by user ID
const getReviewsByUserId = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.review_id,
        r.user_id,
        r.item_id,
        r.ratingpoint,
        r.review_text,
        r.title,
        r.created_at,
        u.username as user_name,
        ph.photo_name as user_profile_picture
      FROM review r
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getReviewsByUserId:', error);
    throw error;
  }
};

// Get reviews by entity/item ID
const getReviewsByItemId = async (itemId) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.review_id,
        r.user_id,
        r.item_id,
        r.ratingpoint,
        r.review_text,
        r.title,
        r.created_at,
        u.username as user_name,
        ph.photo_name as user_profile_picture
      FROM review r
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE r.item_id = $1
      ORDER BY r.created_at DESC
    `, [itemId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getReviewsByItemId:', error);
    throw error;
  }
};

// Get a specific review by ID
const getReviewById = async (reviewId) => {
  try {
    console.log('Fetching review by ID:', reviewId);
    
    const result = await pool.query(`
      SELECT 
        r.review_id,
        r.user_id,
        r.item_id,
        r.ratingpoint,
        r.review_text,
        r.title,
        r.created_at,
        u.username as user_name,
        ph.photo_name as user_profile_picture,
        re.item_name as item_name
      FROM review r
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      LEFT JOIN reviewable_entity re ON r.item_id = re.item_id
      WHERE r.review_id = $1
    `, [reviewId]);
    
    console.log(`Found ${result.rows.length} review(s) for ID ${reviewId}`);
    return result.rows[0]; // Return single review or undefined
  } catch (error) {
    console.error('Error in getReviewById:', error);
    throw error;
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewsByUserId,
  getReviewsByItemId,
  getReviewById
};
