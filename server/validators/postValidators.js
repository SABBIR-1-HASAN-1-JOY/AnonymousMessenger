const Joi = require('joi');

// Validation schema for post ID parameter
const postIdSchema = Joi.object({
  postId: Joi.number().integer().positive().required().messages({
    'number.base': 'Post ID must be a number',
    'number.integer': 'Post ID must be an integer',
    'number.positive': 'Post ID must be a positive number',
    'any.required': 'Post ID is required'
  })
});

// Validation schema for user ID parameter
const userIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be a positive number',
    'any.required': 'User ID is required'
  })
});

// Validation schema for creating a new post
const createPostSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be a positive number',
    'any.required': 'User ID is required'
  }),
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.base': 'Post content must be a string',
      'string.empty': 'Post content cannot be empty',
      'string.min': 'Post content must be at least 1 character long',
      'string.max': 'Post content must be less than 5000 characters',
      'any.required': 'Post content is required'
    }),
  is_rate_enabled: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'is_rate_enabled must be a boolean'
    }),
  image_url: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Image URL must be a string',
      'string.uri': 'Image URL must be a valid URI'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .max(10)
    .allow(null)
    .optional()
    .messages({
      'array.base': 'Tags must be an array',
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Each tag must be at least 1 character long',
      'string.max': 'Each tag must be less than 50 characters'
    })
});

// Validation schema for voting on a post
const votePostSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be a positive number',
    'any.required': 'User ID is required'
  }),
  vote_type: Joi.string()
    .valid('up', 'down')
    .required()
    .messages({
      'string.base': 'Vote type must be a string',
      'any.only': 'Vote type must be either "up" or "down"',
      'any.required': 'Vote type is required'
    })
});

// Middleware to validate post ID parameter
const validatePostIdParam = (req, res, next) => {
  try {
    console.log('=== VALIDATING POST ID PARAMETER ===');
    console.log('Post ID:', req.params.postId);
    
    const { error, value } = postIdSchema.validate(req.params);
    
    if (error) {
      console.log('Post ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid post ID',
        details: error.details[0].message
      });
    }
    
    // Convert postId to number for consistency
    req.params.postId = parseInt(value.postId);
    console.log('Post ID validation passed');
    next();
  } catch (err) {
    console.error('Error in post ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate user ID parameter
const validateUserIdParam = (req, res, next) => {
  try {
    console.log('=== VALIDATING USER ID PARAMETER ===');
    console.log('User ID:', req.params.userId);
    
    const { error, value } = userIdSchema.validate(req.params);
    
    if (error) {
      console.log('User ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid user ID',
        details: error.details[0].message
      });
    }
    
    // Convert userId to number for consistency
    req.params.userId = parseInt(value.userId);
    console.log('User ID validation passed');
    next();
  } catch (err) {
    console.error('Error in user ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate create post request
const validateCreatePost = (req, res, next) => {
  try {
    console.log('=== VALIDATING CREATE POST REQUEST ===');
    console.log('Request body:', req.body);
    
    const { error, value } = createPostSchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('Create post validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    console.log('Create post validation passed');
    next();
  } catch (err) {
    console.error('Error in create post validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate vote post request
const validateVotePost = (req, res, next) => {
  try {
    console.log('=== VALIDATING VOTE POST REQUEST ===');
    console.log('Post ID:', req.params.postId);
    console.log('Request body:', req.body);
    
    // First validate the post ID
    const { error: paramError, value: paramValue } = postIdSchema.validate(req.params);
    
    if (paramError) {
      console.log('Post ID validation error:', paramError.details[0].message);
      return res.status(400).json({
        error: 'Invalid post ID',
        details: paramError.details[0].message
      });
    }
    
    // Then validate the vote data
    const { error: bodyError, value: bodyValue } = votePostSchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (bodyError) {
      const errorMessages = bodyError.details.map(detail => detail.message);
      console.log('Vote post validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request data with validated and sanitized data
    req.params.postId = parseInt(paramValue.postId);
    req.body = bodyValue;
    console.log('Vote post validation passed');
    next();
  } catch (err) {
    console.error('Error in vote post validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get posts by user request
const validateGetPostsByUser = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET POSTS BY USER REQUEST ===');
    console.log('User ID:', req.params.userId);
    
    const { error, value } = userIdSchema.validate(req.params);
    
    if (error) {
      console.log('User ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid user ID',
        details: error.details[0].message
      });
    }
    
    // Convert userId to number for consistency
    req.params.userId = parseInt(value.userId);
    console.log('Get posts by user validation passed');
    next();
  } catch (err) {
    console.error('Error in get posts by user validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware for query parameter validation (pagination, sorting, etc.)
const validateGetAllPostsQuery = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET ALL POSTS QUERY PARAMETERS ===');
    console.log('Query parameters:', req.query);
    
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must be at most 100'
      }),
      sort: Joi.string().valid('newest', 'oldest', 'popular').default('newest').messages({
        'string.base': 'Sort must be a string',
        'any.only': 'Sort must be one of: newest, oldest, popular'
      }),
      user_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be a positive number'
      }),
      tag: Joi.string().trim().min(1).max(50).optional().messages({
        'string.base': 'Tag must be a string',
        'string.min': 'Tag must be at least 1 character long',
        'string.max': 'Tag must be less than 50 characters'
      })
    });
    
    const { error, value } = querySchema.validate(req.query, {
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('Get all posts query validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: errorMessages
      });
    }
    
    // Replace query parameters with validated and sanitized data
    req.query = value;
    console.log('Get all posts query validation passed');
    next();
  } catch (err) {
    console.error('Error in get all posts query validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

module.exports = {
  validatePostIdParam,
  validateUserIdParam,
  validateCreatePost,
  validateVotePost,
  validateGetPostsByUser,
  validateGetAllPostsQuery,
  // Export schemas for potential reuse
  postIdSchema,
  userIdSchema,
  createPostSchema,
  votePostSchema
};
