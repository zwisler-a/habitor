import { strict as assert } from 'node:assert';
import { DataSource } from 'typeorm';
import { TrackerFieldEntity } from '../entities/tracker-field.entity';
import { TrackerEntity } from '../entities/tracker.entity';
import { UserEntity } from '../entities/user.entity';
import { seedCoreData } from './core-data.seed';
import { DEFAULT_USER_ID } from '../../user-context/user-context.constants';

describe('seedCoreData', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [UserEntity, TrackerEntity, TrackerFieldEntity],
      synchronize: true,
    });

    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('creates default core seed records', async () => {
    await seedCoreData(dataSource);

    const users = await dataSource.getRepository(UserEntity).find();
    const trackers = await dataSource.getRepository(TrackerEntity).find();
    const trackerFields = await dataSource
      .getRepository(TrackerFieldEntity)
      .find();

    assert.equal(users.length, 1);
    assert.equal(users[0].id, DEFAULT_USER_ID);
    assert.equal(trackers.length, 3);
    assert.equal(
      trackers.every((tracker) => tracker.user_id === DEFAULT_USER_ID),
      true,
    );
    assert.equal(trackerFields.length, 4);
    assert.equal(
      trackerFields.filter(
        (field) => field.tracker_id === 'seed-blood-pressure',
      ).length,
      2,
    );
  });

  it('is safe to rerun without creating duplicate records', async () => {
    await seedCoreData(dataSource);
    await seedCoreData(dataSource);

    const users = await dataSource.getRepository(UserEntity).find();
    const trackers = await dataSource.getRepository(TrackerEntity).find();
    const trackerFields = await dataSource
      .getRepository(TrackerFieldEntity)
      .find();

    assert.equal(users.length, 1);
    assert.equal(trackers.length, 3);
    assert.equal(trackerFields.length, 4);
  });
});
