# ADR-002: Schedule Representation

- Status: Accepted
- Date: 2026-02-14

## Context
Trackers need configurable schedules for daily, weekday, custom-day, and times-per-day behavior. The format should be simple to validate and evolve for v1.

## Decision
1. Use a simple custom JSON schedule model stored per tracker.
2. Do not use RRULE in v1.
3. Validation is handled in backend DTO/service logic.
4. Reminder computation and due-state logic both derive from this same schedule JSON model.

## Consequences
1. Implementation is simpler and clearer for v1 requirements.
2. Backend and frontend must share strict JSON schema expectations.
3. Future interoperability with calendar tools may require a translation layer if RRULE support is added later.
