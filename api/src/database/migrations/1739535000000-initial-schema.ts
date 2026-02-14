import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1739535000000 implements MigrationInterface {
  name = 'InitialSchema1739535000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "is_default" integer NOT NULL DEFAULT 0,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "trackers" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "is_archived" integer NOT NULL DEFAULT 0,
        "schedule_config_json" text NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "fk_trackers_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_trackers_user_id" ON "trackers" ("user_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "tracker_fields" (
        "id" text PRIMARY KEY NOT NULL,
        "tracker_id" text NOT NULL,
        "field_key" text NOT NULL,
        "primitive_type" text NOT NULL,
        "unit" text,
        "validation_json" text,
        "target_json" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "fk_tracker_fields_tracker" FOREIGN KEY ("tracker_id") REFERENCES "trackers" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tracker_fields_tracker_id_field_key" ON "tracker_fields" ("tracker_id", "field_key");`,
    );

    await queryRunner.query(`
      CREATE TABLE "entries" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "tracker_id" text NOT NULL,
        "occurred_at" datetime NOT NULL,
        "note" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "fk_entries_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_entries_tracker" FOREIGN KEY ("tracker_id") REFERENCES "trackers" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_entries_user_id" ON "entries" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entries_tracker_id" ON "entries" ("tracker_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entries_occurred_at" ON "entries" ("occurred_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE "entry_values" (
        "id" text PRIMARY KEY NOT NULL,
        "entry_id" text NOT NULL,
        "field_key" text NOT NULL,
        "value_bool" integer,
        "value_num" real,
        "value_duration_sec" integer,
        "value_text" text,
        CONSTRAINT "fk_entry_values_entry" FOREIGN KEY ("entry_id") REFERENCES "entries" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_entry_values_entry_id" ON "entry_values" ("entry_id");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_entry_values_entry_id_field_key" ON "entry_values" ("entry_id", "field_key");`,
    );

    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "token" text NOT NULL,
        "platform" text NOT NULL,
        "last_seen_at" datetime NOT NULL,
        CONSTRAINT "fk_device_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_device_tokens_user_id" ON "device_tokens" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_device_tokens_token" ON "device_tokens" ("token");`,
    );

    await queryRunner.query(`
      CREATE TABLE "reminder_jobs" (
        "id" text PRIMARY KEY NOT NULL,
        "tracker_id" text NOT NULL,
        "next_run_at" datetime NOT NULL,
        "last_run_at" datetime,
        "status" text NOT NULL,
        "last_error" text,
        CONSTRAINT "fk_reminder_jobs_tracker" FOREIGN KEY ("tracker_id") REFERENCES "trackers" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_reminder_jobs_tracker_id" ON "reminder_jobs" ("tracker_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_reminder_jobs_next_run_at" ON "reminder_jobs" ("next_run_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_reminder_jobs_next_run_at";`);
    await queryRunner.query(`DROP INDEX "idx_reminder_jobs_tracker_id";`);
    await queryRunner.query(`DROP TABLE "reminder_jobs";`);

    await queryRunner.query(`DROP INDEX "uq_device_tokens_token";`);
    await queryRunner.query(`DROP INDEX "idx_device_tokens_user_id";`);
    await queryRunner.query(`DROP TABLE "device_tokens";`);

    await queryRunner.query(`DROP INDEX "uq_entry_values_entry_id_field_key";`);
    await queryRunner.query(`DROP INDEX "idx_entry_values_entry_id";`);
    await queryRunner.query(`DROP TABLE "entry_values";`);

    await queryRunner.query(`DROP INDEX "idx_entries_occurred_at";`);
    await queryRunner.query(`DROP INDEX "idx_entries_tracker_id";`);
    await queryRunner.query(`DROP INDEX "idx_entries_user_id";`);
    await queryRunner.query(`DROP TABLE "entries";`);

    await queryRunner.query(
      `DROP INDEX "uq_tracker_fields_tracker_id_field_key";`,
    );
    await queryRunner.query(`DROP TABLE "tracker_fields";`);

    await queryRunner.query(`DROP INDEX "idx_trackers_user_id";`);
    await queryRunner.query(`DROP TABLE "trackers";`);

    await queryRunner.query(`DROP TABLE "users";`);
  }
}
