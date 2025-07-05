// validators/hierarchyValidators.js
const Joi = require('joi');

// Basic validation for hierarchy endpoint (currently no parameters needed)
const validateHierarchyQuery = (req, res, next) => {
  // No validation needed for simple GET /hierarchy request
  next();
};

// Schema for optional query parameters (for future use)
const hierarchyQuerySchema = Joi.object({
  includeEmpty: Joi.boolean().optional(),
  sectorId: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().positive().max(1000).optional()
}).unknown(false); // Don't allow unknown query parameters

// Comprehensive query parameter validation (for future features)
const validateHierarchyQueryParams = (req, res, next) => {
  const { error } = hierarchyQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateHierarchyQuery,
  validateHierarchyQueryParams
};