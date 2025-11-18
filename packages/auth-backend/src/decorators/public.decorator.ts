import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = "isPublic";

/**
 * Decorator to mark routes as public (no authentication required)
 * Use this on routes that should be accessible without JWT token
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
