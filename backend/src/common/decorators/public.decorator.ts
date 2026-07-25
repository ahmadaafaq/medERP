import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — marks a route as publicly accessible (no JWT required).
 * By default, ALL routes require authentication via JwtAuthGuard.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   async login(...) {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
