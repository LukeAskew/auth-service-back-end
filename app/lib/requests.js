const Joi = require('joi');

/**
 * Validate an request schema
 */
function validate(...args) {
  return Joi.validate(...args);
}

/**
 * Normalize Error object
 * @param {Object} JoiError
 * @returns {Array}
 */
function getValidationErrors(JoiError) {
  return JoiError.details.map(d => ({
    field: d.path.join('.'),
    message: d.message,
  }));
}

module.exports = {
  validate,
  getValidationErrors,
};
