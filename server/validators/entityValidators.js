// validators/entityValidators.js
const Joi = require('joi');

const entityIdParamSchema = Joi.object({
  entityId: Joi.number().integer().positive().required()
});

const validateEntityIdParam = (req, res, next) => {
  const { error } = entityIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateEntityIdParam
};