const Joi = require('joi');

const NewUser = Joi.object().keys({
  name: Joi.string(),
  email: Joi.string().email().required(),
  password: Joi.string().strip().required(),
  username: Joi.string().required(),
});

module.exports = {
  NewUser,
};
