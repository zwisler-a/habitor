# Habitor Architecture Design (v1)

## 1. Purpose
Define a production-oriented, local-deployable architecture for a mobile-first habit and personal tracking web app with:
- configurable primitive trackers
- offline-first behavior
- Firebase push notifications
- no-login v1 user model with future multi-user migration path

## 2. Scope
### In scope (v1)
- Tracker CRUD based on primitive fields (`boolean`, `number`, `duration`, `text`)
- Scheduling (daily, weekdays, custom days, times/day)
- Entry logging + history + basic stats
- Offline cache + mutation queue + reconnect sync
- Firebase push reminders
- Single deployable API process (no separate worker container)

### Out of scope (v1)
- Social/accountability features
- External health integrations
- Advanced correlations/insights

## 3. Architecture Overview
### Frontend
- Angular (TypeScript), mobile-first responsive UI
- Angular PWA service worker for asset/data caching
- IndexedDB for local cache + queued offline mutations
- Built as static assets and served by NestJS in production

### Backend
- NestJS (TypeScript), modular domain-driven structure
- REST API with DTO validation and OpenAPI docs
- In-process scheduler module for reminder dispatch
- Serves Angular distribution from a static assets directory

### Data
- SQLite via TypeORM migrations/entities
- User-scoped records for future real auth enablement

### Notifications
- Firebase Cloud Messaging (FCM)
- API stores device tokens, computes due reminders, sends via `firebase-admin`

## 4. Logical Component Design
### 4.1 Monorepo Layout
```text
/web                     # Angular app
/api                     # NestJS app
/packages/shared-types   # Shared DTO/contracts/types
/docs
/scripts
```

### 4.2 Angular Structure
```text
/web/src
  /app
    /core
      /api              # Http clients per domain
      /auth-context     # X-User-Id storage and header injection
      /config           # Environment config
      /guards
      /interceptors     # user-id, correlation-id, error mapping
      /services         # sync-state, network-state, notification-permission
    /shared
      /components
      /directives
      /pipes
      /models
      /utils
    /features
      /today
      /trackers
      /entries
      /stats
      /settings
    /offline
      /indexeddb        # Dexie/local storage adapters
      /queue            # mutation queue
      /sync             # replay/backoff/conflict handling
    /shell              # layout, nav, install prompt
    app.routes.ts
    app.config.ts
  /assets
  /environments
```

### 4.3 Angular Module Responsibilities
- `core`: singleton services, interceptors, api clients, global config
- `shared`: presentational reusable UI and utilities only
- `features/today`: due trackers, quick complete/log
- `features/trackers`: tracker CRUD + primitive field builder
- `features/entries`: entry create/edit/history/calendar
- `features/stats`: tracker-level aggregates and chart widgets
- `offline`: cache/read model + mutation replay pipeline

### 4.4 Angular Coding Boundaries
- Feature modules may depend on `core` and `shared`, not on other feature modules.
- API calls are only made through `core/api` clients.
- IndexedDB writes go through `offline` services, never directly from components.
- Components are thin; domain logic lives in feature services/store.

### 4.5 Angular Runtime Flow
1. App boots `core/config` and registers interceptors.
2. `auth-context` resolves active user (`X-User-Id` or default).
3. Feature screens load from IndexedDB first, then network refresh.
4. Mutations enqueue locally and sync in background.
5. Sync state is surfaced globally in shell header/footer.

### 4.6 NestJS Structure
```text
/api/src
  /app
    app.module.ts
  /config               # typed env/config providers
  /common
    /decorators
    /filters            # global exception filter
    /guards
    /interceptors       # logging/correlation
    /pipes              # validation pipes
    /types
  /database
    data-source.ts
    /migrations
    /entities
    /repositories
  /modules
    /users
      users.module.ts
      users.controller.ts
      users.service.ts
    /trackers
      trackers.module.ts
      trackers.controller.ts
      trackers.service.ts
      schedule.service.ts
      validators/*
    /entries
      entries.module.ts
      entries.controller.ts
      entries.service.ts
    /stats
      stats.module.ts
      stats.controller.ts
      stats.service.ts
    /notifications
      notifications.module.ts
      notifications.controller.ts
      notifications.service.ts
      fcm.service.ts
    /scheduler
      scheduler.module.ts
      reminder-scheduler.service.ts
    /health
      health.module.ts
      health.controller.ts
  /openapi
    openapi.ts          # swagger bootstrap generation
  main.ts
```

