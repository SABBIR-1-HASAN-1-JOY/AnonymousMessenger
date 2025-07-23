// queries/postQueries.js
const pool = require('../config/db.js');

// Create a new post
const createPost = async (postData) => {
  try {
    const { userId, content, is_rated_enabled } = postData;
    
    const result = await pool.query(`
      INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [userId, content, is_rated_enabled]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
};

// Get all posts
const getAllPosts = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.post_text,
        p.is_rate_enabled,
        p.ratingpoint,
        p.created_at,
        u.username as user_name
      FROM post p
      JOIN "user" u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    throw error;
  }
};

// Get posts by user ID
const getPostsByUserId = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.post_text,
        p.is_rate_enabled,
        p.ratingpoint,
        p.created_at,
        u.username as user_name
      FROM post p
      JOIN "user" u ON p.user_id = u.user_id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getPostsByUserId:', error);
    throw error;
  }
};

// Note: Voting functionality would require additional tables (post_votes, etc.)
// since upvotes/downvotes columns don't exist in the current post table
// This function is kept for potential future implementation
const updatePostVotes = async (postId, voteType) => {
  try {
    // For now, just return the post without updating votes
    // In a real implementation, this would update a separate votes table
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.post_text,
        p.is_rate_enabled,
        p.created_at
      FROM post p
      WHERE p.post_id = $1
    `, [postId]);
    
    console.log(`Vote ${voteType} recorded for post ${postId} (not persisted - requires additional table)`);
    return result.rows[0];
  } catch (error) {
    console.error('Error in updatePostVotes:', error);
    throw error;
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostsByUserId,
  updatePostVotes
};
