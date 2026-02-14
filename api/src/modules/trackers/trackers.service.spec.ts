import { strict as assert } from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TrackerFieldEntity } from '../../database/entities/tracker-field.entity';
import { TrackerEntity } from '../../database/entities/tracker.entity';
import { TrackersService } from './trackers.service';

describe('TrackersService (integration)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let trackersService: TrackersService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [TrackerEntity, TrackerFieldEntity],
          synchronize: true,
        }),
      ],
      providers: [TrackersService],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    trackersService = moduleRef.get(TrackersService);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await moduleRef.close();
  });

  it('creates and returns a tracker with normalized schedule and fields', async () => {
    const created = await trackersService.createForUser('user-a', {
      name: 'Blood Pressure',
      description: 'Morning check',
      schedule: {
        kind: 'custom',
        times: ['21:00', '08:00'],
        days: ['wed', 'mon'],
      },
      fields: [
        {
          fieldKey: 'systolic',
          primitiveType: 'number',
          unit: 'mmHg',
          validation: {
            min: 80,
            max: 220,
          },
        },
        {
          fieldKey: 'diastolic',
          primitiveType: 'number',
          unit: 'mmHg',
          validation: {
            min: 40,
            max: 140,
          },
        },
      ],
    });

    assert.equal(created.userId, 'user-a');
    assert.equal(created.name, 'Blood Pressure');
    assert.deepEqual(created.schedule, {
      kind: 'custom',
      times: ['08:00', '21:00'],
      days: ['wed', 'mon'],
    });
    assert.equal(created.fields.length, 2);
    assert.equal(created.fields[0].fieldKey, 'systolic');
    assert.equal(created.fields[1].fieldKey, 'diastolic');
  });

  it('lists only non-archived trackers for a user', async () => {
    const created = await trackersService.createForUser('user-a', {
      name: 'Hydration',
      schedule: {
        kind: 'daily',
        times: ['08:30'],
      },
      fields: [{ fieldKey: 'ounces', primitiveType: 'number' }],
    });

    await dataSource
      .getRepository(TrackerEntity)
      .update({ id: created.id }, { is_archived: true });

    await trackersService.createForUser('user-a', {
      name: 'Meditation',
      schedule: {
        kind: 'weekdays',
        times: ['07:00'],
      },
      fields: [{ fieldKey: 'minutes', primitiveType: 'duration' }],
    });

    await trackersService.createForUser('user-b', {
      name: 'Walk',
      schedule: {
        kind: 'daily',
        times: ['12:00'],
      },
      fields: [{ fieldKey: 'done', primitiveType: 'boolean' }],
    });

    const listed = await trackersService.listForUser('user-a');
    assert.equal(listed.length, 1);
    assert.equal(listed[0].name, 'Meditation');
  });

  it('rejects invalid tracker payloads', async () => {
    await assert.rejects(
      () =>
        trackersService.createForUser('user-a', {
          name: '  ',
          schedule: {
            kind: 'daily',
            times: ['08:00'],
          },
          fields: [{ fieldKey: 'done', primitiveType: 'boolean' }],
        }),
      BadRequestException,
    );

    await assert.rejects(
      () =>
        trackersService.createForUser('user-a', {
          name: 'Mood',
          schedule: {
            kind: 'daily',
            times: ['24:00'],
          },
          fields: [{ fieldKey: 'note', primitiveType: 'text' }],
        }),
      BadRequestException,
    );

    await assert.rejects(
      () =>
        trackersService.createForUser('user-a', {
          name: 'Sleep',
          schedule: {
            kind: 'daily',
            times: ['07:00'],
          },
          fields: [{ fieldKey: 'hours', primitiveType: 'json' }],
        }),
      BadRequestException,
    );
  });
});
