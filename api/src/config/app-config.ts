import type { AppConfig, NodeEnv } from './app-config.types';

type EnvInput = Record<string, string | undefined>;

const VALID_NODE_ENVS: NodeEnv[] = ['development', 'test', 'production'];

export function loadAppConfig(env: EnvInput = process.env): AppConfig {
  const errors: string[] = [];

  const nodeEnvRaw = env.NODE_ENV ?? 'development';
  const nodeEnv = parseNodeEnv(nodeEnvRaw, errors);

  const host = env.HOST?.trim() || '0.0.0.0';
  const port = parsePort(env.PORT, errors);
  const corsOrigin = env.CORS_ORIGIN?.trim() || 'http://localhost:4200';
  const sqlitePath = parseRequired('SQLITE_PATH', env.SQLITE_PATH, errors);

  const firebaseServiceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    nodeEnv,
    host,
    port,
    corsOrigin,
    sqlitePath,
    firebaseServiceAccountJson: firebaseServiceAccountJson || undefined,
  };
}

function parseNodeEnv(value: string, errors: string[]): NodeEnv {
  if (VALID_NODE_ENVS.includes(value as NodeEnv)) {
    return value as NodeEnv;
  }

  errors.push(
    `NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')}. Received: ${value}`,
  );
  return 'development';
}

function parsePort(value: string | undefined, errors: string[]): number {
  const resolved = value ?? '3000';
  const trimmed = resolved.trim();

  if (!/^\d+$/.test(trimmed)) {
    errors.push(
      `PORT must be an integer between 1 and 65535. Received: ${resolved}`,
    );
    return 3000;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    errors.push(
      `PORT must be an integer between 1 and 65535. Received: ${resolved}`,
    );
    return 3000;
  }

  return parsed;
}

function parseRequired(
  name: string,
  value: string | undefined,
  errors: string[],
): string {
  const resolved = value?.trim();

  if (!resolved) {
    errors.push(`${name} is required.`);
    return '';
  }

  return resolved;
}
