const qs = require('qs');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const axios = require('axios');
const { validate, getValidationErrors } = require('../../lib/requests');
const { Login } = require('./schema');
const users = require('../users/data');
const auth = require('./data');
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  OAUTH_REDIRECT_URL,
} = require('../../config');

/**
 * Construct a session response
 * @param {Object} session
 * @returns {Object}
 */
function createSessionResponse(session) {
  // Create a cookie
  const setCookie = cookie.serialize('sid', session.uuid, {
    httpOnly: true,
    path: '/',
    expires: session.expires,
  });

  return {
    headers: {
      'Set-Cookie': setCookie,
    },
    body: {
      uuid: session.uuid,
      token: session.token,
      expires: session.expires,
    },
  };
}

/**
 * Authorize a user by verifying their session
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
async function authorize(req, res, next) {
  try {
    const { headers } = req;
    const session = await auth.findSession(headers.authorization);
    const { sid } = cookie.parse(headers.cookie);

    // Validate CSRF if required by session
    if (session.uuid === sid) {
      req.session = session;
      next();
    } else {
      throw new Error();
    }
  } catch (error) {
    next(new Error('Session not valid'));
  }
}

/**
 * Authenticate a user and start a new session
 * @param {Object} req
 * @param {Object} res
 */
async function login(req, res) {
  try {
    // Validate form data
    const { error } = validate(req.body, Login);

    if (error) {
      return res.status(401).send({
        errors: getValidationErrors(error),
      });
    }

    const { email, password } = req.body;

    // Find user record
    const user = await users.findByEmail(email);

    if (!user) {
      return res.status(401).send({
        errors: [{ message: 'Email and password combination is not valid' }],
      });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).send({
        errors: [{ message: 'Email and password combination is not valid' }],
      });
    }

    // Create a session
    const session = await auth.createSession(user.id);
    const sessionResponse = createSessionResponse(session);

    return res
      .status(200)
      .set(sessionResponse.headers)
      .send(sessionResponse.body);
  } catch (error) {
    return res.status(500).send({
      errors: [{ message: 'Error' }],
    });
  }
}

/**
 * Verify and refresh a user's session
 * @param {Object} req
 * @param {Object} res
 */
async function refresh(req, res) {
  try {
    const { token } = req.session;
    // Find session
    const session = await auth.findSession(token);
    const expiresIn = session.expires - new Date();

    // Return current session if not expiring in the next 1 day
    if (expiresIn > 86400000) {
      const { headers } = createSessionResponse(session);

      return res.set(headers).sendStatus(204);
    }

    // Handle Google refresh
    if (session.oauth.provider === 'google') {
      const params = qs.stringify({
        refresh_token: session.oauth.token,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      });

      await axios.post(`https://www.googleapis.com/oauth2/v4/token?${params}`);
    }

    const refreshed = await auth.refreshSession(session.uuid);
    const { headers } = createSessionResponse(refreshed);

    return res.set(headers).sendStatus(204);
  } catch (error) {
    return res.sendStatus(401);
  }
}

/**
 * Revoke a user's session and reset cookies
 * @param {Object} req
 * @param {Object} res
 */
async function logout(req, res) {
  try {
    const { token } = req.session;

    await auth.revokeSession(token);

    // Expire the csrf cookie
    const setCookie = cookie.serialize('sid', '', {
      httpOnly: true,
      path: '/',
      expires: new Date('2000'),
    });

    return res
      .status(200)
      .set({
        'Set-Cookie': setCookie,
      })
      .send();
  } catch (error) {
    return res.status(500).send({
      errors: [{ message: 'Error' }],
    });
  }
}

/**
 * OAuth for Google
 * @param {String} code
 * @returns {Object}
 */
async function google(code) {
  // Exchange code for token
  const tokenRequest = await axios.post(
    `https://www.googleapis.com/oauth2/v4/token?${qs.stringify({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:5000/oauth/google',
      grant_type: 'authorization_code',
    })}`,
  );
  const tokenResponse = qs.parse(tokenRequest.data);

  // Get user data
  const googleUser = await axios.get('https://content.googleapis.com/plus/v1/people/me', {
    headers: {
      Authorization: `${tokenResponse.token_type} ${tokenResponse.access_token}`,
    },
  });

  // Find or create user
  const user = (await users.findByEmail(googleUser.data.emails[0].value))
    || (await users.create({
      name: googleUser.data.displayName,
      email: googleUser.data.emails[0].value,
    }));

  // Save OAuth token
  if (tokenResponse.refresh_token) {
    await auth.saveOAuthToken(user.id, 'google', tokenResponse.refresh_token);
  }

  // Create a session
  const session = await auth.createSession(user.id, 'google');

  return createSessionResponse(session);
}

/**
 * OAuth for Github
 * @param {String} code nonce used to retrieve access token
 * @returns {Object}
 */
async function github(code) {
  // Exchange code for token
  const tokenRequest = await axios.post(
    `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
  );
  const tokenResponse = qs.parse(tokenRequest.data);

  if (tokenResponse.error_description) {
    throw new Error(tokenResponse.error_description);
  }

  // Get user data
  const githubUser = await axios.get('https://api.github.com/user', {
    params: { access_token: tokenResponse.access_token },
  });

  // Find or create user
  const user = (await users.findByEmail(githubUser.data.email))
    || (await users.createUser({
      name: githubUser.data.name,
      email: githubUser.data.email,
    }));

  await auth.saveOAuthToken(user.id, 'github', tokenResponse.access_token);

  // Create a session
  const session = await auth.createSession(user.id, 'github');

  return createSessionResponse(session);
}

/**
 * Handle oauth callbacks
 * @param {Object} req
 * @param {Object} res
 */
async function oauth(req, res) {
  try {
    const providers = {
      google,
      github,
    };

    const session = await providers[req.params.provider](req.query.code);

    return res
      .cookie('tok', session.body.token)
      .cookie('sid', session.body.uuid, {
        expires: session.expires,
        httpOnly: true,
      })
      .redirect(OAUTH_REDIRECT_URL);
  } catch (error) {
    return res.status(401).redirect(OAUTH_REDIRECT_URL);
  }
}

module.exports = {
  authorize,
  login,
  refresh,
  logout,
  oauth,
};
