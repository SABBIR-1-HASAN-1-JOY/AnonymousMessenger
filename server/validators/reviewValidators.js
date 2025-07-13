const Joi = require('joi');

// Validation schema for creating a review
const createReviewSchema = Joi.object({
  userId: Joi.alternatives().try(
    Joi.string().min(1),
    Joi.number().integer().positive()
  ).required()
    .messages({
      'any.required': 'User ID is required',
      'string.min': 'User ID must not be empty',
      'number.positive': 'User ID must be a positive number'
    }),
    
  itemId: Joi.alternatives().try(
    Joi.string().min(1),
    Joi.number().integer().positive()
  ).required()
    .messages({
      'any.required': 'Item ID is required',
      'string.min': 'Item ID must not be empty',
      'number.positive': 'Item ID must be a positive number'
    }),
    
  title: Joi.string().min(1).max(200).required()
    .messages({
      'any.required': 'Review title is required',
      'string.min': 'Review title must not be empty',
      'string.max': 'Review title must not exceed 200 characters'
    }),
    
  reviewText: Joi.string().min(10).max(2000).required()
    .messages({
      'any.required': 'Review text is required',
      'string.min': 'Review text must be at least 10 characters long',
      'string.max': 'Review text must not exceed 2000 characters'
    }),
    
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({
      'any.required': 'Rating is required',
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5'
    })
});

// Validation schema for user ID parameter
const userIdParamSchema = Joi.object({
  userId: Joi.alternatives().try(
    Joi.string().min(1),
    Joi.number().integer().positive()
  ).required()
    .messages({
      'any.required': 'User ID parameter is required',
      'string.min': 'User ID must not be empty',
      'number.positive': 'User ID must be a positive number'
    })
});

// Validation schema for item ID parameter
const itemIdParamSchema = Joi.object({
  itemId: Joi.alternatives().try(
    Joi.string().min(1),
    Joi.number().integer().positive()
  ).required()
    .messages({
      'any.required': 'Item ID parameter is required',
      'string.min': 'Item ID must not be empty',
      'number.positive': 'Item ID must be a positive number'
    })
});

// Middleware functions for validation
const validateCreateReview = (req, res, next) => {
  const { error } = createReviewSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateUserIdParam = (req, res, next) => {
  const { error } = userIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      error: 'Invalid user ID parameter',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateItemIdParam = (req, res, next) => {
  const { error } = itemIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      error: 'Invalid item ID parameter',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateCreateReview,
  validateUserIdParam,
  validateItemIdParam,
  createReviewSchema,
  userIdParamSchema,
  itemIdParamSchema
};
