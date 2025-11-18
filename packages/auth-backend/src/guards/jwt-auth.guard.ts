import { Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * JWT Authentication Guard
 * Protects routes by requiring valid JWT token
 * Allows public routes marked with @Public() decorator
 *
 * @export
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current route can be activated
   * Checks for @Public() decorator and bypasses authentication if found
   *
   * @param {ExecutionContext} context - Execution context
   * @returns {(boolean | Promise<boolean> | Observable<boolean>)} True if route can be accessed
   * @memberof JwtAuthGuard
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
