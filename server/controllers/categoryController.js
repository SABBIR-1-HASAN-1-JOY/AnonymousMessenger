const pool = require('../config/db.js');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    console.log('=== GET ALL CATEGORIES ENDPOINT HIT ===');
    
    const result = await pool.query('SELECT * FROM category ORDER BY category_name');
    
    console.log(`Found ${result.rows.length} categories`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching categories:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get entities by category ID
const getEntitiesByCategory = async (req, res) => {
  try {
    console.log('=== GET ENTITIES BY CATEGORY ENDPOINT HIT ===');
    const { categoryId } = req.params;
    
    console.log('Fetching entities for category ID:', categoryId);
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const entities = await pool.query(
      `SELECT 
        re.*,
        c.category_name as category,
        latest_photo.photo_name as entity_photo_name,
        CASE 
          WHEN latest_photo.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', latest_photo.photo_name)
          ELSE re.picture
        END as picture
      FROM reviewable_entity re 
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN (
        SELECT DISTINCT ON (source_id) 
          source_id, 
          photo_name 
        FROM photos 
        WHERE type = 'entities' 
        ORDER BY source_id, upload_date DESC
      ) latest_photo ON latest_photo.source_id = re.item_id
      WHERE re.category_id = $1 
      ORDER BY re.item_name`,
      [categoryId]
    );

    console.log(`Found ${entities.rows.length} entities for category ${categoryId}`);
    res.json(entities.rows);
  } catch (err) {
    console.error("Error fetching entities by category:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    console.log('=== GET CATEGORY BY ID ENDPOINT HIT ===');
    const { categoryId } = req.params;
    
    console.log('Fetching category with ID:', categoryId);
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const result = await pool.query(
      'SELECT * FROM category WHERE category_id = $1',
      [categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.log('Category found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching category by ID:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    console.log('=== CREATE CATEGORY ENDPOINT HIT ===');
    const { category_name, description } = req.body;
    
    console.log('Creating category:', { category_name, description });
    
    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await pool.query(
      'SELECT * FROM category WHERE LOWER(category_name) = LOWER($1)',
      [category_name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const result = await pool.query(
      `INSERT INTO category (category_name, description, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [category_name, description || null]
    );

    console.log('Category created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating category:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    console.log('=== UPDATE CATEGORY ENDPOINT HIT ===');
    const { categoryId } = req.params;
    const { category_name, description } = req.body;
    
    console.log('Updating category:', { categoryId, category_name, description });
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT * FROM category WHERE category_id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with existing category (excluding current one)
    const conflictingCategory = await pool.query(
      'SELECT * FROM category WHERE LOWER(category_name) = LOWER($1) AND category_id != $2',
      [category_name, categoryId]
    );

    if (conflictingCategory.rows.length > 0) {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    const result = await pool.query(
      `UPDATE category 
       SET category_name = $1, description = $2, updated_at = NOW()
       WHERE category_id = $3
       RETURNING *`,
      [category_name, description || null, categoryId]
    );

    console.log('Category updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating category:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    console.log('=== DELETE CATEGORY ENDPOINT HIT ===');
    const { categoryId } = req.params;
    
    console.log('Deleting category with ID:', categoryId);
    
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT * FROM category WHERE category_id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has associated entities
    const entitiesCount = await pool.query(
      'SELECT COUNT(*) FROM reviewable_entity WHERE category_id = $1',
      [categoryId]
    );

    if (parseInt(entitiesCount.rows[0].count) > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category with associated entities',
        entityCount: parseInt(entitiesCount.rows[0].count)
      });
    }

    const result = await pool.query(
      'DELETE FROM category WHERE category_id = $1 RETURNING *',
      [categoryId]
    );

    console.log('Category deleted successfully:', result.rows[0]);
    res.json({ 
      message: 'Category deleted successfully',
      deletedCategory: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting category:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
  try {
    console.log('=== GET CATEGORY STATISTICS ENDPOINT HIT ===');
    
    const stats = await pool.query(`
      SELECT 
        c.category_id,
        c.category_name,
        COUNT(re.item_id) as entity_count,
        COUNT(r.review_id) as review_count,
        COALESCE(AVG(r.ratingpoint), 0) as avg_rating
      FROM category c
      LEFT JOIN reviewable_entity re ON c.category_id = re.category_id
      LEFT JOIN review r ON re.item_id = r.item_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_name
    `);

    console.log(`Generated statistics for ${stats.rows.length} categories`);
    res.json(stats.rows);
  } catch (err) {
    console.error("Error fetching category statistics:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllCategories,
  getEntitiesByCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
};
