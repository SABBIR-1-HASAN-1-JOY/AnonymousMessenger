// queries/postRatingQueries.js
const { Pool } = require('pg');

// Add or update a rating for a post
const upsertPostRating = async (pool, postId, userId, rating) => {
  try {
    const query = `
      INSERT INTO post_ratings (post_id, user_id, rating, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, post_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [postId, userId, rating]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in upsertPostRating:', error);
    throw error;
  }
};

// Get user's rating for a specific post
const getUserPostRating = async (pool, postId, userId) => {
  try {
    const query = `
      SELECT rating, created_at, updated_at 
      FROM post_ratings 
      WHERE post_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [postId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getUserPostRating:', error);
    throw error;
  }
};

// Get all ratings for a post with statistics
const getPostRatingStats = async (pool, postId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_ratings,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star
      FROM post_ratings 
      WHERE post_id = $1
    `;
    
    const result = await pool.query(query, [postId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in getPostRatingStats:', error);
    throw error;
  }
};

// Get recent ratings for a post
const getRecentPostRatings = async (pool, postId, limit = 10) => {
  try {
    const query = `
      SELECT 
        pr.rating,
        pr.created_at,
        pr.updated_at,
        u.username,
        u.user_id
      FROM post_ratings pr
      JOIN "user" u ON pr.user_id = u.user_id
      WHERE pr.post_id = $1
      ORDER BY pr.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [postId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error in getRecentPostRatings:', error);
    throw error;
  }
};

// Delete a user's rating for a post
const deletePostRating = async (pool, postId, userId) => {
  try {
    const query = `
      DELETE FROM post_ratings 
      WHERE post_id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [postId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in deletePostRating:', error);
    throw error;
  }
};

// Get top rated posts
const getTopRatedPosts = async (pool, limit = 10, minRatings = 3) => {
  try {
    const query = `
      SELECT 
        p.*,
        u.username,
        p.average_rating,
        p.total_ratings,
        ph.photo_name as user_profile_picture
      FROM post p
      JOIN "user" u ON p.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE p.is_rate_enabled = true 
        AND p.total_ratings >= $2
        AND p.average_rating IS NOT NULL
      ORDER BY p.average_rating DESC, p.total_ratings DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit, minRatings]);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopRatedPosts:', error);
    throw error;
  }
};

module.exports = {
  upsertPostRating,
  getUserPostRating,
  getPostRatingStats,
  getRecentPostRatings,
  deletePostRating,
  getTopRatedPosts
};
