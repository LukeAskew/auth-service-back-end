const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { PORT } = require('./config');
const {
  login, oauth, authorize, logout, refresh,
} = require('./resources/auth/handlers');
const { create, getAccount, updateUsername } = require('./resources/users/handlers');

const app = express();

const CORS_OPTIONS = {
  origin: true,
  credentials: true,
  maxAge: 600,
  allowedHeaders: ['Origin', 'Authorization', 'Content-Type'],
  preflightContinue: true,
};

// Apply middleware
app.use(helmet());
app.use(cors(CORS_OPTIONS));
app.use(bodyParser.json());

// Apply CORS to all OPTIONS requests
app.options('*', cors(CORS_OPTIONS));

// Define Routes
app.post('/login', login);
app.get('/oauth/:provider', oauth);
app.get('/logout', authorize, logout);
app.post('/refresh', authorize, refresh);
app.post('/users', create);
app.get('/account', authorize, getAccount);
app.post('/username', authorize, updateUsername);

// Handle errors
app.use((error, req, res, next) => {
  res.status(401).send({
    errors: [
      {
        message: error.message,
      },
    ],
  });

  next();
});

// Start the server
app.listen(PORT, () => {
  process.stdout.write(`Application running at http://localhost:${PORT}\n`);
});
