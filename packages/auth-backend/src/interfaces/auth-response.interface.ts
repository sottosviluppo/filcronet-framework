import type { UserEntity } from "../entities/user.entity";

/**
 * Authentication response with user and token pair
 *
 * @export
 * @interface AuthResponseWithTokens
 */
export interface AuthResponseWithTokens {
  /**
   * User data without sensitive fields
   */
  user: Omit<UserEntity, "password">;

  /**
   * JWT access token (short-lived)
   */
  accessToken: string;

  /**
   * JWT refresh token (long-lived)
   */
  refreshToken: string;
}

/**
 * Token pair response
 *
 * @export
 * @interface TokenPairResponse
 */
export interface TokenPairResponse {
  /**
   * JWT access token
   */
  accessToken: string;

  /**
   * JWT refresh token
   */
  refreshToken: string;
}
