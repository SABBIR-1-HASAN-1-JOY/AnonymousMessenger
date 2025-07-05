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
    const result = await pool.query(`SELECT * FROM reviewable_entity`);
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
      pool.query(`SELECT * FROM reviewable_entity`)
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