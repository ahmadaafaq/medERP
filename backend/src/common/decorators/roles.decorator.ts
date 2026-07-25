import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator — list the minimum roles allowed to access a route.
 *
 * Usage:
 *   @Roles(UserRole.ADMIN, UserRole.HOD)
 *   @Roles(...ADMIN_ROLES)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
