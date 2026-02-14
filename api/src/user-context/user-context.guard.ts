import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithResolvedUser } from './request-user.types';
import { SKIP_USER_CONTEXT_KEY } from './skip-user-context.decorator';
import { UserContextService } from './user-context.service';

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userContextService: UserContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_USER_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (shouldSkip) {
      return true;
    }

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
