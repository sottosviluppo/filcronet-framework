import { Injectable, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";

/**
 * JWT Strategy for Passport authentication
 * Validates JWT tokens and extracts user payload
 *
 * @export
 * @class JwtStrategy
 * @extends {PassportStrategy(Strategy)}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject("AUTH_OPTIONS")
    private readonly options: AuthModuleOptions
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: options.jwt.secret,
    });
  }

  /**
   * Validates JWT payload and returns user data
   * This payload is automatically attached to request.user
   *
   * @param {JwtPayload} payload - Decoded JWT payload
   * @returns {Promise<JwtPayload>} Validated user payload
   * @memberof JwtStrategy
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
