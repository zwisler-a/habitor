import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { loadAppConfig } from './config/app-config';

loadEnvironment();

async function bootstrap() {
  const config = loadAppConfig();
  ensureParentDirectory(config.sqlitePath);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureStaticAssets(app, config.nodeEnv);

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

function configureStaticAssets(
  app: NestExpressApplication,
  nodeEnv: string,
): void {
  if (nodeEnv !== 'production') {
    return;
  }

  const assetRoot = resolveStaticAssetRoot();
  if (!assetRoot) {
    console.warn(
      'Production web assets were not found. Continuing without static hosting.',
    );
    return;
  }

  app.useStaticAssets(assetRoot, { prefix: '/app/' });
  const expressApp = app.getHttpAdapter().getInstance() as {
    get: (path: RegExp, handler: (req: Request, res: Response) => void) => void;
  };

  expressApp.get(/^\/app(\/.*)?$/, (_request: Request, response: Response) => {
    response.sendFile(join(assetRoot, 'index.html'));
  });
}

function resolveStaticAssetRoot(): string | null {
  const candidates = [
    resolve(process.cwd(), 'public/web'),
    resolve(process.cwd(), '..', 'web', 'dist', 'web', 'browser'),
    resolve(__dirname, '..', 'public', 'web'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return null;
}