### 4.7 NestJS Module Responsibilities
- `users`: default-user seeding and `X-User-Id` resolution/auto-create
- `trackers`: tracker and primitive field definitions + schedule rules
- `entries`: entry writes/reads and typed value validation
- `stats`: tracker-level streak and completion aggregations
- `notifications`: token management + FCM send abstraction
- `scheduler`: periodic due-reminder evaluation + follow-up dispatch
- `health`: liveness/readiness probes

### 4.8 NestJS Layering Rules
- Controllers: transport mapping only (DTO in/out).
- Services: business logic and orchestration.
- Repositories: persistence and query composition only.
- Entities: database mapping only; no request logic.
- Cross-module access goes through exported services, not direct repository imports.

### 4.9 NestJS Request Lifecycle
1. Global middleware attaches correlation id.
2. Validation pipe validates DTOs.
3. User context resolver reads `X-User-Id`; auto-creates if unknown.
4. Controller delegates to service.
5. Service enforces user scope and executes repository ops.
6. Response DTO mapped and returned; errors normalized by global filter.

### 4.10 Cross-Cutting
- Structured logging and request correlation IDs
- DTO/entity validation with explicit error payloads
- OpenAPI generation from NestJS decorators/controllers (no hand-maintained spec files)

## 5. Data Model (TypeORM / SQLite)
### 5.1 Core Entities
- `users`
  - `id`, `name`, `is_default`, `created_at`, `updated_at`
- `trackers`
  - `id`, `user_id`, `name`, `description`, `is_archived`, `schedule_config_json`, `created_at`, `updated_at`
- `tracker_fields`
  - `id`, `tracker_id`, `field_key`, `primitive_type`, `unit`, `validation_json`, `target_json`, `sort_order`
- `entries`
  - `id`, `user_id`, `tracker_id`, `occurred_at`, `note`, `created_at`, `updated_at`
- `entry_values`
  - `id`, `entry_id`, `field_key`, `value_bool`, `value_num`, `value_duration_sec`, `value_text`
- `device_tokens`
  - `id`, `user_id`, `token`, `platform`, `last_seen_at`
- `reminder_jobs`
  - `id`, `tracker_id`, `next_run_at`, `last_run_at`, `status`, `last_error`

### 5.2 Composition Example
Blood pressure is represented as one tracker with two primitive fields:
- `systolic` (`number`, unit `mmHg`)
- `diastolic` (`number`, unit `mmHg`)

## 6. API Design (REST)
### 6.1 User Context
- Optional request header: `X-User-Id`
- If absent: fallback to default local user
- Every domain query includes `user_id` scope guard

### 6.2 Resource Groups
- `/trackers` (CRUD, archive)
- `/trackers/:id/fields`
- `/trackers/:id/schedule`
- `/entries` (create/update/delete/list)
- `/stats` (streaks, completion, windows)
- `/notifications/tokens` (register/update/remove token)
- `/health` and `/ready`

## 7. Offline and Sync Design
### 7.1 Client Data Strategy
- Server data cached in IndexedDB by entity and date windows
- Writes become local mutations first (optimistic updates)
- Mutation queue persists across app restarts

### 7.2 Sync Strategy
- Trigger sync on reconnect/app resume/manual refresh
- Replay queued mutations in order
- Retry with exponential backoff for transient failures
- Conflict policy: last-write-wins for v1

### 7.3 User Feedback
- Global sync indicator states: `online`, `offline`, `syncing`, `error`
- Failed mutations shown with retry action

## 8. Reminder Scheduling and Notification Flow
1. Tracker schedule defines reminder windows.
2. Scheduler module periodically computes due reminders.
3. Matching device tokens are loaded for active user.
4. FCM sends notification payload.
5. Delivery result and retry/error metadata is persisted.

## 9. Security and Operational Baseline
- No-login v1 mode, but strict user data scoping in all handlers
- Input validation at controller boundary
- CORS restricted to frontend origin(s)
- Environment-based secret handling (`FIREBASE_SERVICE_ACCOUNT_JSON`, etc.)
- Database backup handled outside application scope in v1

## 10. Deployment Topology (Local)
- Single `app` container:
  - NestJS API + scheduler process
  - Angular compiled assets served by NestJS
- Shared volume for SQLite DB file

No separate worker container and no separate web container in v1.

## 11. Single-Container Build and Runtime
### 11.1 Docker Build Strategy
- Multi-stage Docker build:
  1. Build Angular app (`web/dist`)
  2. Build NestJS app (`api/dist`)
  3. Runtime stage copies both outputs into one image
- Runtime image starts only NestJS process.

### 11.2 Static Asset Serving Strategy
- NestJS static serving maps Angular build output to `/`.
- API routes remain under `/api/*` and are excluded from SPA fallback.
- SPA fallback sends `index.html` for non-API unknown paths.

