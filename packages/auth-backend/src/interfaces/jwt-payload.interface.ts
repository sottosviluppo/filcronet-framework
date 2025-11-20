/**
 * JWT Token type
 */
export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
  PASSWORD_RESET = "password_reset",
  INVITATION = "invitation",
}

/**
 * JWT Token Payload Interface
 * Defines the structure of data encoded in JWT tokens
 *
 * @export
 * @interface JwtPayload
 */
export interface JwtPayload {
  /**
   * Subject - User ID (UUID)
   * Standard JWT claim
   *
   * @type {string}
   */
  sub: string;

  /**
   * User email address
   *
   * @type {string}
   */
  email: string;

  /**
   * Array of role names assigned to the user
   *
   * @type {string[]}
   * @example ['user', 'admin']
   */
  roles?: string[];

  /**
   * Array of permissions in 'resource:action' format
   * Flattened from all user roles
   *
   * @type {string[]}
   * @example ['users:read', 'users:create', 'products:manage']
   */
  permissions?: string[];

  /**
   * Token type
   *
   * @type {TokenType}
   */
  type: TokenType;

  /**
   * Password version for token invalidation
   * Used to invalidate PASSWORD_RESET and INVITATION tokens after use
   * When password changes or is set, this version increments
   *
   * @type {number}
   */
  version?: number;

  /**
   * Issued At - Token creation timestamp
   * Standard JWT claim (automatically added by jwt library)
   *
   * @type {number}
   */
  iat?: number;

  /**
   * Expiration Time - Token expiration timestamp
   * Standard JWT claim (automatically added by jwt library)
   *
   * @type {number}
   */
  exp?: number;
}
