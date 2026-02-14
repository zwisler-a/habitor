import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '../database/entities/user.entity';
import { UserContextGuard } from './user-context.guard';
import { SKIP_USER_CONTEXT_KEY } from './skip-user-context.decorator';
import type { UserContextService } from './user-context.service';

function createExecutionContext(
  request: { headers: Record<string, string>; user?: UserEntity },
  handler: () => void,
  klass: new () => unknown,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => klass,
    switchToHttp: () =>
      ({
        getRequest: () => request,
      }) as never,
  } as ExecutionContext;
}

describe('UserContextGuard', () => {
  it('bypasses user resolution when skip metadata is present', async () => {
    const reflector = new Reflector();
    const getAllAndOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const userContextService = {
      resolveUserFromHeader: jest.fn(),
    } as Pick<UserContextService, 'resolveUserFromHeader'>;

    const guard = new UserContextGuard(
      reflector,
      userContextService as UserContextService,
    );
    const handler = () => undefined;
    class TestClass {}
    const request: { headers: Record<string, string>; user?: UserEntity } = {
      headers: {},
    };
    const context = createExecutionContext(request, handler, TestClass);

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
    expect(getAllAndOverrideSpy).toHaveBeenCalledWith(SKIP_USER_CONTEXT_KEY, [
      handler,
      TestClass,
    ]);
    expect(userContextService.resolveUserFromHeader).not.toHaveBeenCalled();
  });

  it('resolves and attaches user when skip metadata is absent', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const resolvedUser = { id: 'alex' } as UserEntity;
    const userContextService = {
      resolveUserFromHeader: jest.fn().mockResolvedValue(resolvedUser),
    } as Pick<UserContextService, 'resolveUserFromHeader'>;

    const guard = new UserContextGuard(
      reflector,
      userContextService as UserContextService,
    );
    const handler = () => undefined;
    class TestClass {}
    const request: { headers: Record<string, string>; user?: UserEntity } = {
      headers: { 'x-user-id': 'alex' },
    };
    const context = createExecutionContext(request, handler, TestClass);

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
    expect(userContextService.resolveUserFromHeader).toHaveBeenCalledWith(
      'alex',
    );
    expect(request.user).toBe(resolvedUser);
  });
});
