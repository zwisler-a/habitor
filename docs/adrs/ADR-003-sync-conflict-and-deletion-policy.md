# ADR-003: Sync Conflict and Deletion Policy

- Status: Accepted
- Date: 2026-02-14

## Context
The app is offline-first with queued mutations and reconnect replay. v1 needs deterministic conflict behavior and clear deletion semantics.

## Decision
1. Conflict resolution policy is strict last-write-wins.
2. Entry deletion policy is hard delete (no soft-delete recovery in v1).
3. Offline cache keeps a rolling 30-day window of history.

## Consequences
1. Sync logic remains simple and predictable.
2. Deleted data is not recoverable through app logic in v1.
3. Historical views beyond 30 days require fresh server fetch and are not guaranteed offline.
4. If auditability is needed later, revision history/versioning will need to be introduced in a future ADR.
