import { ITokenStorage } from "../interfaces/token-storage.interface";
import { IAuthHttpClient } from "../interfaces";

/**
 * Authentication configuration options
 *
 * @export
 * @interface AuthConfig
 */
export interface AuthConfig {
  /**
   * Base URL for API requests (REQUIRED)
   * Example: 'http://localhost:3000' or 'https://api.example.com'
   *
   * @type {string}
   */
  apiBaseUrl: string;

  /**
   * API version prefix (optional)
   * Example: 'v1' → /v1/auth/login
   * Default: '' (no version prefix)
   *
   * @type {string}
   */
  apiVersion?: string;

  /**
   * Global API prefix (optional)
   * Use this if your NestJS backend has app.setGlobalPrefix() configured
   * Example: 'api' → /api/v1/auth/login
   * Default: '' (no prefix)
   *
   * @type {string}
   */
  apiPrefix?: string;

  /**
   * Custom HTTP client implementation (optional)
   * Default: AxiosHttpClient
   *
   * @type {IAuthHttpClient}
   */
  httpClient?: IAuthHttpClient;

  /**
   * Custom token storage implementation (optional)
   * Default: MemoryTokenStorage (XSS-safe)
   *
   * @type {ITokenStorage}
   */
  storage?: ITokenStorage;

  /**
   * Redirect path when user is not authenticated (optional)
   * Default: '/login'
   *
   * @type {string}
   */
  redirectOnUnauth?: string;

  /**
   * Redirect path after successful login (optional)
   * Default: '/'
   *
   * @type {string}
   */
  redirectOnLogin?: string;

  /**
   * Redirect path when user lacks permissions (optional)
   * Default: '/forbidden'
   *
   * @type {string}
   */
  redirectOnForbidden?: string;

  /**
   * Automatically schedule token refresh before expiry (optional)
   * Default: true
   *
   * @type {boolean}
   */
  autoRefreshToken?: boolean;

  /**
   * Refresh token X milliseconds before expiration (optional)
   * Default: 60000 (1 minute)
   * Only used if autoRefreshToken is true
   *
   * @type {number}
   */
  refreshBeforeExpiry?: number;
}
