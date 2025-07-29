const pool = require('../config/db.js');

// Get entity details by ID
const getEntityById = async (entityId) => {
  try {
    console.log('Querying entity with ID:', entityId);
    const result = await pool.query(`
      SELECT 
        re.*,
        c.category_name,
        s.sector_name,
        COALESCE(ROUND(AVG(r.ratingpoint), 2), 0) as average_rating,
        COALESCE(COUNT(r.review_id), 0) as review_count,
        latest_photo.photo_name as entity_photo_name,
        CASE 
          WHEN latest_photo.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', latest_photo.photo_name)
          ELSE re.picture
        END as picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN sector s ON c.sector_id = s.sector_id
      LEFT JOIN review r ON re.item_id = r.item_id
      LEFT JOIN (
        SELECT DISTINCT ON (source_id) 
          source_id, 
          photo_name 
        FROM photos 
        WHERE type = 'entities' 
        ORDER BY source_id, upload_date DESC
      ) latest_photo ON latest_photo.source_id = re.item_id
      WHERE re.item_id = $1
      GROUP BY re.item_id, c.category_name, s.sector_name, latest_photo.photo_name, re.picture
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
        u.username as username,
        r.ratingpoint as rating,
        ph.photo_name as user_profile_picture
      FROM review r 
      JOIN "user" u ON r.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE r.item_id = $1
      ORDER BY r.created_at DESC
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

// Get category_id by category name
const getCategoryIdByName = async (categoryName) => {
  try {
    console.log('Getting category_id for category:', categoryName);
    const result = await pool.query(
      'SELECT category_id FROM category WHERE category_name = $1',
      [categoryName]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Category '${categoryName}' not found`);
    }
    
    console.log('Found category_id:', result.rows[0].category_id);
    return result.rows[0].category_id;
  } catch (error) {
    console.error('Error in getCategoryIdByName:', error);
    throw error;
  }
};

// Insert new entity into reviewable_entity
const insertEntity = async ({ category_id, item_name, owner_id, description, picture }) => {
  // make the owner_id default to 1
  try {
    const result = await pool.query(
      `INSERT INTO reviewable_entity (category_id, item_name, owner_id, description, picture)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [category_id, item_name, 1, description, picture]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in insertEntity:', error);
    throw error;
  }
};

// Get all entities
// ...existing code...
module.exports = {
  getEntityById,
  getReviewsByEntityId,
  insertEntity,
  getCategoryIdByName
};