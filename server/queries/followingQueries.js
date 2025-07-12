// queries/followingQueries.js
const pool = require('../config/db.js');

// Follow a user
const followUser = async (followerId, followingId) => {
  try {
    // Check if already following
    const existingFollow = await pool.query(`
      SELECT * FROM user_follow 
      WHERE follower_id = $1 AND following_id = $2
    `, [followerId, followingId]);
    
    if (existingFollow.rows.length > 0) {
      throw new Error('Already following this user');
    }
    
    const result = await pool.query(`
      INSERT INTO user_follow (follower_id, following_id, followed_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [followerId, followingId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in followUser:', error);
    throw error;
  }
};

// Unfollow a user
const unfollowUser = async (followerId, followingId) => {
  try {
    const result = await pool.query(`
      DELETE FROM user_follow 
      WHERE follower_id = $1 AND following_id = $2
      RETURNING *
    `, [followerId, followingId]);
    
    if (result.rows.length === 0) {
      throw new Error('Not following this user');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    throw error;
  }
};

// Check if user is following another user
const isFollowing = async (followerId, followingId) => {
  try {
    const result = await pool.query(`
      SELECT * FROM user_follow 
      WHERE follower_id = $1 AND following_id = $2
    `, [followerId, followingId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error in isFollowing:', error);
    throw error;
  }
};

// Get user's followers
const getFollowers = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.profile_picture,
        u.bio,
        f.followed_at
      FROM user_follow f
      JOIN "user" u ON f.follower_id = u.user_id
      WHERE f.following_id = $1
      ORDER BY f.followed_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getFollowers:', error);
    throw error;
  }
};

// Get users that a user is following
const getFollowing = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.username,
        u.profile_picture,
        u.bio,
        f.followed_at
      FROM user_follow f
      JOIN "user" u ON f.following_id = u.user_id
      WHERE f.follower_id = $1
      ORDER BY f.followed_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getFollowing:', error);
    throw error;
  }
};

module.exports = {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing
};
