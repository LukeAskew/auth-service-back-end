const Joi = require('joi');

const Login = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().strip().required(),
});

module.exports = {
  Login,
};
