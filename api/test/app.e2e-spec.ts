import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
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
  });

  it('/ (GET)', () => {
    const server = app.getHttpAdapter().getInstance() as Parameters<
      typeof request
    >[0];

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
});
