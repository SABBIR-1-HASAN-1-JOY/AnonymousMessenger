const Joi = require('joi');

// Validation schema for category ID parameter
const categoryIdSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID must be a number',
    'number.integer': 'Category ID must be an integer',
    'number.positive': 'Category ID must be a positive number',
    'any.required': 'Category ID is required'
  })
});

// Validation schema for sector ID parameter
const sectorIdSchema = Joi.object({
  sectorId: Joi.number().integer().positive().required().messages({
    'number.base': 'Sector ID must be a number',
    'number.integer': 'Sector ID must be an integer',
    'number.positive': 'Sector ID must be a positive number',
    'any.required': 'Sector ID is required'
  })
});

// Validation schema for creating a new category
const createCategorySchema = Joi.object({
  category_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Category name must be a string',
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name must be less than 100 characters',
      'any.required': 'Category name is required'
    }),
  sector_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Sector ID must be a number',
      'number.integer': 'Sector ID must be an integer',
      'number.positive': 'Sector ID must be a positive number',
      'any.required': 'Sector ID is required'
    }),
  parent_category_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Parent category ID must be a number',
      'number.integer': 'Parent category ID must be an integer',
      'number.positive': 'Parent category ID must be a positive number'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must be less than 500 characters'
    })
});

// Validation schema for updating a category
const updateCategorySchema = Joi.object({
  category_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Category name must be a string',
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name must be less than 100 characters',
      'any.required': 'Category name is required'
    }),
  sector_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Sector ID must be a number',
      'number.integer': 'Sector ID must be an integer',
      'number.positive': 'Sector ID must be a positive number',
      'any.required': 'Sector ID is required'
    }),
  parent_category_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Parent category ID must be a number',
      'number.integer': 'Parent category ID must be an integer',
      'number.positive': 'Parent category ID must be a positive number'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must be less than 500 characters'
    })
});

// Middleware to validate category ID parameter
const validateCategoryIdParam = (req, res, next) => {
  try {
    console.log('=== VALIDATING CATEGORY ID PARAMETER ===');
    console.log('Category ID:', req.params.categoryId);
    
    const { error, value } = categoryIdSchema.validate(req.params);
    
    if (error) {
      console.log('Category ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid category ID',
        details: error.details[0].message
      });
    }
    
    // Convert categoryId to number for consistency
    req.params.categoryId = parseInt(value.categoryId);
    console.log('Category ID validation passed');
    next();
  } catch (err) {
    console.error('Error in category ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate create category request body
const validateCreateCategory = (req, res, next) => {
  try {
    console.log('=== VALIDATING CREATE CATEGORY DATA ===');
    console.log('Request body:', req.body);
    
    const { error, value } = createCategorySchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('Create category validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    console.log('Create category validation passed');
    next();
  } catch (err) {
    console.error('Error in create category validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate update category request body
const validateUpdateCategory = (req, res, next) => {
  try {
    console.log('=== VALIDATING UPDATE CATEGORY DATA ===');
    console.log('Category ID:', req.params.categoryId);
    console.log('Request body:', req.body);
    
    // First validate the category ID
    const { error: paramError, value: paramValue } = categoryIdSchema.validate(req.params);
    
    if (paramError) {
      console.log('Category ID validation error:', paramError.details[0].message);
      return res.status(400).json({
        error: 'Invalid category ID',
        details: paramError.details[0].message
      });
    }
    
    // Then validate the request body
    const { error: bodyError, value: bodyValue } = updateCategorySchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (bodyError) {
      const errorMessages = bodyError.details.map(detail => detail.message);
      console.log('Update category validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request data with validated and sanitized data
    req.params.categoryId = parseInt(paramValue.categoryId);
    req.body = bodyValue;
    console.log('Update category validation passed');
    next();
  } catch (err) {
    console.error('Error in update category validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate delete category request
const validateDeleteCategory = (req, res, next) => {
  try {
    console.log('=== VALIDATING DELETE CATEGORY REQUEST ===');
    console.log('Category ID:', req.params.categoryId);
    
    const { error, value } = categoryIdSchema.validate(req.params);
    
    if (error) {
      console.log('Category ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid category ID',
        details: error.details[0].message
      });
    }
    
    // Convert categoryId to number for consistency
    req.params.categoryId = parseInt(value.categoryId);
    console.log('Delete category validation passed');
    next();
  } catch (err) {
    console.error('Error in delete category validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get category by ID request
const validateGetCategoryById = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET CATEGORY BY ID REQUEST ===');
    console.log('Category ID:', req.params.categoryId);
    
    const { error, value } = categoryIdSchema.validate(req.params);
    
    if (error) {
      console.log('Category ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid category ID',
        details: error.details[0].message
      });
    }
    
    // Convert categoryId to number for consistency
    req.params.categoryId = parseInt(value.categoryId);
    console.log('Get category by ID validation passed');
    next();
  } catch (err) {
    console.error('Error in get category by ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get entities by category request
const validateGetEntitiesByCategory = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET ENTITIES BY CATEGORY REQUEST ===');
    console.log('Category ID:', req.params.categoryId);
    
    const { error, value } = categoryIdSchema.validate(req.params);
    
    if (error) {
      console.log('Category ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid category ID',
        details: error.details[0].message
      });
    }
    
    // Convert categoryId to number for consistency
    req.params.categoryId = parseInt(value.categoryId);
    console.log('Get entities by category validation passed');
    next();
  } catch (err) {
    console.error('Error in get entities by category validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate sector ID parameter
const validateSectorIdParam = (req, res, next) => {
  try {
    console.log('=== VALIDATING SECTOR ID PARAMETER ===');
    console.log('Sector ID:', req.params.sectorId);
    
    const { error, value } = sectorIdSchema.validate(req.params);
    
    if (error) {
      console.log('Sector ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid sector ID',
        details: error.details[0].message
      });
    }
    
    // Convert sectorId to number for consistency
    req.params.sectorId = parseInt(value.sectorId);
    console.log('Sector ID validation passed');
    next();
  } catch (err) {
    console.error('Error in sector ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get categories by sector request
const validateGetCategoriesBySector = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET CATEGORIES BY SECTOR REQUEST ===');
    console.log('Sector ID:', req.params.sectorId);
    
    const { error, value } = sectorIdSchema.validate(req.params);
    
    if (error) {
      console.log('Sector ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid sector ID',
        details: error.details[0].message
      });
    }
    
    // Convert sectorId to number for consistency
    req.params.sectorId = parseInt(value.sectorId);
    console.log('Get categories by sector validation passed');
    next();
  } catch (err) {
    console.error('Error in get categories by sector validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

module.exports = {
  validateCategoryIdParam,
  validateCreateCategory,
  validateUpdateCategory,
  validateDeleteCategory,
  validateGetCategoryById,
  validateGetEntitiesByCategory,
  validateSectorIdParam,
  validateGetCategoriesBySector,
  // Export schemas for potential reuse
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
  sectorIdSchema
};
