# OIDC Auth TS

A small OpenID Connect style identity provider built with Express, TypeScript, PostgreSQL, Drizzle ORM, JWTs, cookies, and Zod validation.

The service supports local user registration and login, browser SSO sessions, authorization code creation, token exchange, refresh tokens, a JWKS endpoint, and OIDC discovery metadata.

## Stack

- Node.js and TypeScript
- Express 5
- PostgreSQL
- Drizzle ORM and Drizzle Kit
- Zod for request and environment validation
- JWT access tokens signed with RS256
- `node-jose` for JWKS output
- `bcrypt` for password hashing

## Project Structure

- `src/index.ts` starts the HTTP server.
- `src/modules/index.ts` creates the Express app and mounts routers.
- `src/modules/auth/auth.routes.ts` defines auth and OIDC auth routes.
- `src/modules/auth/auth.controller.ts` handles HTTP requests and the login/register pages.
- `src/modules/auth/auth.service.ts` contains login, authorization, token, refresh, and user logic.
- `src/modules/auth/auth.repository.ts` contains database queries.
- `src/modules/auth/auth.model.ts` defines Drizzle tables.
- `src/common/config/env.ts` validates environment variables.
- `src/common/db/migrations` contains generated Drizzle SQL migrations.
- `scripts/seed-clients.sql` inserts the example OIDC clients.

## Environment Setup

Copy the example environment file and adjust values if needed:

```sh
cp example.env .env
```

Example values:

```env
PORT=6001
ISSUER=http://localhost:6001
DATABASE_URI=postgres://admin:admin@postgres:5432/oidc_auth_ts
NODE_ENV=development
SESSION_EXPIRY_MS=604800000
AUTH_CODE_EXPIRY_MS=60000
```

`SESSION_EXPIRY_MS` is `7 * 24 * 60 * 60 * 1000`.
`AUTH_CODE_EXPIRY_MS` is `60 * 1000`.

The application expects numeric millisecond values in `.env`.

If you run the app directly on your host machine while using the included Docker PostgreSQL service, use:

```env
DATABASE_URI=postgres://admin:admin@localhost:5444/oidc_auth_ts
```

## Install Dependencies

```sh
npm install
```

This repository also includes a `pnpm-lock.yaml`, so `pnpm install` can be used if your local workflow prefers pnpm.

## Database

Start PostgreSQL with Docker Compose:

```sh
docker compose up -d postgres
```

The included Compose file creates:

- database: `oidc_auth_ts`
- user: `admin`
- password: `admin`
- container port: `5432`
- host port: `5444`

## Generate Migrations

Drizzle migrations are generated from `src/modules/auth/auth.model.ts`.

```sh
npm run db:generate
```

This writes migration files into:

```text
src/common/db/migrations
```

## Run Migrations

Apply migrations to the configured PostgreSQL database:

```sh
npm run db:migrate
```

Make sure `DATABASE_URI` points at the database you want to migrate before running the command.

## Seed Example Clients

After running migrations, seed the three example OIDC clients:

```sh
docker compose exec -T postgres psql -U admin -d oidc_auth_ts < scripts/seed-clients.sql
```

The script creates or updates:

| Client ID | Client Secret | Redirect URI |
| --- | --- | --- |
| `project1` | `secret123` | `http://localhost:3001/callback` |
| `project2` | `secret001` | `http://localhost:4000/callback` |
| `project3` | `secret003` | `http://localhost:3002/callback` |

## Development

Run the TypeScript watcher and server:

```sh
npm run dev
```

Build the project:

```sh
npm run build
```

Start the compiled app:

```sh
npm start
```

## Auth Flow

1. Register a user with `POST /api/v1/auth/register`.
2. Start an authorization request with `GET /api/v1/auth/authorize`.
3. If the user does not have an `idp_session` cookie, the app redirects to `/api/v1/auth/login`.
4. The login form posts credentials to `POST /api/v1/auth/login`.
5. After login, the app sets an `idp_session` cookie and redirects back to the authorization request.
6. The authorization endpoint creates an authorization code and redirects to the registered client callback.
7. The client exchanges the code at `POST /api/v1/auth/token`.

## Main Endpoints

- `GET /health` returns service health.
- `GET /.well-known/openid-configuration` returns OIDC discovery metadata.
- `GET /.well-known/jwks.json` returns the public JWKS.
- `GET /api/v1/auth/login` renders the login page.
- `POST /api/v1/auth/login` logs in a user and sets the SSO session cookie.
- `POST /api/v1/auth/register` creates a user.
- `GET /api/v1/auth/authorize` starts the authorization code flow.
- `POST /api/v1/auth/token` exchanges an authorization code for tokens.
- `POST /api/v1/auth/refresh` refreshes tokens.
- `GET /api/v1/auth/me` returns the current authenticated user.

## Example Authorization URL

```text
http://localhost:6001/api/v1/auth/authorize?client_id=project1&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&response_type=code&scope=openid%20email%20profile&state=demo-state
```

After login, the browser redirects to:

```text
http://localhost:3001/callback?code=...&state=demo-state
```

## Token Exchange Example

```sh
curl -X POST http://localhost:6001/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AUTH_CODE_FROM_CALLBACK",
    "client_id": "project1",
    "client_secret": "secret123"
  }'
```

## Useful Commands

```sh
npm run dev
npm run build
npm start
npm run db:generate
npm run db:migrate
```
