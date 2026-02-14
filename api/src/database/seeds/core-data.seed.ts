import { DataSource } from 'typeorm';
import { TrackerFieldEntity } from '../entities/tracker-field.entity';
import { TrackerEntity } from '../entities/tracker.entity';
import { UserEntity } from '../entities/user.entity';
import {
  DEFAULT_USER_ID,
  DEFAULT_USER_NAME,
} from '../../user-context/user-context.constants';

type SeedTracker = Omit<TrackerEntity, 'created_at' | 'updated_at'>;
type SeedTrackerField = TrackerFieldEntity;

const seedTrackers: SeedTracker[] = [
  {
    id: 'seed-water-intake',
    user_id: DEFAULT_USER_ID,
    name: 'Water Intake',
    description: 'Track daily water intake in ounces.',
    is_archived: false,
    schedule_config_json: JSON.stringify({
      kind: 'daily',
      times: ['09:00', '13:00', '18:00'],
    }),
  },
  {
    id: 'seed-meditation',
    user_id: DEFAULT_USER_ID,
    name: 'Meditation',
    description: 'Log meditation minutes on weekdays.',
    is_archived: false,
    schedule_config_json: JSON.stringify({
      kind: 'weekdays',
      times: ['07:30'],
    }),
  },
  {
    id: 'seed-blood-pressure',
    user_id: DEFAULT_USER_ID,
    name: 'Blood Pressure',
    description: 'Track systolic and diastolic pressure readings.',
    is_archived: false,
    schedule_config_json: JSON.stringify({
      kind: 'daily',
      times: ['08:00', '20:00'],
    }),
  },
];

const seedTrackerFields: SeedTrackerField[] = [
  {
    id: 'seed-water-ounces',
    tracker_id: 'seed-water-intake',
    field_key: 'ounces',
    primitive_type: 'number',
    unit: 'oz',
    validation_json: JSON.stringify({ min: 0, max: 256 }),
    target_json: JSON.stringify({ dailyTarget: 80 }),
    sort_order: 0,
  },
  {
    id: 'seed-meditation-minutes',
    tracker_id: 'seed-meditation',
    field_key: 'minutes',
    primitive_type: 'duration',
    unit: 'sec',
    validation_json: JSON.stringify({ min: 60, max: 7200 }),
    target_json: JSON.stringify({ dailyTargetSec: 600 }),
    sort_order: 0,
  },
  {
    id: 'seed-blood-pressure-systolic',
    tracker_id: 'seed-blood-pressure',
    field_key: 'systolic',
    primitive_type: 'number',
    unit: 'mmHg',
    validation_json: JSON.stringify({ min: 70, max: 260, integer: true }),
    target_json: null,
    sort_order: 0,
  },
  {
    id: 'seed-blood-pressure-diastolic',
    tracker_id: 'seed-blood-pressure',
    field_key: 'diastolic',
    primitive_type: 'number',
    unit: 'mmHg',
    validation_json: JSON.stringify({ min: 40, max: 180, integer: true }),
    target_json: null,
    sort_order: 1,
  },
];

export async function seedCoreData(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    await manager.getRepository(UserEntity).upsert(
      {
        id: DEFAULT_USER_ID,
        name: DEFAULT_USER_NAME,
        is_default: true,
      },
      ['id'],
    );

    for (const tracker of seedTrackers) {
      await manager.getRepository(TrackerEntity).upsert(tracker, ['id']);
    }

    for (const field of seedTrackerFields) {
      await manager.getRepository(TrackerFieldEntity).upsert(field, ['id']);
    }
  });
}
