// queries/searchQueries.js
const pool = require('../config/db.js');

// Search entities in reviewable_entity table
const searchEntities = async (query) => {
  try {
    const result = await pool.query(`
      SELECT 
        re.item_id,
        re.item_name,
        re.description,
        c.category_name,
        re.picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      WHERE 
        LOWER(re.item_name) LIKE LOWER($1)
      ORDER BY re.item_name
      LIMIT 20
    `, [`%${query}%`]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in searchEntities:', error);
    throw error;
  }
};

// Search users in user table
const searchUsers = async (query) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.username
      FROM "user" u
      WHERE 
        LOWER(u.username) LIKE LOWER($1)
      ORDER BY u.username
      LIMIT 20
    `, [`%${query}%`]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    throw error;
  }
};

// Combined search function
const searchAll = async (query) => {
  try {
    const [entities, users] = await Promise.all([
      searchEntities(query),
      searchUsers(query)
    ]);
    
    return {
      entities,
      users,
      total: entities.length + users.length
    };
  } catch (error) {
    console.error('Error in searchAll:', error);
    throw error;
  }
};

module.exports = {
  searchEntities,
  searchUsers,
  searchAll
};
