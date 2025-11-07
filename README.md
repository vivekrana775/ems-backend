# Employee Management Backend

Production-ready Node.js backend for the employee management platform. Built with TypeScript, Express, Prisma, and PostgreSQL, it provides authentication, employee administration, time tracking, and request workflows.

## Features
- JWT authentication with refresh tokens, role-based access control, and secure cookie handling
- Employee lifecycle management with hierarchy support and role assignments
- Time tracking (clock-in/out) with role-specific permissions
- Employee request submission and approval workflow with audit logging
- Centralised configuration, structured logging (Pino), request validation (Zod), and global error handling
- Prisma ORM with PostgreSQL schema, seed script, and Docker Compose database
- Vitest unit tests with Supertest-ready setup, ESLint + Prettier formatting, Husky/lint-staged hooks

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Docker (optional, for local PostgreSQL)

### Installation
```bash
npm install
```

### Environment
Create an `.env` file based on the variables below:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/employee_management
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
```

### Database
Start PostgreSQL locally:
```bash
docker compose up -d
```

Run Prisma migrations and seed:
```bash
npm run prisma:migrate:dev
npm run seed
```

### Development
```bash
npm run dev
```

### Linting & Formatting
```bash
npm run lint
npm run format
```

### Testing
```bash
npm run test
```

### Production Build
```bash
npm run build
npm run start:prod
```

## Project Structure
```
src/
  app.ts                Express configuration & middleware
  index.ts              HTTP server bootstrap
  config/               Environment, logging
  core/                 Error & response helpers
  lib/                  Prisma client
  middlewares/          Auth, validation, error handlers
  modules/
    auth/               Auth routes, services, repositories
    employees/          Employee CRUD & role management
    time/               Clock-in/out workflows
    requests/           Request submission & approvals
    shared/             Seed scripts, audit helpers
  routes/               Route registration
  tests/                Vitest setup
prisma/
  schema.prisma         Data model
docker-compose.yml      PostgreSQL service
```

## API Overview
- `POST /api/auth/login` – authenticate user
- `POST /api/auth/refresh` – renew access tokens (cookie or body)
- `POST /api/auth/logout` – revoke session
- `POST /api/auth/signup` – admin/HR user provisioning
- `GET /api/employees` – paginated employee list (admin/HR/manager)
- `POST /api/employees` – create employee profile + user
- `PATCH /api/employees/:id/status` – update employment status & active flag
- `POST /api/time/clock-in` – employees clock in, managers can act for reports
- `POST /api/time/clock-out` – close open time entry
- `GET /api/time/entries` – view time history with filters
- `POST /api/requests` – submit employee request
- `PATCH /api/requests/:id/status` – approve/reject (admin/manager/HR)

Refer to route files under `src/modules/**/routes.ts` for full details and validation schemas.

## Tooling
- **Logging:** Pino with pretty transport in development
- **Validation:** Zod request schemas via reusable middleware
- **Security:** Helmet, rate limiting, CORS, secure cookies
- **Code Quality:** ESLint (`@typescript-eslint`), Prettier, Husky pre-commit with lint-staged
- **Testing:** Vitest with module mocks and Prisma isolation

## Next Steps
- Integrate email delivery for password reset flow
- Add end-to-end tests against a test database
- Expand audit logging across all modules
- Connect to CI/CD pipeline (GitHub Actions example recommended)

## License
ISC

