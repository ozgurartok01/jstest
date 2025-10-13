# Express + Drizzle User API

TypeScript-first Express API that shows how to combine relational data modeling, runtime validation, JSON Web Tokens, and fine-grained access control. It ships with a "users and emails" domain, JWT authentication, downloadable PDF exports, and ready-to-run tooling for local development.

## Key Features
- Express 5 server written in TypeScript with centralized error handling and logging
- Drizzle ORM plus SQLite or LibSQL for strongly typed schema definitions and migrations
- Zod validation for request payloads, query strings, and parameters
- CASL ability rules to differentiate `admin` and `customer` capabilities and hide sensitive data
- JWT authentication middleware that decorates the Express request with `user` and `ability`
- PDF export endpoint powered by `pdf-lib` for printable user reports
- Monorepo setup with npm workspaces, Turbo, and Drizzle Kit CLI

## Project Structure
```text
apps/
  api/
    src/
      config/        # Environment loading
      middleware/    # Auth guard and ability wiring
      routes/        # Auth and user route handlers
      schemas/       # Drizzle table definitions and Zod request schemas
      types/         # Express request augmentations
      utils/         # Database, auth, logging helpers
    drizzle/         # Generated SQL migrations
    drizzle.config.ts
package.json        # Workspace root (npm workspaces + turbo)
```

## Getting Started
1. Install prerequisites  
   - Node.js 20 or newer  
   - npm (bundled with Node)
2. Install dependencies  
   ```bash
   npm install
   ```
3. Copy the environment template  
   ```bash
   cp .env.example .env
   ```
   Update the values that matter for the API:
   - `DATABASE_URL` - use `file:./sqlite.db` for a local file database or a LibSQL connection string.
   - `JWT_SECRET` - long random string used to sign access tokens.
   - `JWT_EXPIRES_IN` (optional) - token lifetime such as `1h` (defaults to 1 hour).
   - `PORT`, `LOG_LEVEL` (optional) - override server port and logger verbosity.
4. Run database migrations  
   ```bash
   npx drizzle-kit push --config apps/api/drizzle.config.ts
   ```
   Use `npx drizzle-kit generate` to create new migrations from schema changes.
5. Start the development server  
   ```bash
   npm run dev --workspace @express-learn/api
   ```
   `ts-node-dev` reloads on file changes and serves the API on `http://localhost:3000` by default.
6. Build for production  
   ```bash
   npm run build --workspace @express-learn/api
   npm run start --workspace @express-learn/api
   ```

## Available Scripts
- `npm run dev` - run every workspace dev script through Turbo (useful when the monorepo grows).
- `npm run dev --workspace @express-learn/api` - watch mode for the API only.
- `npm run build --workspace @express-learn/api` - compile TypeScript to `dist/`.
- `npm run start --workspace @express-learn/api` - run the compiled server.
- `npx drizzle-kit generate --config apps/api/drizzle.config.ts` - emit SQL migration files.
- `npx drizzle-kit push --config apps/api/drizzle.config.ts` - apply migrations to the configured database.

## CLI Tool
- Located in `apps/cli`; targets the same API using the `user-cli` binary.
- Run commands with `npm run cli --workspace @express-learn/cli -- <command> [...options]`.
- Supports `create`, `login`, `list`, `get`, `update`, `delete`, and `export-pdf`.
- Honors `API_BASE_URL` (defaults to `http://localhost:3000`) and persists tokens under `~/.user-cli`; override with `USER_CLI_TOKEN` if needed.
- Ensure the API server is running before invoking CLI commands.

## API Overview
All protected endpoints expect a `Bearer <token>` header with a JWT issued by `POST /auth/login` or `POST /auth/register`.

| Method | Endpoint            | Description                                | Notes                          |
|--------|---------------------|--------------------------------------------|--------------------------------|
| POST   | `/auth/register`    | Register a user with primary and secondary email addresses | Returns user info and JWT token |
| POST   | `/auth/login`       | Issue a new JWT for an existing email      |                                |
| GET    | `/users`            | Paginated list of users                    | Respects role-based email visibility |
| GET    | `/users/:id`        | Fetch a single user by CUID                |                                |
| PATCH  | `/users/:id`        | Update permitted fields on a user          | CASL restricts fields per role |
| DELETE | `/users/:id`        | Remove a user and associated emails        | Admins or owners only          |
| GET    | `/users/export/pdf` | Download a PDF report of all users         | Admins see email addresses     |

Zod schemas validate every payload and query parameter; validation errors are returned with descriptive messages.

## Domain Model
- `users` table stores `id`, `name`, `age`, and `role` (`admin` or `customer`).
- `emails` table stores multiple addresses per user with `isPrimary` and soft-delete flags.
- Drizzle relations make it easy to eager load user emails while filtering out soft-deleted rows.

## Auth and Authorization
- Authentication uses signed JWT access tokens (`signAccessToken`, `verifyAccessToken`).
- `requireAuth` middleware populates `req.user` and `req.ability`.
- CASL ability rules:
  - `admin`: can manage users and emails, sees all addresses.
  - `customer`: can read their own record, update their `name`, delete their account, and never see other users' email addresses.

## PDF Export
The `/users/export/pdf` endpoint builds a multi-page report with `pdf-lib`, includes timestamp metadata, and honors ability checks so hidden data never leaks into the exported file.

## Logging and Error Handling
- Centralized Winston logger (configurable through `LOG_LEVEL`) captures application and error logs.
- 404 and 500 handlers ensure JSON responses for unknown routes and unhandled exceptions.

## Contributing
1. Create a feature branch.
2. Make your changes and update or add migrations with Drizzle Kit.
3. Verify the API starts locally in dev mode.
4. Open a pull request with a summary of your changes.

Happy hacking!
