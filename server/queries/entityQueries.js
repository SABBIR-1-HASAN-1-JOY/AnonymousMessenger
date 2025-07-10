const pool = require('../config/db.js');

// Get entity details by ID
const getEntityById = async (entityId) => {
  try {
    console.log('Querying entity with ID:', entityId);
    const result = await pool.query(`
      SELECT * FROM reviewable_entity
      WHERE item_id = $1
    `, [entityId]);
    
    console.log('Entity query result:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error in getEntityById:', error);
    throw error;
  }
};

// Get reviews for an entity
const getReviewsByEntityId = async (entityId) => {
  try {
    console.log('Querying reviews for entity ID:', entityId);
    const result = await pool.query(`
      SELECT 
        r.*, 
        u.username as username 
      FROM review r 
      JOIN "user" u ON r.user_id = u.user_id
      WHERE r.item_id = $1
      
    `, [entityId]);
    
    console.log('Reviews query result:', result.rows.length, 'reviews found');
    console.log('Reviews data:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error in getReviewsByEntityId:', error);
    throw error;
  }
};

// Get all entities

module.exports = {
  getEntityById,
  getReviewsByEntityId
};