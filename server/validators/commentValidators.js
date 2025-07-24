// validators/commentValidators.js
const Joi = require('joi');

// Validate comment creation
const validateCreateComment = (req, res, next) => {
  console.log('=== VALIDATING CREATE COMMENT REQUEST ===');
  console.log('Request body:', req.body);
  
  const schema = Joi.object({
    userId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value))
    ).required().messages({
      'any.required': 'User ID is required',
      'number.base': 'User ID must be a number',
      'number.positive': 'User ID must be positive'
    }),
    commentText: Joi.string().min(1).max(1000).required().messages({
      'any.required': 'Comment text is required',
      'string.empty': 'Comment text cannot be empty',
      'string.min': 'Comment text must be at least 1 character',
      'string.max': 'Comment text cannot exceed 1000 characters'
    }),
    entityType: Joi.string().valid('post', 'review', 'comment').required().messages({
      'any.required': 'Entity type is required',
      'any.only': 'Entity type must be one of: post, review, comment'
    }),
    entityId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value))
    ).required().messages({
      'any.required': 'Entity ID is required',
      'number.base': 'Entity ID must be a number',
      'number.positive': 'Entity ID must be positive'
    }),
    parentCommentId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value)),
      Joi.allow(null)
    ).optional().messages({
      'number.base': 'Parent comment ID must be a number',
      'number.positive': 'Parent comment ID must be positive'
    })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    console.log('Comment creation validation error:', error.details);
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  // Convert string numbers to integers
  req.body = {
    ...value,
    userId: parseInt(value.userId),
    entityId: parseInt(value.entityId),
    parentCommentId: value.parentCommentId ? parseInt(value.parentCommentId) : null
  };

  console.log('Comment creation validation passed');
  next();
};

// Validate comment ID parameter
const validateCommentIdParam = (req, res, next) => {
  console.log('=== VALIDATING COMMENT ID PARAMETER ===');
  console.log('Comment ID:', req.params.commentId);
  
  const schema = Joi.object({
    commentId: Joi.string().pattern(/^\d+$/).required().messages({
      'any.required': 'Comment ID is required',
      'string.pattern.base': 'Comment ID must be a valid number'
    })
  });

  const { error, value } = schema.validate(req.params);
  
  if (error) {
    console.log('Comment ID validation error:', error.details);
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  console.log('Comment ID validation passed');
  next();
};

// Validate get comments parameters
const validateGetComments = (req, res, next) => {
  console.log('=== VALIDATING GET COMMENTS REQUEST ===');
  console.log('Request params:', req.params);
  
  const schema = Joi.object({
    entityType: Joi.string().valid('post', 'review', 'comment').required().messages({
      'any.required': 'Entity type is required',
      'any.only': 'Entity type must be one of: post, review, comment'
    }),
    entityId: Joi.string().pattern(/^\d+$/).required().messages({
      'any.required': 'Entity ID is required',
      'string.pattern.base': 'Entity ID must be a valid number'
    })
  });

  const { error, value } = schema.validate(req.params);
  
  if (error) {
    console.log('Get comments validation error:', error.details);
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  console.log('Get comments validation passed');
  next();
};

// Validate update comment
const validateUpdateComment = (req, res, next) => {
  console.log('=== VALIDATING UPDATE COMMENT REQUEST ===');
  console.log('Request body:', req.body);
  
  const schema = Joi.object({
    commentText: Joi.string().min(1).max(1000).required().messages({
      'any.required': 'Comment text is required',
      'string.empty': 'Comment text cannot be empty',
      'string.min': 'Comment text must be at least 1 character',
      'string.max': 'Comment text cannot exceed 1000 characters'
    })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    console.log('Update comment validation error:', error.details);
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }

  console.log('Update comment validation passed');
  next();
};

module.exports = {
  validateCreateComment,
  validateCommentIdParam,
  validateGetComments,
  validateUpdateComment
};
