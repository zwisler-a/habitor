#!/usr/bin/env bash
set -euo pipefail

repo="${1:-zwisler-a/habitor}"

issue_number_by_title() {
  local title="$1"
  gh issue list \
    --repo "$repo" \
    --state all \
    --search "in:title \"$title\"" \
    --json number,title \
    --jq ".[] | select(.title==\"$title\") | .number" | head -n1
}

create_epic() {
  local title="$1"
  local body="$2"
  local existing
  existing="$(issue_number_by_title "$title" || true)"
  if [[ -n "$existing" ]]; then
    echo "$existing"
    return
  fi

  local url
  url="$(gh issue create --repo "$repo" --title "$title" --body "$body" --label epic --label type:feature)"
  echo "${url##*/}"
}

create_child() {
  local epic_num="$1"
  local title="$2"
  local body="$3"
  local labels_csv="$4"
  local existing
  existing="$(issue_number_by_title "$title" || true)"
  if [[ -n "$existing" ]]; then
    echo "Reusing child #$existing $title"
    return
  fi

  local args=()
  IFS="," read -r -a labels <<< "$labels_csv"
  for label in "${labels[@]}"; do
    args+=(--label "$label")
  done

  gh issue create \
    --repo "$repo" \
    --title "$title" \
    --body "Parent epic: #$epic_num

$body" \
    "${args[@]}" >/dev/null
  echo "Created child $title"
}

foundation="$(create_epic "Epic: Project Foundation" "Establish repository, local deployment, CI, and baseline configuration for the product build.")"
core_domain="$(create_epic "Epic: Core Domain and Data Model" "Implement TypeORM entities, migrations, primitive tracker model, scheduling model, and seed data.")"
user_context="$(create_epic "Epic: User Context (No Login v1)" "Support no-login operation with optional X-User-Id header and strict user-scoped data access.")"
tracker_api="$(create_epic "Epic: Tracker Management APIs" "Build CRUD and validation APIs for configurable primitive-based trackers.")"
entries_api="$(create_epic "Epic: Entry Logging APIs" "Support multi-field entry creation, editing, deletion policy, and history queries.")"
angular_app="$(create_epic "Epic: Mobile-First Angular App" "Deliver mobile-first PWA UI for today flow, tracker configuration, and history.")"
offline_sync="$(create_epic "Epic: Offline-First and Sync" "Implement IndexedDB cache, mutation queue, reconnect sync, and conflict handling.")"
notifications="$(create_epic "Epic: Notifications (Firebase)" "Implement token registration, in-process scheduler, and FCM reminder delivery.")"
stats="$(create_epic "Epic: Basic Stats and Insights (MVP Level)" "Provide streak/completion/trend metrics and frontend visualizations.")"
quality="$(create_epic "Epic: Quality, Security, and Operability" "Establish automated testing, observability, and SQLite backup/restore operations.")"

create_child "$foundation" "HAB-001 Monorepo scaffold (Angular + NestJS + shared types)" "Acceptance criteria: web and api run locally; shared TS types compile; one command starts both." "type:infra,priority:p0"
create_child "$foundation" "HAB-002 Docker local deployment with SQLite persistence" "Acceptance criteria: docker compose starts app + API; SQLite persists across restarts." "type:infra,priority:p1"
create_child "$foundation" "HAB-003 Environment and config management" "Acceptance criteria: typed config modules; .env.example documented; clear startup validation errors." "type:infra,priority:p1"
create_child "$foundation" "HAB-004 CI baseline (lint, typecheck, unit tests)" "Acceptance criteria: CI runs on PR; lint/tests gate merges." "type:infra,priority:p1"

create_child "$core_domain" "HAB-010 TypeORM entities and migrations" "Acceptance criteria: tables/indexes for users, trackers, tracker_fields, entries, entry_values, device_tokens, reminder_jobs; rollback works." "type:feature,priority:p0"
create_child "$core_domain" "HAB-011 Primitive field model and validation" "Acceptance criteria: boolean/number/duration/text support; invalid type/value combinations rejected." "type:feature,priority:p0"
create_child "$core_domain" "HAB-012 Scheduling model and validation" "Acceptance criteria: daily/weekdays/custom days/times-per-day persisted and validated; next due calculable." "type:feature,priority:p1"
create_child "$core_domain" "HAB-013 Seed data for default local user and samples" "Acceptance criteria: seed creates default user and sample trackers including blood pressure composition." "type:feature,priority:p2"

create_child "$user_context" "HAB-020 Request-scoped user resolution via X-User-Id" "Acceptance criteria: routes resolve user from header with fallback default user; invalid IDs handled cleanly." "type:feature,priority:p0"
create_child "$user_context" "HAB-021 User scoping guard for repository queries" "Acceptance criteria: endpoints never read/write cross-user data." "type:feature,priority:p0"
create_child "$user_context" "HAB-022 OpenAPI docs for header behavior" "Acceptance criteria: API docs include X-User-Id semantics and examples." "type:docs,priority:p2"

