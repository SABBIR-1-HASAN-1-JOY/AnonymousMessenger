// validators/entityValidators.js
const Joi = require('joi');

const entityIdParamSchema = Joi.object({
  entityId: Joi.number().integer().positive().required()
});

const validateEntityIdParam = (req, res, next) => {
  console.log('=== ENTITY VALIDATOR HIT ===');
  console.log('Validating entity ID param:', req.params);
  console.log('entityId value:', req.params.entityId, 'type:', typeof req.params.entityId);
  
  const { error } = entityIdParamSchema.validate(req.params);
  if (error) {
    console.log('Validation error:', error.details[0].message);
    return res.status(400).json({
      message: error.details[0].message
    });
  }
  
  console.log('Validation passed, calling next()');
  next();
};

module.exports = {
  validateEntityIdParam
};