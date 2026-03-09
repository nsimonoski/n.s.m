import { CanActivate, ExecutionContext, ForbiddenException, mixin, Type } from '@nestjs/common';
import { Permission, GUEST_PERMISSIONS, AUTH_PERMISSIONS } from '@org/shared/contracts';
import type { UserSession } from '../../auth/session.service';

/** Guard factory that checks if the session has the required permission. Denies access if no session exists. */
export const PermissionGuard = (permission: Permission): Type<CanActivate> => {
  class Guard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const session: UserSession | undefined = request.session;
      if (!session) {
        return false;
      }

      const permissions = session.isGuest ? GUEST_PERMISSIONS : AUTH_PERMISSIONS;
      if (!permissions.includes(permission)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    }
  }

  return mixin(Guard);
};
