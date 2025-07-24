// queries/userQueries.js
const pool = require('../config/db');

exports.getUserById = async (userId) => {
  const query = `SELECT * FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

exports.getFollowerCount = async (userId) => {
  const query = `SELECT COUNT(DISTINCT follower_id) FROM "user_follow" WHERE following_id = $1`;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
};

exports.getFollowingCount = async (userId) => {
  const query = `SELECT COUNT(DISTINCT following_id) FROM "user_follow" WHERE follower_id = $1`;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
};

//count 
exports.getReviewCount = async (userId) => 
{
  const query = `SELECT COUNT(*) FROM "review" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
};

exports.getPostCount = async (userId) => {
  const query = `SELECT COUNT(*) FROM "post" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
};

exports.getAllReviews=async(userId)=>{
  const query = `SELECT * FROM "review" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

exports.getAllPosts=async(userId)=>{
  const query = `SELECT post_id, user_id, post_text, created_at, is_rate_enabled, ratingpoint FROM "post" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

exports.updateUser = async (userId, userData) => {
  const { username, bio } = userData;
  const query = `
    UPDATE "user" 
    SET username = $1, bio = $2
    WHERE user_id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [username, bio, userId]);
  return result.rows[0];
};