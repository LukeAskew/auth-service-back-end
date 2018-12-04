const bcrypt = require('bcryptjs');
const { validate, getValidationErrors } = require('../../lib/requests');
const { NewUser } = require('./schema');
const users = require('./data');

/**
 * Create a user record
 * @param {Object} data
 * @returns {Object}
 */
async function create(req, res) {
  try {
    // Validate form data
    const { error } = validate(req.body, NewUser);

    if (error) {
      return res.status(400).send({
        errors: getValidationErrors(error),
      });
    }

    const {
      name, email, username, password,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user record
    const user = await users.create({
      name,
      email,
      username,
      password: hashedPassword,
    });

    return res.status(200).send(user);
  } catch (err) {
    return res.status(500).send({
      errors: [{ message: 'Error' }],
    });
  }
}

/**
 * Get user's account
 * @param {Object} req
 * @param {Object} res
 */
async function getAccount(req, res) {
  try {
    const user = await users.findById(req.session.user.id);

    return res.status(200).send({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      created_on: user.created_on,
      last_login: user.last_login,
    });
  } catch (error) {
    return res.status(404).send({
      errors: [{ message: 'Account not found' }],
    });
  }
}

/**
 * Update a user's username
 * @param {Object} req
 * @param {Object} res
 */
async function updateUsername(req, res) {
  try {
    const { id, username } = req.body;
    const user = await users.updateUsername(id, username);

    return res.status(200).send({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      created_on: user.created_on,
      last_login: user.last_login,
    });
  } catch (err) {
    return res.status(500).send({
      errors: [{ message: 'Error' }],
    });
  }
}

module.exports = {
  create,
  getAccount,
  updateUsername,
};
