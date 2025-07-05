// queries/userQueries.js
const pool = require('../config/db');

exports.getUserById = async (userId) => {
  const query = `SELECT * FROM "USER" WHERE user_id = $1`;
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
