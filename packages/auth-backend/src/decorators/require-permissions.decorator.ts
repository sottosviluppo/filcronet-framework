import { SetMetadata } from "@nestjs/common";
import { PermissionString } from "@sottosviluppo/core";

/**
 * Metadata key for required permissions
 */
export const PERMISSIONS_KEY = "permissions";

/**
 * Decorator to require specific permissions for route access
 * User must have ALL specified permissions to access the route
 * Must be used with PermissionsGuard
 *
 * @param {...PermissionString[]} permissions - Required permissions (resource:action format)
 * @example
 * ```typescript
 * @RequirePermissions('users:create', 'users:update')
 * @Post('users')
 * createUser(@Body() dto: CreateUserDto) {
 *   return this.userService.create(dto);
 * }
 * ```
 */
export const RequirePermissions = (...permissions: PermissionString[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
