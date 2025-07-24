// validators/photoValidators.js
const Joi = require('joi');

// Validation schema for photo upload
const photoUploadSchema = Joi.object({
  userId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
      return parseInt(value);
    })
  ).required().messages({
    'alternatives.match': 'User ID must be a positive integer',
    'any.required': 'User ID is required'
  }),
  type: Joi.string().valid('profile', 'reviews', 'entities').required().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be one of: profile, reviews, entities',
    'any.required': 'Type is required'
  }),
  typeId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
      return parseInt(value);
    })
  ).required().messages({
    'alternatives.match': 'Type ID must be a positive integer',
    'any.required': 'Type ID is required'
  }),
  isAdmin: Joi.string().valid('true', 'false').optional().messages({
    'string.base': 'isAdmin must be a string',
    'any.only': 'isAdmin must be "true" or "false"'
  })
});

// Validation schema for photo ID parameter
const photoIdSchema = Joi.object({
  photoId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
      return parseInt(value);
    })
  ).required().messages({
    'alternatives.match': 'Photo ID must be a positive integer',
    'any.required': 'Photo ID is required'
  })
});

// Validation schema for getting photos by type and source
const getPhotosSchema = Joi.object({
  type: Joi.string().valid('profile', 'reviews', 'entities').required().messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be one of: profile, reviews, entities',
    'any.required': 'Type is required'
  }),
  sourceId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
      return parseInt(value);
    })
  ).required().messages({
    'alternatives.match': 'Source ID must be a positive integer',
    'any.required': 'Source ID is required'
  })
});

// Validation schema for user ID parameter
const userIdSchema = Joi.object({
  userId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
      return parseInt(value);
    })
  ).required().messages({
    'alternatives.match': 'User ID must be a positive integer',
    'any.required': 'User ID is required'
  })
});

// Middleware to validate photo upload request
const validatePhotoUpload = (req, res, next) => {
  try {
    console.log('=== VALIDATING PHOTO UPLOAD REQUEST ===');
    console.log('Request body:', req.body);
    
    const { error, value } = photoUploadSchema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('Photo upload validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    console.log('Photo upload validation passed');
    next();
  } catch (err) {
    console.error('Error in photo upload validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate photo ID parameter
const validatePhotoIdParam = (req, res, next) => {
  try {
    console.log('=== VALIDATING PHOTO ID PARAMETER ===');
    console.log('Photo ID:', req.params.photoId);
    
    const { error, value } = photoIdSchema.validate(req.params);
    
    if (error) {
      console.log('Photo ID validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Invalid photo ID',
        details: error.details[0].message
      });
    }
    
    // Convert photoId to number for consistency
    req.params.photoId = parseInt(value.photoId);
    console.log('Photo ID validation passed');
    next();
  } catch (err) {
    console.error('Error in photo ID validation:', err);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
};

// Middleware to validate get photos request
const validateGetPhotos = (req, res, next) => {
  try {
    console.log('=== VALIDATING GET PHOTOS REQUEST ===');
    console.log('Request params:', req.params);
    
    const { error, value } = getPhotosSchema.validate(req.params);
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('Get photos validation errors:', errorMessages);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }
    
    // Replace request params with validated and sanitized data
    req.params = value;
    console.log('Get photos validation passed');
    next();
  } catch (err) {
    console.error('Error in get photos validation:', err);
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

module.exports = {
  validatePhotoUpload,
  validatePhotoIdParam,
  validateGetPhotos,
  validateUserIdParam,
  // Export schemas for potential reuse
  photoUploadSchema,
  photoIdSchema,
  getPhotosSchema,
  userIdSchema
};
