const crypto = require('crypto');
const { database } = require('../../lib/database');
const { SESSION_EXPIRES_DAYS } = require('../../config');

/**
 * Create a session for a user
 * @param {Number} id
 * @param {String} oAuthProvider OAuth provider
 * @returns {Object}
 */
async function createSession(id, oAuthProvider) {
  const expires = new Date(new Date().setDate(new Date().getDate() + SESSION_EXPIRES_DAYS));
  const token = crypto.randomBytes(32).toString('hex');

  // Create a session
  const session = await database
    .insert({
      user_id: id,
      token,
      expires,
      oauth_provider: oAuthProvider,
    })
    .into('sessions')
    .returning(['uuid']);

  // Update last_login
  await database
    .table('users')
    .where({ id })
    .update({
      last_login: 'NOW()',
    });

  return {
    uuid: session[0].uuid,
    token,
    expires,
  };
}

/**
 * Update the expiry on a session
 * @param {String} uuid
 * @returns {Object}
 */
async function refreshSession(uuid) {
  const expires = new Date(new Date().setDate(new Date().getDate() + SESSION_EXPIRES_DAYS));

  const session = await database
    .table('sessions')
    .where({
      uuid,
      status: 1,
    })
    .update({
      expires,
    })
    .returning(['uuid', 'token']);

  return {
    uuid: session[0].uuid,
    token: session[0].token,
    expires,
  };
}

/**
 * Find a session associated with a token
 * @param {String} token
 * @returns {Object}
 */
async function findSession(token) {
  const session = await database
    .first([
      's.uuid',
      's.user_id',
      's.token',
      's.expires',
      'u.email',
      'u.username',
      's.oauth_provider',
      'o.token as oauth_token',
    ])
    .from({ s: 'sessions' })
    .join({ u: 'users' }, 's.user_id', 'u.id')
    .joinRaw('LEFT JOIN oauth o ON (s.user_id = o.user_id AND s.oauth_provider = o.provider)')
    .where({
      's.token': token,
      's.status': 1,
    });

  if (!session) {
    return null;
  }

  return {
    uuid: session.uuid,
    token: session.token,
    expires: session.expires,
    oauth: {
      provider: session.oauth_provider,
      token: session.oauth_token,
    },
    user: {
      id: session.user_id,
      email: session.email,
      username: session.username,
    },
  };
}

/**
 * Revoke a user session
 * @param {String} token
 * @param {Object}
 */
async function revokeSession(token) {
  const session = await database
    .table('sessions')
    .update({
      status: 0,
      expires: new Date(),
    })
    .where({
      token,
    })
    .returning(['uuid']);

  return session[0];
}

/**
 * Save OAuth refresh token for future auth
 * @param {String} userId
 * @param {String} provider
 * @param {String} token
 */
async function saveOAuthToken(userId, provider, token) {
  const oauth = await database
    .raw(`
      INSERT INTO oauth (user_id, provider, token)
        VALUES (${userId}, '${provider}', '${token}')
        ON CONFLICT (user_id, provider) DO UPDATE
          SET token = '${token}'
        RETURNING user_id, provider, token
      ;
    `);

  return oauth.rows[0];
}

module.exports = {
  createSession,
  refreshSession,
  findSession,
  revokeSession,
  saveOAuthToken,
};
