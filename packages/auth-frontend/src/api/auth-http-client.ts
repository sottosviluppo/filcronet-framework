import { AxiosHttpClient } from "@sottosviluppo/frontend-core";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthRequestConfig } from "../interfaces/auth-request-config.interface";
import type { IAuthHttpClient } from "../interfaces/auth-http-client.interface";

/**
 * Internal request config with retry tracking
 *
 * @private
 * @interface InternalRequestConfig
 * @extends {InternalAxiosRequestConfig}
 */
interface InternalRequestConfig extends InternalAxiosRequestConfig {
  /** Flag to prevent infinite retry loops */
  _retry?: boolean;
  /** Flag from AuthRequestConfig to skip auth refresh */
  skipAuthRefresh?: boolean;
}

/**
 * Authentication-aware HTTP client implementation
 *
 * Extends AxiosHttpClient with automatic token management:
 * - Injects Authorization header with Bearer token
 * - Automatically refreshes token on 401 responses
 * - Queues failed requests during token refresh
 * - Calls unauthorized callback when refresh fails
 *
 * @export
 * @class AuthHttpClient
 * @extends {AxiosHttpClient}
 * @implements {IAuthHttpClient}
 *
 * @example
 * ```typescript
 * const httpClient = new AuthHttpClient('https://api.example.com/v1');
 *
 * // Configure authentication
 * httpClient.setAuthToken(accessToken);
 *
 * // Setup auto-refresh (called automatically by auth store)
 * httpClient.setupAutoRefresh(async () => {
 *   const response = await refreshToken();
 *   return response.accessToken;
 * });
 *
 * // Handle session expiration
 * httpClient.onUnauthorized(() => {
 *   window.location.href = '/login';
 * });
 *
 * // Make requests - auth is handled automatically
 * const users = await httpClient.get<User[]>('/users');
 * ```
 */
export class AuthHttpClient extends AxiosHttpClient implements IAuthHttpClient {
  /**
   * Callback to refresh the access token
   *
   * @private
   * @type {(() => Promise<string>)}
   * @memberof AuthHttpClient
   */
  private refreshCallback?: () => Promise<string>;

  /**
   * Callback when authentication fails completely
   *
   * @private
   * @type {(() => void)}
   * @memberof AuthHttpClient
   */
  private unauthorizedCallback?: () => void;

  /**
   * Flag to prevent concurrent refresh attempts
   *
   * @private
   * @type {boolean}
   * @memberof AuthHttpClient
   */
  private isRefreshing = false;

  /**
   * Queue of requests waiting for token refresh
   *
   * @private
   * @type {Array<{ resolve: (token: string) => void; reject: (error: any) => void }>}
   * @memberof AuthHttpClient
   */
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  /**
   * Creates an instance of AuthHttpClient
   *
   * @param {string} baseURL - Base URL for all API requests
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * const client = new AuthHttpClient('https://api.example.com/v1');
   * ```
   */
  constructor(baseURL: string) {
    super(baseURL);
    this.setupAuthInterceptors();
  }

  /**
   * Performs a GET request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AuthHttpClient
   */
  async get<T>(url: string, config?: AuthRequestConfig): Promise<T> {
    return super.get<T>(url, config);
  }

  /**
   * Performs a POST request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AuthHttpClient
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.post<T>(url, data, config);
  }

  /**
   * Performs a PATCH request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AuthHttpClient
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.patch<T>(url, data, config);
  }

  /**
   * Performs a PUT request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {unknown} [data] - Request body
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AuthHttpClient
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.put<T>(url, data, config);
  }

  /**
   * Performs a DELETE request with authentication options
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {AuthRequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AuthHttpClient
   */
  async delete<T>(url: string, config?: AuthRequestConfig): Promise<T> {
    return super.delete<T>(url, config);
  }

  /**
   * Sets up Axios interceptors for automatic token refresh
   *
   * @private
   * @memberof AuthHttpClient
   */
  private setupAuthInterceptors(): void {
    const axiosInstance = this.getAxiosInstance();

    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalRequestConfig;

        // Check if this request should skip auth refresh
        const shouldSkipRefresh = originalRequest.skipAuthRefresh === true;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !shouldSkipRefresh &&
          this.refreshCallback
        ) {
          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          // Mark as retrying and start refresh
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshCallback();

            // Resolve all queued requests with new token
            this.failedQueue.forEach((promise) => promise.resolve(newToken));
            this.failedQueue = [];

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Reject all queued requests
            this.failedQueue.forEach((promise) => promise.reject(refreshError));
            this.failedQueue = [];

            // Call unauthorized callback
            if (this.unauthorizedCallback) {
              this.unauthorizedCallback();
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Call unauthorized only for non-skipped requests
        if (
          error.response?.status === 401 &&
          !shouldSkipRefresh &&
          this.unauthorizedCallback
        ) {
          this.unauthorizedCallback();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Configures automatic token refresh on 401 responses
   *
   * @param {() => Promise<string>} refreshCallback - Async function that returns new access token
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * httpClient.setupAutoRefresh(async () => {
   *   const response = await authApi.refreshToken();
   *   return response.accessToken;
   * });
   * ```
   */
  setupAutoRefresh(refreshCallback: () => Promise<string>): void {
    this.refreshCallback = refreshCallback;
  }

  /**
   * Registers callback for when authentication fails completely
   *
   * @param {() => void} callback - Function to call on auth failure
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * httpClient.onUnauthorized(() => {
   *   authStore.clearAuthState();
   *   router.push('/login');
   * });
   * ```
   */
  onUnauthorized(callback: () => void): void {
    this.unauthorizedCallback = callback;
  }

  /**
   * Sets the authorization token for all requests
   *
   * @param {(string | null)} token - JWT access token or null to clear
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * // Set token
   * httpClient.setAuthToken('eyJhbGciOiJIUzI1NiIs...');
   *
   * // Clear token
   * httpClient.setAuthToken(null);
   * ```
   */
  setAuthToken(token: string | null): void {
    this.setHeader("Authorization", token ? `Bearer ${token}` : null);
  }
}
