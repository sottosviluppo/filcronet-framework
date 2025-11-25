/**
 * JWT payload interface
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
   * @memberof JwtPayload
   */
  sub: string;

  /**
   * User email address
   *
   * @type {string}
   * @memberof JwtPayload
   */
  email: string;

  /**
   * Array of role names assigned to the user
   *
   * @type {string[]}
   * @memberof JwtPayload
   *
   * @example ['user', 'admin']
   */
  roles?: string[];

  /**
   * Array of permissions in 'resource:action' format
   * Flattened from all user roles
   *
   * @type {string[]}
   * @memberof JwtPayload
   *
   * @example ['users:read', 'users:create', 'products:manage']
   */
  permissions?: string[];

  /**
   * Token type
   * Identifies the purpose of the token
   *
   * @type {string}
   * @memberof JwtPayload
   *
   * @example 'access', 'refresh', 'password_reset', 'invitation'
   */
  type?: string;

  /**
   * Password version for token invalidation
   * Used to invalidate PASSWORD_RESET and INVITATION tokens after use
   *
   * @type {number}
   * @memberof JwtPayload
   */
  version?: number;

  /**
   * Issued At - Token creation timestamp (seconds since epoch)
   * Standard JWT claim (automatically added by jwt library)
   *
   * @type {number}
   * @memberof JwtPayload
   */
  iat?: number;

  /**
   * Expiration Time - Token expiration timestamp (seconds since epoch)
   * Standard JWT claim (automatically added by jwt library)
   *
   * @type {number}
   * @memberof JwtPayload
   */
  exp?: number;
}

/**
 * Decodes a JWT token without verification
 * Only for reading expiration time and user data on the client
 * Server must verify signature for security
 *
 * @export
 * @param {string} token - JWT token
 * @returns {(JwtPayload | null)} Decoded payload or null if invalid
 * @memberof jwt-decoder
 *
 * @example
 * ```typescript
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * const payload = decodeJwt(token);
 *
 * if (payload) {
 *   console.log('User ID:', payload.sub);
 *   console.log('Email:', payload.email);
 *   console.log('Expires at:', new Date(payload.exp! * 1000));
 * }
 * ```
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    // JWT format: header.payload.signature
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode base64 to UTF-8 string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 *
 * @export
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 * @memberof jwt-decoder
 *
 * @example
 * ```typescript
 * const token = storage.getToken();
 *
 * if (isTokenExpired(token)) {
 *   // Token expired, refresh it
 *   await refreshToken();
 * } else {
 *   // Token still valid, use it
 *   await makeAPIRequest();
 * }
 * ```
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;

  const now = Date.now() / 1000; // Convert to seconds
  return payload.exp < now;
}

/**
 * Gets time until token expires in milliseconds
 *
 * @export
 * @param {string} token - JWT token
 * @returns {number} Milliseconds until expiration (negative if already expired)
 * @memberof jwt-decoder
 *
 * @example
 * ```typescript
 * const token = storage.getToken();
 * const timeLeft = getTokenExpiryTime(token);
 *
 * if (timeLeft > 0) {
 *   console.log(`Token expires in ${Math.floor(timeLeft / 1000)} seconds`);
 *
 *   // Schedule refresh 1 minute before expiry
 *   const refreshIn = timeLeft - 60000;
 *   if (refreshIn > 0) {
 *     setTimeout(() => refreshToken(), refreshIn);
 *   }
 * } else {
 *   console.log('Token already expired');
 * }
 * ```
 */
export function getTokenExpiryTime(token: string): number {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return 0;

  const now = Date.now() / 1000; // Current time in seconds
  const secondsUntilExpiry = payload.exp - now;
  return secondsUntilExpiry * 1000; // Convert to milliseconds
}

/**
 * Gets token expiration date
 *
 * @export
 * @param {string} token - JWT token
 * @returns {(Date | null)} Expiration date or null if invalid
 * @memberof jwt-decoder
 *
 * @example
 * ```typescript
 * const token = storage.getToken();
 * const expiryDate = getTokenExpiryDate(token);
 *
 * if (expiryDate) {
 *   console.log(`Token expires on: ${expiryDate.toLocaleString()}`);
 * }
 * ```
 */
export function getTokenExpiryDate(token: string): Date | null {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
}

/**
 * Checks if token will expire within specified time
 * Useful for proactive token refresh
 *
 * @export
 * @param {string} token - JWT token
 * @param {number} [milliseconds=60000] - Time window in milliseconds (default: 1 minute)
 * @returns {boolean} True if token expires within the specified time
 * @memberof jwt-decoder
 *
 * @example
 * ```typescript
 * const token = storage.getToken();
 *
 * // Check if token expires in next 5 minutes
 * if (isTokenExpiringSoon(token, 5 * 60 * 1000)) {
 *   console.log('Token expiring soon, refreshing...');
 *   await refreshToken();
 * }
 * ```
 */
export function isTokenExpiringSoon(
  token: string,
  milliseconds: number = 60000
): boolean {
  const timeLeft = getTokenExpiryTime(token);
  return timeLeft > 0 && timeLeft <= milliseconds;
}
