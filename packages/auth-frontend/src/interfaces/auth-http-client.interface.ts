import { IHttpClient } from "@sottosviluppo/frontend-core";
import { AuthRequestConfig } from "./auth-request-config.interface";

/**
 * Authentication-aware HTTP client interface
 *
 * Extends the base IHttpClient with authentication-specific functionality:
 * - Automatic token injection in request headers
 * - Automatic token refresh on 401 responses
 * - Unauthorized callback for session expiration handling
 *
 * This interface is implemented by AuthHttpClient and can be used
 * to create custom HTTP client implementations with auth support.
 *
 * @export
 * @interface IAuthHttpClient
 * @extends {IHttpClient}
 *
 * @example
 * ```typescript
 * // Using the auth HTTP client
 * const httpClient: IAuthHttpClient = new AuthHttpClient(baseURL);
 *
 * // Configure authentication
 * httpClient.setAuthToken(accessToken);
 *
 * // Setup auto-refresh
 * httpClient.setupAutoRefresh(async () => {
 *   const response = await refreshTokenApi();
 *   return response.accessToken;
 * });
 *
 * // Handle session expiration
 * httpClient.onUnauthorized(() => {
 *   router.push('/login');
 * });
 *
 * // Make authenticated requests
 * const users = await httpClient.get<User[]>('/users');
 * ```
 */
export interface IAuthHttpClient extends IHttpClient {
  /**
   * Sets the authorization token for all subsequent requests
   *
   * The token is added as a Bearer token in the Authorization header.
   * Pass null to remove the authorization header.
   *
   * @param {(string | null)} token - JWT access token or null to clear
   * @memberof IAuthHttpClient
   *
   * @example
   * ```typescript
   * // Set token after login
   * httpClient.setAuthToken('eyJhbGciOiJIUzI1NiIs...');
   *
   * // Clear token on logout
   * httpClient.setAuthToken(null);
   * ```
   */
  setAuthToken(token: string | null): void;

  /**
   * Configures automatic token refresh on 401 responses
   *
   * When a request returns 401 Unauthorized, the client will:
   * 1. Call the refresh callback to get a new token
   * 2. Retry the original request with the new token
   * 3. If refresh fails, call the onUnauthorized callback
   *
   * @param {() => Promise<string>} refreshCallback - Async function that returns new access token
   * @memberof IAuthHttpClient
   *
   * @example
   * ```typescript
   * httpClient.setupAutoRefresh(async () => {
   *   const response = await fetch('/auth/refresh', {
   *     method: 'POST',
   *     credentials: 'include', // Send HttpOnly cookie
   *   });
   *   const data = await response.json();
   *   return data.accessToken;
   * });
   * ```
   */
  setupAutoRefresh(refreshCallback: () => Promise<string>): void;

  /**
   * Registers callback for when authentication fails completely
   *
   * Called when:
   * - Token refresh fails
   * - 401 received and no refresh callback is configured
   * - 401 received on a request with skipAuthRefresh: true
   *
   * Use this to redirect to login or clear local auth state.
   *
   * @param {() => void} callback - Function to call on auth failure
   * @memberof IAuthHttpClient
   *
   * @example
   * ```typescript
   * httpClient.onUnauthorized(() => {
   *   // Clear local state
   *   authStore.clearAuthState();
   *   // Redirect to login
   *   router.push('/login');
   * });
   * ```
   */
  onUnauthorized(callback: () => void): void;

  /**
   * Performs a GET request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL (relative to baseURL)
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof IAuthHttpClient
   */
  get<T>(url: string, config?: AuthRequestConfig): Promise<T>;

  /**
   * Performs a POST request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof IAuthHttpClient
   */
  post<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * Performs a PATCH request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof IAuthHttpClient
   */
  patch<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * Performs a PUT request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof IAuthHttpClient
   */
  put<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * Performs a DELETE request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof IAuthHttpClient
   */
  delete<T>(url: string, config?: AuthRequestConfig): Promise<T>;
}
