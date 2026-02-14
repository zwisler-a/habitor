import dataSource from '../data-source';
import { seedCoreData } from './core-data.seed';

async function run() {
  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
    await seedCoreData(dataSource);
    console.log('Core seed data applied.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Failed to seed core data.', error);
  process.exitCode = 1;
});
