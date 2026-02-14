import type { Request } from 'express';
import type { UserEntity } from '../database/entities/user.entity';

export interface RequestWithResolvedUser extends Request {
  user: UserEntity;
}
