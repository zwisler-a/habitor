import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

const DEFAULT_USER_ID = 'local-default-user';
const DEFAULT_USER_NAME = 'Local User';
const MAX_USER_ID_LENGTH = 128;

@Injectable()
export class UserContextService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async resolveUserFromHeader(rawHeaderValue?: string): Promise<UserEntity> {
    if (!rawHeaderValue) {
      return this.resolveDefaultUser();
    }

    const userId = rawHeaderValue.trim();
    if (!userId) {
      throw new BadRequestException('X-User-Id cannot be blank.');
    }

    if (userId.length > MAX_USER_ID_LENGTH) {
      throw new BadRequestException(
        `X-User-Id must be ${MAX_USER_ID_LENGTH} characters or fewer.`,
      );
    }

    const users = this.dataSource.getRepository(UserEntity);
    const existing = await users.findOneBy({ id: userId });
    if (existing) {
      return existing;
    }

    const created = users.create({
      id: userId,
      name: `User ${userId}`,
      is_default: false,
    });

    return users.save(created);
  }

  private async resolveDefaultUser(): Promise<UserEntity> {
    const users = this.dataSource.getRepository(UserEntity);
    const existingDefault = await users.findOne({
      where: { is_default: true },
      order: { created_at: 'ASC' },
    });

    if (existingDefault) {
      return existingDefault;
    }

    const createdDefault = users.create({
      id: DEFAULT_USER_ID,
      name: DEFAULT_USER_NAME,
      is_default: true,
    });

    return users.save(createdDefault);
  }
}
