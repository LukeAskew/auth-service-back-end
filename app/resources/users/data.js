const { database } = require('../../lib/database');

/**
 * Retrieve a user record by email
 * @param {String} email
 * @returns {Object}
 */
async function findByEmail(email) {
  const user = await database
    .first([
      'id',
      'name',
      'username',
      'email',
      'password',
      'created_on',
      'last_login',
    ])
    .from('users')
    .where({
      email,
    });

  return user;
}

/**
 * Retrieve a user record by id
 * @param {Number} id
 * @returns {Object}
 */
async function findById(id) {
  const user = await database
    .first([
      'id',
      'name',
      'username',
      'email',
      'password',
      'created_on',
      'last_login',
    ])
    .from('users')
    .where({
      id,
    });

  return user;
}

/**
 * Create a user record
 * @param {Object} record
 * @returns {Object}
 */
async function create(record) {
  const user = await database
    .table('users')
    .insert(record)
    .returning([
      'id',
      'name',
      'email',
      'username',
      'created_on',
      'last_login',
    ]);

  return user[0];
}

/**
 * Update a user record
 * @param {Number} id
 * @param {String} username
 * @returns {Object}
 */
async function updateUsername(id, username) {
  const user = await database
    .table('users')
    .where({ id })
    .update({ username })
    .returning([
      'id',
      'name',
      'email',
      'username',
      'created_on',
      'last_login',
    ]);

  return user[0];
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateUsername,
};
