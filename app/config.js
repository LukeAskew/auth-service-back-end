require('dotenv').config();

module.exports = {
  PORT: 5000,
  OAUTH_REDIRECT_URL: 'http://localhost:3000',
  DB_HOST: '127.0.0.1',
  DB_USER: '',
  DB_PASS: '',
  DB_DATABASE: 'auth',
  SESSION_EXPIRES_DAYS: 30,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  ...process.env,
};
