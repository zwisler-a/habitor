# ADR-004: Notification Strategy

- Status: Accepted
- Date: 2026-02-14

## Context
v1 requires push reminders while minimizing operational complexity and third-party usage.

## Decision
1. Use Firebase Cloud Messaging (FCM) for push delivery.
2. Keep reminder scheduling in the main NestJS process (no separate worker container).
3. Send reminders at configured times and allow follow-up reminders if a tracker remains incomplete.
4. Device tokens are stored per user/device and used by the notifications module.

## Consequences
1. Deployment remains single-container for app runtime.
2. Scheduler logic must be idempotent and restart-safe.
3. Follow-up reminders may increase notification volume; preference controls are required.
4. Push delivery depends on FCM availability and valid device token lifecycle management.
