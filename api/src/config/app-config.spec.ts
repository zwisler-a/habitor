import { loadAppConfig } from './app-config';

describe('loadAppConfig', () => {
  it('loads config with defaults and required fields', () => {
    const config = loadAppConfig({
      SQLITE_PATH: './data/habitor.sqlite',
    });

    expect(config.nodeEnv).toBe('development');
    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(3000);
    expect(config.corsOrigin).toBe('http://localhost:4200');
    expect(config.sqlitePath).toBe('./data/habitor.sqlite');
  });

  it('throws aggregated validation errors for invalid environment', () => {
    expect(() =>
      loadAppConfig({
        NODE_ENV: 'local',
        PORT: '99999',
        SQLITE_PATH: ' ',
      }),
    ).toThrow(
      'Environment validation failed:\n- NODE_ENV must be one of: development, test, production. Received: local\n- PORT must be an integer between 1 and 65535. Received: 99999\n- SQLITE_PATH is required.',
    );
  });
});
