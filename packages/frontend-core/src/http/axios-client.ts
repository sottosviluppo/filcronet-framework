import axios, { AxiosInstance, AxiosError } from "axios";
import type { IHttpClient, RequestConfig } from "./http-client.interface";

/**
 * Axios implementation of HTTP Client
 * Provides a type-safe wrapper around Axios with error handling
 *
 * @export
 * @class AxiosHttpClient
 * @implements {IHttpClient}
 *
 * @example
 * ```typescript
 * const client = new AxiosHttpClient('https://api.example.com');
 *
 * // Configure error handling
 * client.onError((error) => {
 *   console.error('API Error:', error);
 * });
 *
 * // Make requests
 * const users = await client.get<User[]>('/users');
 * ```
 */
export class AxiosHttpClient implements IHttpClient {
  /**
   * Axios instance
   *
   * @private
   * @type {AxiosInstance}
   * @memberof AxiosHttpClient
   */
  private client: AxiosInstance;

  /**
   * Error callback function
   *
   * @private
   * @type {((error: any) => void)}
   * @memberof AxiosHttpClient
   */
  private errorCallback?: (error: any) => void;

  /**
   * Creates an instance of AxiosHttpClient
   *
   * @param {string} baseURL - Base URL for all requests
   * @memberof AxiosHttpClient
   *
   * @example
   * ```typescript
   * const client = new AxiosHttpClient('https://api.example.com/v1');
   * ```
   */
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * Sets up Axios response interceptor for error handling
   *
   * @private
   * @memberof AxiosHttpClient
   */
  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (this.errorCallback) {
          this.errorCallback(error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Performs a GET request
   *
   * @template T
   * @param {string} url - Request URL
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AxiosHttpClient
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  /**
   * Performs a POST request
   *
   * @template T
   * @param {string} url - Request URL
   * @param {any} [data] - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AxiosHttpClient
   */
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * Performs a PATCH request
   *
   * @template T
   * @param {string} url - Request URL
   * @param {any} [data] - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AxiosHttpClient
   */
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  /**
   * Performs a PUT request
   *
   * @template T
   * @param {string} url - Request URL
   * @param {any} [data] - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AxiosHttpClient
   */
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * Performs a DELETE request
   *
   * @template T
   * @param {string} url - Request URL
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<T>} Response data
   * @memberof AxiosHttpClient
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * Sets a default header for all requests
   *
   * @param {string} key - Header name
   * @param {(string | null)} value - Header value (null removes the header)
   * @memberof AxiosHttpClient
   *
   * @example
   * ```typescript
   * client.setHeader('Authorization', 'Bearer token123');
   * client.setHeader('X-Custom-Header', 'value');
   * client.setHeader('Authorization', null); // Remove header
   * ```
   */
  setHeader(key: string, value: string | null): void {
    if (value) {
      this.client.defaults.headers.common[key] = value;
    } else {
      delete this.client.defaults.headers.common[key];
    }
  }

  /**
   * Registers error callback
   *
   * @param {(error: any) => void} callback - Error handler function
   * @memberof AxiosHttpClient
   *
   * @example
   * ```typescript
   * client.onError((error) => {
   *   if (error.response?.status === 401) {
   *     console.error('Unauthorized');
   *   }
   * });
   * ```
   */
  onError(callback: (error: any) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Registers request interceptor
   *
   * @param {(config: any) => any} callback - Request modifier function
   * @memberof AxiosHttpClient
   *
   * @example
   * ```typescript
   * client.onRequest((config) => {
   *   config.headers['X-Request-ID'] = generateId();
   *   return config;
   * });
   * ```
   */
  onRequest(callback: (config: any) => any): void {
    this.client.interceptors.request.use(callback);
  }

  /**
   * Gets the underlying Axios instance for advanced usage
   *
   * @returns {AxiosInstance} Axios instance
   * @memberof AxiosHttpClient
   *
   * @example
   * ```typescript
   * const axios = client.getAxiosInstance();
   * // Use Axios-specific features
   * axios.interceptors.request.use(...);
   * ```
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