create_child "$tracker_api" "HAB-030 Create/update/archive tracker endpoints" "Acceptance criteria: create/update/archive with primitive fields and schedules; archive excluded from Today by default." "type:feature,priority:p0"
create_child "$tracker_api" "HAB-031 Tracker list/detail with due metadata" "Acceptance criteria: active list includes next due and completion state for selected date." "type:feature,priority:p1"
create_child "$tracker_api" "HAB-032 Field-level validation and metadata APIs" "Acceptance criteria: min/max/required/unit/target validation with structured error responses." "type:feature,priority:p1"

create_child "$entries_api" "HAB-040 Create entry endpoint with multi-field payload" "Acceptance criteria: one entry stores many field values; backdated timestamps supported." "type:feature,priority:p0"
create_child "$entries_api" "HAB-041 Edit/delete entry endpoints with audit timestamps" "Acceptance criteria: user-scoped update/delete; updated_at maintained; delete policy implemented." "type:feature,priority:p1"
create_child "$entries_api" "HAB-042 History query endpoint (range + tracker filter)" "Acceptance criteria: paginated range queries with values and notes." "type:feature,priority:p1"

create_child "$angular_app" "HAB-050 Mobile-first app shell and responsive layout" "Acceptance criteria: usable at 360px width; installable PWA shell." "type:feature,priority:p0"
create_child "$angular_app" "HAB-051 Today screen with one-tap check-in" "Acceptance criteria: due list sorted; common check-in under 10 seconds." "type:feature,priority:p0"
create_child "$angular_app" "HAB-052 Tracker management UI with primitive field builder" "Acceptance criteria: dynamic primitive field builder with validation config." "type:feature,priority:p1"
create_child "$angular_app" "HAB-053 Entry form for composed trackers" "Acceptance criteria: multi-input composed trackers (e.g., BP) validate and submit correctly." "type:feature,priority:p1"
create_child "$angular_app" "HAB-054 History/calendar UI and entry editing" "Acceptance criteria: date navigation and entry edits work online/offline." "type:feature,priority:p1"

create_child "$offline_sync" "HAB-060 IndexedDB cache for core data" "Acceptance criteria: key views load without network from local cache." "type:feature,priority:p0"
create_child "$offline_sync" "HAB-061 Offline mutation queue" "Acceptance criteria: writes queue offline with optimistic UI." "type:feature,priority:p0"
create_child "$offline_sync" "HAB-062 Reconnect sync engine with retry/backoff" "Acceptance criteria: queued mutations replay on reconnect; transient errors retry." "type:feature,priority:p1"
create_child "$offline_sync" "HAB-063 Conflict handling policy and sync UX" "Acceptance criteria: deterministic last-write-wins behavior and visible sync status/errors." "type:feature,priority:p1"

create_child "$notifications" "HAB-070 Device token registration endpoint + client integration" "Acceptance criteria: per-device token storage and deduplication." "type:feature,priority:p1"
create_child "$notifications" "HAB-071 In-process reminder scheduler in NestJS" "Acceptance criteria: due reminders computed from schedules; missed runs recover on restart." "type:feature,priority:p1"
create_child "$notifications" "HAB-072 FCM send service and delivery logging" "Acceptance criteria: firebase-admin sends reminders; failures logged with reason/retry status." "type:feature,priority:p1"
create_child "$notifications" "HAB-073 Notification preferences per tracker" "Acceptance criteria: per-tracker enable/disable + reminder settings persisted and enforced." "type:feature,priority:p2"

create_child "$stats" "HAB-080 Aggregation endpoints for streaks and completion" "Acceptance criteria: per-tracker and overall 7/30-day metrics." "type:feature,priority:p2"
create_child "$stats" "HAB-081 Trend charts in tracker detail" "Acceptance criteria: number/duration trends and boolean completion trends rendered." "type:feature,priority:p2"
create_child "$stats" "HAB-082 Stats performance and caching pass" "Acceptance criteria: common dashboard metrics query under target threshold in local dataset." "type:tech-debt,priority:p3"

create_child "$quality" "HAB-090 Unit tests for validators/schedule/user-scope" "Acceptance criteria: target coverage for core domain modules." "type:tech-debt,priority:p1"
create_child "$quality" "HAB-091 Integration tests for tracker and entry workflows" "Acceptance criteria: end-to-end API workflows covered." "type:tech-debt,priority:p1"
create_child "$quality" "HAB-092 Frontend e2e smoke tests for Today/check-in" "Acceptance criteria: CI e2e pass headless browser." "type:tech-debt,priority:p2"
create_child "$quality" "HAB-093 Observability baseline" "Acceptance criteria: structured logs, error handling, health endpoints with dependency checks." "type:infra,priority:p2"
create_child "$quality" "HAB-094 SQLite backup and restore scripts" "Acceptance criteria: backup/restore scripts documented and verified." "type:infra,priority:p2"

echo "EPICS:"
echo "Project Foundation #$foundation"
echo "Core Domain and Data Model #$core_domain"
echo "User Context #$user_context"
echo "Tracker Management APIs #$tracker_api"
echo "Entry Logging APIs #$entries_api"
echo "Mobile-First Angular App #$angular_app"
echo "Offline-First and Sync #$offline_sync"
echo "Notifications #$notifications"
echo "Basic Stats #$stats"
echo "Quality and Operability #$quality"