### 11.3 Operational Notes
- One container means one health endpoint and one restart policy.
- Horizontal scaling still possible by running multiple identical containers against persistent SQLite replacement later.
- For v1 local deployment, run a single replica with mounted SQLite volume.
## 12. Quality Strategy
- Unit tests: validation, schedule calculation, user scoping
- Integration tests: tracker and entry workflows
- E2E smoke tests: today/check-in/offline queue replay
- CI gates: lint + typecheck + tests

## 13. Coding Guidelines
### 13.1 General
- Use TypeScript strict mode across frontend, backend, and shared packages.
- Keep functions small and focused; prefer composition over large utility classes.
- Avoid `any`; if unavoidable, isolate and document the boundary.
- Use explicit return types for exported functions and public methods.
- Keep imports absolute (path aliases) where configured; avoid deep relative chains.
- Do not commit generated build artifacts.

### 13.2 Naming and Structure
- Use domain-first naming (`TrackerService`, `CreateEntryDto`, `SyncQueueService`).
- Keep one primary responsibility per file.
- Co-locate tests with source (`*.spec.ts`) unless integration/e2e folder conventions require otherwise.
- Use shared types from `/packages/shared-types`; do not duplicate DTO contracts manually.

### 13.3 Angular Rules
- Smart/container components orchestrate data; dumb/presentational components render only.
- Put API calls in `core/api` services only; components should not call `HttpClient` directly.
- Centralize app state transitions in feature services/store; keep template logic minimal.
- Prefer reactive forms for tracker/entry editors; enforce validation in form layer and API.
- Offline writes must go through mutation queue services, never bypass queue directly.

### 13.4 NestJS Rules
- Controllers handle transport concerns only; business logic stays in services.
- Services depend on repositories/entities through module boundaries, not cross-module internals.
- Validate all incoming DTOs with global validation pipe and class-validator decorators.
- Enforce `user_id` scope in every query path; no unscoped repository access.
- Keep scheduler jobs idempotent and safe to rerun after restart.

### 13.5 API and Contract Discipline
- OpenAPI is generated from decorators; treat generated spec as source of truth.
- Backward compatibility is required: additive changes preferred, avoid breaking field removals/renames.
- Use explicit error response shapes (`code`, `message`, `details`) consistently.
- Use ISO-8601 UTC timestamps at API boundaries.

### 13.6 Data and Migrations
- Every schema change must include a TypeORM migration.
- Never edit applied migrations; create a new forward migration instead.
- Add indexes for new query paths that hit date ranges or foreign keys.
- Keep JSON columns schema-documented in code comments and validators.

### 13.7 Testing Expectations
- New business logic requires unit tests.
- New endpoints require integration coverage for success + validation + user-scope failure.
- Critical user flows (today check-in, offline sync replay) require e2e smoke coverage.
- Bug fixes should include a regression test when feasible.

### 13.8 Observability and Operations
- Use structured logs with correlation id propagation.
- Log domain events at info level and unexpected failures at error level.
- Do not log secrets, tokens, or personally sensitive values.
- Health endpoints must stay lightweight and dependency-aware.

## 14. Decision Log (Current)
- Use Angular instead of Next.js
- Use NestJS backend
- Use SQLite + TypeORM
- Use Firebase only for push notifications
- No social features in v1
- No separate worker process in v1
- No login in v1, allow optional `X-User-Id` context
- Unknown `X-User-Id` auto-creates a user in v1
- Entry deletion uses hard delete
- Schedule representation uses simple custom JSON (not RRULE)
- Notifications include follow-up reminders when item remains incomplete
- Offline cache window is rolling last 30 days
- No `/api/v1` prefix; maintain backwards compatibility without path versioning
- Seed a default local user for requests without `X-User-Id`
- Sync conflict policy is strict last-write-wins
- Backups are handled outside the application scope in v1
- v1 stats are tracker-level only
- OpenAPI spec is generated by backend code, not hand-authored

## 15. Finalized Decisions
1. Unknown `X-User-Id` auto-creates a user record.
2. Entry deletion is hard delete.
3. Schedule config uses simple custom JSON.
4. Reminders include follow-up notifications when still incomplete.
5. Offline cache is a rolling 30-day window.
6. No URL-based API versioning; keep compatibility by contract discipline.

## 16. Remaining Questions
No open architecture questions for v1 at this time.

## 17. Proposed Next Step
Convert finalized architecture decisions into ADRs:
- `ADR-001`: user context and no-login policy
- `ADR-002`: schedule representation
- `ADR-003`: sync conflict and deletion policy
- `ADR-004`: notification strategy
