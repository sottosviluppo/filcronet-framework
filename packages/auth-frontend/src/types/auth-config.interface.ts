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
   * API version prefix (REQUIRED)
   * Example: 'v1' → /v1/auth/login
   *
   * @type {string}
   */
  apiVersion: string;

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
