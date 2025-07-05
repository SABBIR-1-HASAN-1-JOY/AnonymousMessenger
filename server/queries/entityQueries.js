const pool = require('../config/db.js');

// Get entity details by ID
const getEntityById = async (entityId) => {
  try {
    const result = await pool.query(`SELECT * FROM reviewable_entity WHERE item_id = $1`, [entityId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get reviews for an entity
const getReviewsByEntityId = async (entityId) => {
  try {
    const result = await pool.query(`SELECT * FROM review WHERE item_id = $1`, [entityId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getEntityById,
  getReviewsByEntityId
};