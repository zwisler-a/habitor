import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { UserContextService } from './user-context.service';

describe('UserContextService (integration)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let userContextService: UserContextService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      ],
      providers: [UserContextService],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    userContextService = moduleRef.get(UserContextService);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await moduleRef.close();
  });

  it('uses a default user when X-User-Id is missing', async () => {
    const user = await userContextService.resolveUserFromHeader();

    expect(user.id).toBe('local-default-user');
    expect(user.is_default).toBe(true);

    const users = await dataSource.getRepository(UserEntity).find();
    expect(users.length).toBe(1);
  });

  it('auto-creates unknown X-User-Id values', async () => {
    const user = await userContextService.resolveUserFromHeader('alex');

    expect(user.id).toBe('alex');
    expect(user.is_default).toBe(false);

    const persisted = await dataSource
      .getRepository(UserEntity)
      .findOneBy({ id: 'alex' });
    expect(persisted).not.toBeNull();
  });

  it('rejects blank X-User-Id values', async () => {
    let caughtError: unknown;
    try {
      await userContextService.resolveUserFromHeader('   ');
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(BadRequestException);
  });
});
