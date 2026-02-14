export type NodeEnv = 'development' | 'test' | 'production';

export interface AppConfig {
  nodeEnv: NodeEnv;
  host: string;
  port: number;
  corsOrigin: string;
  sqlitePath: string;
  firebaseServiceAccountJson?: string;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
