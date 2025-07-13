const Joi = require('joi');

// Validation schema for user ID parameter
const userIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be a positive number',
    'any.required': 'User ID is required'
  })
});

// Validation schema for follower ID in request body
const followerIdSchema = Joi.object({
  followerId: Joi.number().integer().positive().required().messages({
    'number.base': 'Follower ID must be a number',
    'number.integer': 'Follower ID must be an integer',
    'number.positive': 'Follower ID must be a positive number',
    'any.required': 'Follower ID is required'
  })
});

// Validation schema for follower ID in query parameters
const followerIdQuerySchema = Joi.object({
  followerId: Joi.number().integer().positive().required().messages({
    'number.base': 'Follower ID must be a number',
    'number.integer': 'Follower ID must be an integer',
    'number.positive': 'Follower ID must be a positive number',
    'any.required': 'Follower ID is required'
  })
});

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

// Middleware to validate follow user request
const validateFollowUser = (req, res, next) => {
  try {
    console.log('=== VALIDATING FOLLOW USER REQUEST ===');
    console.log('User ID (to follow):', req.params.userId);
    console.log('Request body:', req.body);
    
    // Validate user ID parameter
    const { error: paramError, value: paramValue } = userIdSchema.validate(req.params);
    
    if (paramError) {
      console.log('User ID validation error:', paramError.details[0].message);
      return res.status(400).json({
        error: 'Invalid user ID',
        details: paramError.details[0].message
      });
    }
    
    // Validate follower ID in request body
    const { error: bodyError, value: bodyValue } = followerIdSchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (bodyError) {
      const errorMessages = bodyError.details.map(detail => detail.message);
      console.log('Follow user validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Check if user is trying to follow themselves
    const userId = parseInt(paramValue.userId);
    const followerId = parseInt(bodyValue.followerId);
    
    if (userId === followerId) {
      console.log('Self-follow attempt detected');
      return res.status(400).json({
        error: 'Cannot follow yourself'
      });
    }
    
    // Replace request data with validated and sanitized data
    req.params.userId = userId;
    req.body = { followerId };
    console.log('Follow user validation passed');
    next();
  } catch (err) {
    console.error('Error in follow user validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate unfollow user request
const validateUnfollowUser = (req, res, next) => {
  try {
    console.log('=== VALIDATING UNFOLLOW USER REQUEST ===');
    console.log('User ID (to unfollow):', req.params.userId);
    console.log('Request body:', req.body);
    
    // Validate user ID parameter
    const { error: paramError, value: paramValue } = userIdSchema.validate(req.params);
    
    if (paramError) {
      console.log('User ID validation error:', paramError.details[0].message);
      return res.status(400).json({
        error: 'Invalid user ID',
        details: paramError.details[0].message
      });
    }
    
    // Validate follower ID in request body
    const { error: bodyError, value: bodyValue } = followerIdSchema.validate(req.body, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (bodyError) {
      const errorMessages = bodyError.details.map(detail => detail.message);
      console.log('Unfollow user validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request data with validated and sanitized data
    req.params.userId = parseInt(paramValue.userId);
    req.body = { followerId: parseInt(bodyValue.followerId) };
    console.log('Unfollow user validation passed');
    next();
  } catch (err) {
    console.error('Error in unfollow user validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate check follow status request
const validateCheckFollowStatus = (req, res, next) => {
  try {
    console.log('=== VALIDATING CHECK FOLLOW STATUS REQUEST ===');
    console.log('User ID (being checked):', req.params.userId);
    console.log('Query parameters:', req.query);
    
    // Validate user ID parameter
    const { error: paramError, value: paramValue } = userIdSchema.validate(req.params);
    
    if (paramError) {
      console.log('User ID validation error:', paramError.details[0].message);
      return res.status(400).json({
        error: 'Invalid user ID',
        details: paramError.details[0].message
      });
    }
    
    // Validate follower ID in query parameters
    const { error: queryError, value: queryValue } = followerIdQuerySchema.validate(req.query, {
      stripUnknown: true, // Remove unknown fields
      abortEarly: false   // Return all validation errors
    });
    
    if (queryError) {
      const errorMessages = queryError.details.map(detail => detail.message);
      console.log('Check follow status validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request data with validated and sanitized data
    req.params.userId = parseInt(paramValue.userId);
    req.query = { followerId: parseInt(queryValue.followerId) };
    console.log('Check follow status validation passed');
    next();
  } catch (err) {
    console.error('Error in check follow status validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get user followers request
const validateGetUserFollowers = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET USER FOLLOWERS REQUEST ===');
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
    console.log('Get user followers validation passed');
    next();
  } catch (err) {
    console.error('Error in get user followers validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get user following request
const validateGetUserFollowing = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET USER FOLLOWING REQUEST ===');
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
    console.log('Get user following validation passed');
    next();
  } catch (err) {
    console.error('Error in get user following validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

module.exports = {
  validateUserIdParam,
  validateFollowUser,
  validateUnfollowUser,
  validateCheckFollowStatus,
  validateGetUserFollowers,
  validateGetUserFollowing,
  // Export schemas for potential reuse
  userIdSchema,
  followerIdSchema,
  followerIdQuerySchema
};
