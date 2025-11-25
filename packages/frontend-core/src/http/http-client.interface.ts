/**
 * HTTP Client interface for making API requests
 * Provides a generic abstraction layer over HTTP libraries (Axios, Fetch, etc.)
 *
 * @export
 * @interface IHttpClient
 *
 * @example
 * ```typescript
 * const client: IHttpClient = new AxiosHttpClient('https://api.example.com');
 * const users = await client.get<User[]>('/users');
 * ```
 */
export interface IHttpClient {
  /**
   * Performs a GET request
   *
   * @template T - Expected response type
   * @param {string} url - Request URL (relative to baseURL)
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<T>} Response data
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * const user = await client.get<User>('/users/123');
   * const users = await client.get<User[]>('/users', { params: { page: 1 } });
   * ```
   */
  get<T>(url: string, config?: RequestConfig): Promise<T>;

  /**
   * Performs a POST request
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {any} [data] - Request body
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<T>} Response data
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * const newUser = await client.post<User>('/users', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;

  /**
   * Performs a PATCH request (partial update)
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {any} [data] - Request body with fields to update
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<T>} Response data
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * const updated = await client.patch<User>('/users/123', {
   *   name: 'Jane Doe'
   * });
   * ```
   */
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;

  /**
   * Performs a PUT request (full replacement)
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {any} [data] - Complete resource data
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<T>} Response data
   * @memberof IHttpClient
   */
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;

  /**
   * Performs a DELETE request
   *
   * @template T - Expected response type
   * @param {string} url - Request URL
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<T>} Response data
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * await client.delete('/users/123');
   * ```
   */
  delete<T>(url: string, config?: RequestConfig): Promise<T>;

  /**
   * Sets a header for all requests
   *
   * @param {string} key - Header name
   * @param {string | null} value - Header value (null to remove)
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * // Set authorization header
   * client.setHeader('Authorization', 'Bearer token123');
   *
   * // Remove header
   * client.setHeader('Authorization', null);
   * ```
   */
  setHeader(key: string, value: string | null): void;

  /**
   * Registers a callback for error handling
   * Called whenever a request fails
   *
   * @param {(error: any) => void} callback - Error handler function
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * client.onError((error) => {
   *   console.error('API Error:', error.message);
   *   if (error.response?.status === 401) {
   *     redirectToLogin();
   *   }
   * });
   * ```
   */
  onError(callback: (error: any) => void): void;

  /**
   * Registers a request interceptor
   * Allows modifying requests before they are sent
   *
   * @param {(config: any) => any} callback - Request modifier function
   * @memberof IHttpClient
   *
   * @example
   * ```typescript
   * client.onRequest((config) => {
   *   config.headers['X-Custom-Header'] = 'value';
   *   return config;
   * });
   * ```
   */
  onRequest(callback: (config: any) => any): void;
}

/**
 * Request configuration options
 *
 * @export
 * @interface RequestConfig
 */
export interface RequestConfig {
  /**
   * Custom HTTP headers
   *
   * @type {Record<string, string>}
   * @memberof RequestConfig
   *
   * @example
   * ```typescript
   * { headers: { 'Content-Type': 'application/json' } }
   * ```
   */
  headers?: Record<string, string>;

  /**
   * URL query parameters
   *
   * @type {Record<string, any>}
   * @memberof RequestConfig
   *
   * @example
   * ```typescript
   * { params: { page: 1, limit: 10, search: 'John' } }
   * // Results in: /users?page=1&limit=10&search=John
   * ```
   */
  params?: Record<string, any>;

  /**
   * Request timeout in milliseconds
   *
   * @type {number}
   * @memberof RequestConfig
   *
   * @example
   * ```typescript
   * { timeout: 5000 } // 5 seconds
   * ```
   */
  timeout?: number;

  /**
   * Whether to include credentials (cookies)
   * Required for HttpOnly cookie authentication
   *
   * @type {boolean}
   * @memberof RequestConfig
   *
   * @example
   * ```typescript
   * { withCredentials: true } // Include cookies in cross-origin requests
   * ```
   */
  withCredentials?: boolean;
}
