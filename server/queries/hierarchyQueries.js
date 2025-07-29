const pool = require('../config/db.js');

// Get all sectors
const getAllSectors = async () => {
  try {
    const result = await pool.query(`SELECT * FROM sector`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get all categories
const getAllCategories = async () => {
  try {
    const result = await pool.query(`SELECT * FROM category`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get all entities
const getAllEntities = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        re.*,
        c.category_name as category,
        ph.photo_name as entity_photo_name,
        CASE 
          WHEN ph.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', ph.photo_name)
          ELSE re.picture
        END as picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN photos ph ON ph.source_id = re.item_id AND ph.type = 'entities'
      ORDER BY re.item_name
    `);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get complete hierarchy data (all tables at once)
const getHierarchyData = async () => {
  try {
    const [sectorResult, categoryResult, entityResult] = await Promise.all([
      pool.query(`SELECT * FROM sector`),
      pool.query(`SELECT * FROM category`),
      pool.query(`
        SELECT 
          re.*,
          c.category_name as category,
          ph.photo_name as entity_photo_name,
          CASE 
            WHEN ph.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', ph.photo_name)
            ELSE re.picture
          END as picture
        FROM reviewable_entity re
        LEFT JOIN category c ON re.category_id = c.category_id
        LEFT JOIN photos ph ON ph.source_id = re.item_id AND ph.type = 'entities'
        ORDER BY re.item_name
      `)
    ]);

    return {
      sectors: sectorResult.rows,
      categories: categoryResult.rows,
      entities: entityResult.rows
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllSectors,
  getAllCategories,
  getAllEntities,
  getHierarchyData
};