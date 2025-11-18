import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

/**
 * Parameter decorator to inject current authenticated user
 * Extracts user data from JWT token in request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 *
 * // Get specific field
 * @Get('email')
 * getEmail(@CurrentUser('email') email: string) {
 *   return email;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    return data ? user?.[data] : user;
  }
);
