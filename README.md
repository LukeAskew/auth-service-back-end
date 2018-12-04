# Auth Service Example - Back-End

Run with [front-end counterpart →](https://github.com/LukeAskew/auth-service-front-end)

## Features

- Secure password storage 🔒
- Sessions ⏳
- CSRF protection 🙅‍♂️
- OAuth 2.0 🎟

## Setup

1. Install dependenices using `$ npm install`
2. Create a Postgres database named `auth`, run migrations `$ npm run db:migrate`
3. Create [Google](https://console.cloud.google.com/apis/credentials) and/or [Github](https://github.com/settings/developers) apps (to demo OAuth login)

## Running the app

> **Note:** If you want to use the OAuth functionality you must provide client IDs and secrects as environment variables.

Create a `.env` file in the project root with the following, replacing `XXX` with your values:

```
GOOGLE_CLIENT_ID=XXX
GOOGLE_CLIENT_SECRET=XXX
GITHUB_CLIENT_ID=XXX
GITHUB_CLIENT_SECRET=XXX
```

Run in debug mode:

```
$ npm run debug
```

Run in production:

```
$ npm start
```

## Environment Variables

| Name | Description |
| --- | --- |
| `OAUTH_REDIRECT_URL` | Where to redirect upon successful OAuth |
| `GITHUB_CLIENT_ID` | Client ID from your Github App |
| `GITHUB_CLIENT_SECRET` | Client secret from your Github App |
| `GOOGLE_CLIENT_ID` | Client ID from your Google App |
| `GOOGLE_CLIENT_SECRET` | Client secret from your Google App |

## Credits

Some concepts borrowed from [kriasoft/nodejs-api-starter](https://github.com/kriasoft/nodejs-api-starter)
