import { AxiosHttpClient } from "@sottosviluppo/frontend-core";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Authentication-specific HTTP client
 * Extends AxiosHttpClient with automatic token refresh on 401 responses
 *
 * @export
 * @class AuthHttpClient
 * @extends {AxiosHttpClient}
 *
 * @example
 * ```typescript
 * const client = new AuthHttpClient('https://api.example.com');
 *
 * // Setup auto-refresh
 * client.setupAutoRefresh(async () => {
 *   const newToken = await refreshTokenAPI();
 *   return newToken;
 * });
 *
 * // Setup unauthorized handler
 * client.onUnauthorized(() => {
 *   redirectToLogin();
 * });
 *
 * // Make requests - 401 automatically triggers refresh
 * const data = await client.get('/protected-resource');
 * ```
 */
export class AuthHttpClient extends AxiosHttpClient {
  /**
   * Callback to refresh access token
   * Should return new access token
   *
   * @private
   * @type {(() => Promise<string>)}
   * @memberof AuthHttpClient
   */
  private refreshCallback?: () => Promise<string>;

  /**
   * Callback when refresh fails (e.g., redirect to login)
   *
   * @private
   * @type {(() => void)}
   * @memberof AuthHttpClient
   */
  private unauthorizedCallback?: () => void;

  /**
   * Flag to prevent concurrent refresh requests
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
   * @param {string} baseURL - API base URL
   * @memberof AuthHttpClient
   */
  constructor(baseURL: string) {
    super(baseURL);
    this.setupAuthInterceptors();
  }

  /**
   * Sets up response interceptor for automatic token refresh
   *
   * @private
   * @memberof AuthHttpClient
   */
  private setupAuthInterceptors(): void {
    const axiosInstance = this.getAxiosInstance();

    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and we have a refresh callback, try to refresh token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.refreshCallback
        ) {
          if (this.isRefreshing) {
            // Queue the request while token is being refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshCallback();

            // Process queued requests
            this.failedQueue.forEach((promise) => {
              promise.resolve(newToken);
            });
            this.failedQueue = [];

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear queue and call unauthorized callback
            this.failedQueue.forEach((promise) => {
              promise.reject(refreshError);
            });
            this.failedQueue = [];

            if (this.unauthorizedCallback) {
              this.unauthorizedCallback();
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // If 401 without refresh callback, just call unauthorized callback
        if (error.response?.status === 401 && this.unauthorizedCallback) {
          this.unauthorizedCallback();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Configures automatic token refresh
   * When a request receives 401, this callback is invoked to get a new token
   *
   * @param {() => Promise<string>} refreshCallback - Function that returns new access token
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * client.setupAutoRefresh(async () => {
   *   const response = await fetch('/auth/refresh', {
   *     method: 'POST',
   *     credentials: 'include' // Send HttpOnly cookie
   *   });
   *   const data = await response.json();
   *   return data.accessToken;
   * });
   * ```
   */
  setupAutoRefresh(refreshCallback: () => Promise<string>): void {
    this.refreshCallback = refreshCallback;
  }

  /**
   * Registers callback for when user becomes unauthorized
   * Called when token refresh fails
   *
   * @param {() => void} callback - Function to call on unauthorized (e.g., redirect to login)
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * client.onUnauthorized(() => {
   *   // Clear local state
   *   authStore.clearUser();
   *
   *   // Redirect to login
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
   * @param {(string | null)} token - JWT access token (null to remove)
   * @memberof AuthHttpClient
   *
   * @example
   * ```typescript
   * // Set token
   * client.setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   *
   * // Remove token (logout)
   * client.setAuthToken(null);
   * ```
   */
  setAuthToken(token: string | null): void {
    this.setHeader("Authorization", token ? `Bearer ${token}` : null);
  }
}
