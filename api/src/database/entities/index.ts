import { DeviceTokenEntity } from './device-token.entity';
import { EntryValueEntity } from './entry-value.entity';
import { EntryEntity } from './entry.entity';
import { ReminderJobEntity } from './reminder-job.entity';
import { TrackerFieldEntity } from './tracker-field.entity';
import { TrackerEntity } from './tracker.entity';
import { UserEntity } from './user.entity';

export const entities = [
  UserEntity,
  TrackerEntity,
  TrackerFieldEntity,
  EntryEntity,
  EntryValueEntity,
  DeviceTokenEntity,
  ReminderJobEntity,
];
