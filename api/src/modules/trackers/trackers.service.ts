import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  parsePrimitiveType,
  type PrimitiveFieldDefinition,
  validatePrimitiveFieldDefinition,
  type PrimitiveValidation,
} from '../../domain/primitives/primitive-field.model';
import {
  normalizeSchedule,
  type ScheduleConfig,
} from '../../domain/schedule/schedule.model';
import { TrackerFieldEntity } from '../../database/entities/tracker-field.entity';
import { TrackerEntity } from '../../database/entities/tracker.entity';

export interface CreateTrackerFieldInput {
  fieldKey: string;
  primitiveType: string;
  unit?: string | null;
  validation?: PrimitiveValidation | null;
  target?: Record<string, unknown> | null;
  sortOrder?: number;
}

export interface CreateTrackerInput {
  name: string;
  description?: string | null;
  schedule: ScheduleConfig;
  fields: CreateTrackerFieldInput[];
}

export interface TrackerFieldView {
  id: string;
  fieldKey: string;
  primitiveType: string;
  unit: string | null;
  validation: PrimitiveValidation | null;
  target: Record<string, unknown> | null;
  sortOrder: number;
}

export interface TrackerView {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  schedule: ScheduleConfig;
  fields: TrackerFieldView[];
}

@Injectable()
export class TrackersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createForUser(
    userId: string,
    input: CreateTrackerInput,
  ): Promise<TrackerView> {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Tracker name is required.');
    }

    if (!Array.isArray(input.fields) || input.fields.length === 0) {
      throw new BadRequestException('Tracker requires at least one field.');
    }

    let normalizedSchedule: ScheduleConfig;
    try {
      normalizedSchedule = normalizeSchedule(input.schedule);
    } catch (error: unknown) {
      throw new BadRequestException(toErrorMessage(error));
    }

    const normalizedFields = this.normalizeFields(input.fields);
    const trackerId = randomUUID();

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TrackerEntity).insert({
        id: trackerId,
        user_id: userId,
        name,
        description: input.description?.trim() || null,
        is_archived: false,
        schedule_config_json: JSON.stringify(normalizedSchedule),
      });

      for (const field of normalizedFields) {
        await manager.getRepository(TrackerFieldEntity).insert({
          id: randomUUID(),
          tracker_id: trackerId,
          field_key: field.fieldKey,
          primitive_type: field.primitiveType,
          unit: field.unit,
          validation_json: field.validation
            ? JSON.stringify(field.validation)
            : null,
          target_json: field.target ? JSON.stringify(field.target) : null,
          sort_order: field.sortOrder,
        });
      }
    });

    return this.getByIdForUser(userId, trackerId);
  }

  async listForUser(userId: string): Promise<TrackerView[]> {
    const trackers = await this.dataSource.getRepository(TrackerEntity).find({
      where: {
        user_id: userId,
        is_archived: false,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return Promise.all(
      trackers.map(async (tracker) => this.getByIdForUser(userId, tracker.id)),
    );
  }

  private normalizeFields(fields: CreateTrackerFieldInput[]): Array<
    PrimitiveFieldDefinition & {
      sortOrder: number;
      target: Record<string, unknown> | null;
    }
  > {
    const normalized: Array<
      PrimitiveFieldDefinition & {
        sortOrder: number;
        target: Record<string, unknown> | null;
      }
    > = [];
    const seenFieldKeys = new Set<string>();

    fields.forEach((field, index) => {
      try {
        const primitiveType = parsePrimitiveType(field.primitiveType);
        const normalizedField: PrimitiveFieldDefinition = {
          fieldKey: field.fieldKey?.trim() ?? '',
          primitiveType,
          unit: field.unit?.trim() || null,
          validation: field.validation ?? null,
        };
        validatePrimitiveFieldDefinition(normalizedField);

        if (seenFieldKeys.has(normalizedField.fieldKey)) {
          throw new BadRequestException(
            `Duplicate fieldKey: ${normalizedField.fieldKey}`,
          );
        }
        seenFieldKeys.add(normalizedField.fieldKey);

        normalized.push({
          ...normalizedField,
          sortOrder: field.sortOrder ?? index,
          target: field.target ?? null,
        });
      } catch (error: unknown) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(toErrorMessage(error));
      }
    });

    return normalized;
  }

  private async getByIdForUser(
    userId: string,
    trackerId: string,
  ): Promise<TrackerView> {
    const tracker = await this.dataSource
      .getRepository(TrackerEntity)
      .findOneByOrFail({
        id: trackerId,
        user_id: userId,
      });

    const trackerFields = await this.dataSource
      .getRepository(TrackerFieldEntity)
      .find({
        where: { tracker_id: tracker.id },
        order: { sort_order: 'ASC' },
      });

    return {
      id: tracker.id,
      userId: tracker.user_id,
      name: tracker.name,
      description: tracker.description,
      schedule: JSON.parse(tracker.schedule_config_json) as ScheduleConfig,
      fields: trackerFields.map((field) => ({
        id: field.id,
        fieldKey: field.field_key,
        primitiveType: field.primitive_type,
        unit: field.unit,
        validation: field.validation_json
          ? (JSON.parse(field.validation_json) as PrimitiveValidation)
          : null,
        target: field.target_json
          ? (JSON.parse(field.target_json) as Record<string, unknown>)
          : null,
        sortOrder: field.sort_order,
      })),
    };
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
