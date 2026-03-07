# Inventory SaaS

[![CI](https://github.com/Anish-1205/inventory-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/Anish-1205/inventory-saas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An **offline-first, multi-tenant SaaS Inventory Management System** built with Fastify, Next.js 14, and Drizzle ORM.

---

## Architecture Overview

```
inventory-saas/              ← Turborepo monorepo root
├── apps/
│   ├── api/                 ← Fastify v5 REST API (Node.js)
│   └── web/                 ← Next.js 14 App Router frontend
└── packages/
    └── shared/              ← Shared Zod schemas, types & constants
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | Fastify v5, Drizzle ORM, PostgreSQL 15 |
| Authentication | JWT (jose), bcryptjs, HTTP-only cookies |
| Frontend | Next.js 14 (App Router), React 18, TanStack Query |
| Offline sync | Dexie.js (IndexedDB), custom sync engine |
| State management | Zustand |
| Styling | Tailwind CSS |
| Validation | Zod (shared schemas across API & web) |
| Language | TypeScript (strict) |
| Testing | Vitest (unit), Playwright (e2e) |
| CI/CD | GitHub Actions |

---

## Features

- **Offline-first** — all reads/writes go to local IndexedDB; background sync pushes/pulls changes when online
- **Multi-tenancy** — each tenant is fully isolated via Row-Level Security (RLS) enforced in the API
- **RBAC** — role-based access control (admin / manager / staff) enforced at route level
- **Sync engine** — vector-clock-based conflict detection and resolution
- **Conflict resolution** — last-write-wins with conflict log for manual review
- **JWT auth** — short-lived access tokens (15 min) with silent refresh via refresh tokens

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| PostgreSQL | 15+ |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Anish-1205/inventory-saas.git
cd inventory-saas
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

**API (`apps/api`):**

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL, JWT_SECRET, COOKIE_SECRET, etc.
```

**Web (`apps/web`):**

```bash
cp apps/web/.env.local.example apps/web/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development servers

```bash
pnpm dev
```

This starts both the API (port **3001**) and the web app (port **3000**) in parallel via Turborepo.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start all apps in watch/dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run unit tests across all workspaces |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm db:migrate` | Apply pending Drizzle migrations (API only) |
| `pnpm db:generate` | Generate Drizzle migration files from schema changes |

### Per-app scripts

```bash
# API
pnpm --filter @inventory-saas/api test:coverage   # unit tests with coverage
pnpm --filter @inventory-saas/api dev             # API only

# Web
pnpm --filter @inventory-saas/web test            # unit tests
pnpm --filter @inventory-saas/web test:e2e        # Playwright e2e tests
pnpm --filter @inventory-saas/web dev             # web only
```

---

## API Endpoints Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ✗ | Register a new tenant + admin user |
| POST | `/auth/login` | ✗ | Login and receive JWT tokens |
| POST | `/auth/refresh` | ✗ | Refresh access token |
| POST | `/auth/logout` | ✓ | Revoke refresh token |
| GET | `/auth/me` | ✓ | Get current user profile |
| GET | `/users` | ✓ admin/manager | List users in tenant |
| POST | `/categories` | ✓ admin/manager | Create category |
| GET | `/categories` | ✓ | List categories |
| POST | `/products` | ✓ admin/manager | Create product |
| GET | `/products` | ✓ | List products (paginated) |
| GET | `/products/:id` | ✓ | Get single product |
| PATCH | `/products/:id` | ✓ admin/manager | Update product |
| DELETE | `/products/:id` | ✓ admin | Delete product |
| GET | `/inventory` | ✓ | List inventory levels |
| POST | `/inventory/:productId/adjust` | ✓ | Adjust stock |
| POST | `/sync/push` | ✓ | Push local outbox to server |
| GET | `/sync/pull` | ✓ | Pull server changes since `seq` |
| GET | `/sync/state` | ✓ | Get current server sequence |

---

## Project Structure

```
inventory-saas/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── config/          # Zod-validated env, DB connection
│   │       ├── db/
│   │       │   ├── migrations/  # Drizzle SQL migrations
│   │       │   └── schema/      # Drizzle table definitions
│   │       ├── lib/             # errors, pagination, logger helpers
│   │       ├── modules/         # Feature modules (auth, products, …)
│   │       ├── plugins/         # Fastify plugins (auth, rbac, tenant)
│   │       └── server.ts        # App entry point
│   └── web/
│       └── src/
│           ├── app/             # Next.js App Router pages & layouts
│           ├── components/      # Reusable React components
│           ├── lib/
│           │   ├── api/         # Axios client + TanStack Query hooks
│           │   ├── auth/        # Token manager
│           │   ├── db/          # Dexie IndexedDB schema
│           │   └── sync/        # Sync engine & network monitor
│           ├── store/           # Zustand stores
│           └── test/            # Vitest setup files
└── packages/
    └── shared/
        └── src/
            ├── constants/       # Role & sync status enums
            ├── schemas/         # Shared Zod schemas
            └── types/           # Shared TypeScript types
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to your branch and open a pull request
5. Ensure CI passes (lint + type-check + tests)

---

## License

[MIT](LICENSE)
