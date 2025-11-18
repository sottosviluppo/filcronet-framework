import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { PermissionString } from "@filcronet/core";

/**
 * Permissions Guard
 * Validates that authenticated user has required permissions
 * Works in conjunction with @RequirePermissions() decorator
 *
 * @export
 * @class PermissionsGuard
 * @implements {CanActivate}
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Checks if user has all required permissions for the route
   *
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean} True if user has all required permissions
   * @memberof PermissionsGuard
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionString[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    const userPermissions = user?.permissions ?? [];

    // Check if user has all required permissions
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }
}
