import { RequestConfig } from "@sottosviluppo/frontend-core";

/**
 * Extended request configuration for authentication-aware HTTP client
 *
 * Extends the base RequestConfig with authentication-specific options.
 * Used to control automatic token refresh behavior on a per-request basis.
 *
 * @export
 * @interface AuthRequestConfig
 * @extends {RequestConfig}
 *
 * @example
 * ```typescript
 * // Normal request (will auto-refresh on 401)
 * const users = await httpClient.get<User[]>('/users');
 *
 * // Auth endpoint (skip auto-refresh to prevent infinite loop)
 * const tokens = await httpClient.post<AuthResponse>(
 *   '/auth/login',
 *   credentials,
 *   { skipAuthRefresh: true }
 * );
 * ```
 */
export interface AuthRequestConfig extends RequestConfig {
  /**
   * Skip automatic token refresh on 401 response
   *
   * Set to true for authentication endpoints (login, register, refresh)
   * to prevent infinite refresh loops when credentials are invalid.
   *
   * @type {boolean}
   * @memberof AuthRequestConfig
   * @default false
   *
   * @example
   * ```typescript
   * // Login endpoint - don't try to refresh if login fails
   * const response = await httpClient.post('/auth/login', data, {
   *   skipAuthRefresh: true,
   * });
   *
   * // Refresh endpoint - don't try to refresh the refresh
   * const newTokens = await httpClient.post('/auth/refresh', undefined, {
   *   skipAuthRefresh: true,
   * });
   * ```
   */
  skipAuthRefresh?: boolean;
}
