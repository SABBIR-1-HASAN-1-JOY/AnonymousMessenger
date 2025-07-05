// validators/userValidator.js
const Joi =require('joi') ;

const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});

 const validateUserIdParam = (req, res, next) => {
  const { error } = userIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateUserIdParam
};
