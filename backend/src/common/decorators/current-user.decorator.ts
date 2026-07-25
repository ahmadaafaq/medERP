import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — extracts the authenticated user from the request.
 *
 * Usage:
 *   @CurrentUser() user: JwtPayload
 *   @CurrentUser('id') userId: string
 *   @CurrentUser('role') role: UserRole
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
