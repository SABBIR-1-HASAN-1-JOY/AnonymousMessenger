// queries/followingQueries.js
const pool = require('../config/db.js');

// Follow a user
const followUser = async (followerId, followedId) => {
  try {
    // Check if already following
    const existingFollow = await pool.query(`
      SELECT * FROM following 
      WHERE follower_id = $1 AND followed_id = $2
    `, [followerId, followedId]);
    
    if (existingFollow.rows.length > 0) {
      throw new Error('Already following this user');
    }
    
    const result = await pool.query(`
      INSERT INTO following (follower_id, followed_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [followerId, followedId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in followUser:', error);
    throw error;
  }
};

// Unfollow a user
const unfollowUser = async (followerId, followedId) => {
  try {
    const result = await pool.query(`
      DELETE FROM following 
      WHERE follower_id = $1 AND followed_id = $2
      RETURNING *
    `, [followerId, followedId]);
    
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
const isFollowing = async (followerId, followedId) => {
  try {
    const result = await pool.query(`
      SELECT * FROM following 
      WHERE follower_id = $1 AND followed_id = $2
    `, [followerId, followedId]);
    
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
        f.created_at as followed_at
      FROM following f
      JOIN "user" u ON f.follower_id = u.user_id
      WHERE f.followed_id = $1
      ORDER BY f.created_at DESC
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
        f.created_at as followed_at
      FROM following f
      JOIN "user" u ON f.followed_id = u.user_id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
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
