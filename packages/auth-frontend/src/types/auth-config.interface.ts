/**
 * Configuration options for auth frontend plugin
 *
 * @export
 * @interface AuthConfig
 */
export interface AuthConfig {
  /**
   * Base URL for API requests
   * Example: 'http://localhost:3000' or 'https://api.example.com'
   *
   * @type {string}
   */
  apiBaseUrl: string;

  /**
   * API version prefix
   * Example: 'v1' → /v1/auth/login
   *
   * @type {string}
   */
  apiVersion?: string;

  /**
   * Storage type for tokens
   *
   * @type {('localStorage' | 'sessionStorage')}
   * @default 'localStorage'
   */
  storage?: "localStorage" | "sessionStorage";

  /**
   * Redirect path when user is not authenticated
   *
   * @type {string}
   * @default '/login'
   */
  redirectOnUnauth?: string;

  /**
   * Redirect path after successful login
   *
   * @type {string}
   * @default '/'
   */
  redirectOnLogin?: string;

  /**
   * Automatically refresh token before expiry
   *
   * @type {boolean}
   * @default false
   */
  autoRefreshToken?: boolean;

  /**
   * Token refresh interval in milliseconds
   * Only used if autoRefreshToken is true
   *
   * @type {number}
   * @default 300000 (5 minutes)
   */
  refreshInterval?: number;
}

/**
 * Login credentials
 *
 * @export
 * @interface LoginCredentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 *
 * @export
 * @interface RegisterData
 */
export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Authentication response from API
 *
 * @export
 * @interface AuthResponse
 */
export interface AuthResponse {
  user: any; // IUser from @filcronet/core
  accessToken: string;
}
