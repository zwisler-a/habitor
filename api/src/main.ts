import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { loadAppConfig } from './config/app-config';

loadEnvironment();

async function bootstrap() {
  const config = loadAppConfig();
  ensureParentDirectory(config.sqlitePath);

  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  app.enableCors({ origin: config.corsOrigin });
  await app.listen(config.port, config.host);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start API:\n${message}`);
  process.exit(1);
});

function loadEnvironment() {
  const envCandidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
  ];

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
