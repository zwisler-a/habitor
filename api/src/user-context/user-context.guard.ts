import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { RequestWithResolvedUser } from './request-user.types';
import { UserContextService } from './user-context.service';

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(private readonly userContextService: UserContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithResolvedUser>();
    const header = request.headers['x-user-id'];
    const headerValue = Array.isArray(header) ? header[0] : header;

    request.user =
      await this.userContextService.resolveUserFromHeader(headerValue);
    return true;
  }
}
