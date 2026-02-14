import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.SQLITE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    return request(server)
      .get('/')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as Record<string, unknown>;
        expect(body.status).toBe('ok');
        expect(body.service).toBe('habitor-api');
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('/trackers (POST/GET)', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const created = await request(server)
      .post('/trackers')
      .set('X-User-Id', 'e2e-user')
      .send({
        name: 'Hydration',
        schedule: {
          kind: 'daily',
          times: ['08:00'],
        },
        fields: [{ fieldKey: 'ounces', primitiveType: 'number' }],
      })
      .expect(201);

    const createdBody = created.body as Record<string, unknown>;
    expect(createdBody.name).toBe('Hydration');

    return request(server)
      .get('/trackers')
      .set('X-User-Id', 'e2e-user')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as Array<Record<string, unknown>>;
        expect(body.length).toBe(1);
        expect(body[0]?.name).toBe('Hydration');
      });
  });
});
