import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { InitialSchema1739535000000 } from './migrations/1739535000000-initial-schema';

loadEnvironment();

const sqlitePath = process.env.SQLITE_PATH || './data/habitor.sqlite';
ensureParentDirectory(sqlitePath);

export default new DataSource({
  type: 'sqlite',
  database: sqlitePath,
  entities,
  migrations: [InitialSchema1739535000000],
  synchronize: false,
});

function loadEnvironment() {
  const envCandidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];

  for (const path of envCandidates) {
    if (existsSync(path)) {
      loadDotenv({ path });
      return;
    }
  }
}

function ensureParentDirectory(path: string) {
  const resolvedPath = resolve(path);
  const parentDirectory = dirname(resolvedPath);
  mkdirSync(parentDirectory, { recursive: true });
}
