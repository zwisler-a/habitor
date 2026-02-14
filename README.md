# habitor

Habit and personal tracking web app.

## Monorepo scaffold (HAB-001)

This repository uses npm workspaces with:

- `/Users/zwisler/WebstormProjects/habitor/web` for Angular frontend
- `/Users/zwisler/WebstormProjects/habitor/api` for NestJS backend
- `/Users/zwisler/WebstormProjects/habitor/packages/shared-types` for shared TypeScript contracts

### Commands

- `nvm use` (uses `.nvmrc`, Node 22 recommended)
- `cp .env.example .env` to initialize local environment values
- `npm install` to install all workspace dependencies
- `npm run dev` to run Angular dev server, NestJS watch server, and shared-types watch build
- `npm run build` to build shared types, API, and web app
- `npm run db:migrate --workspace api` to run SQLite migrations
- `npm run db:revert --workspace api` to revert the latest SQLite migration
- `npm run db:seed --workspace api` to apply starter core seed data

### Environment

API startup now validates required env vars and exits with explicit errors when invalid.

- `SQLITE_PATH` is required
- `PORT` must be `1-65535`
- `NODE_ENV` must be `development`, `test`, or `production`
