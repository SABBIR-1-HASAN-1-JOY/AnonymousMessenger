const express = require('express');
const {
  getAllCategories,
  getEntitiesByCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/categoryController');

const {
  validateCreateCategory,
  validateUpdateCategory,
  validateDeleteCategory,
  validateGetCategoryById,
  validateGetEntitiesByCategory
} = require('../validators/categoryValidators');

const router = express.Router();

// Get all categories (no validation needed)
router.get('/', getAllCategories);

// Get category statistics (no validation needed)
router.get('/stats', getCategoryStats);

// Get category by ID
router.get('/:categoryId/info', validateGetCategoryById, getCategoryById);

// Get entities by category ID
router.get('/:categoryId', validateGetEntitiesByCategory, getEntitiesByCategory);

// Create new category
router.post('/', validateCreateCategory, createCategory);

// Update category
router.put('/:categoryId', validateUpdateCategory, updateCategory);

// Delete category
router.delete('/:categoryId', validateDeleteCategory, deleteCategory);

module.exports = router;
