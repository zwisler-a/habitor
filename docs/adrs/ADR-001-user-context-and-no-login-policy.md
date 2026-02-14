# ADR-001: User Context and No-Login Policy

- Status: Accepted
- Date: 2026-02-14

## Context
v1 must run without login while remaining compatible with future multi-user support. The system also needs a predictable user context for all data access.

## Decision
1. v1 uses no authentication flow.
2. API accepts optional `X-User-Id` header to select active user context.
3. If `X-User-Id` is missing, use a seeded default user.
4. If `X-User-Id` is unknown, auto-create a user record for that id.
5. All domain data is user-scoped and must enforce `user_id` filtering on every query path.

## Consequences
1. Local and family-like usage are possible without auth setup friction.
2. Strict user scoping is mandatory in repositories/services even without real auth.
3. Migration to real auth is possible without schema redesign because records are already user-partitioned.
4. Header misuse can create unintended users; this is acceptable in v1 local deployment context.
