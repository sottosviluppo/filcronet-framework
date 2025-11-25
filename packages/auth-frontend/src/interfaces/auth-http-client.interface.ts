import { IHttpClient } from "@sottosviluppo/frontend-core";
import { AuthRequestConfig } from "./auth-request-config.interface";

/**
 * Authentication-aware HTTP client interface
 *
 * @export
 * @interface IAuthHttpClient
 * @extends {IHttpClient}
 */
export interface IAuthHttpClient extends IHttpClient {
  /**
   * Sets the authorization token for all requests
   */
  setAuthToken(token: string | null): void;

  /**
   * Configures automatic token refresh on 401 responses
   */
  setupAutoRefresh(refreshCallback: () => Promise<string>): void;

  /**
   * Registers callback for when refresh fails
   */
  onUnauthorized(callback: () => void): void;

  /**
   * GET request with auth options
   */
  get<T>(url: string, config?: AuthRequestConfig): Promise<T>;

  /**
   * POST request with auth options
   */
  post<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * PATCH request with auth options
   */
  patch<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * PUT request with auth options
   */
  put<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<T>;

  /**
   * DELETE request with auth options
   */
  delete<T>(url: string, config?: AuthRequestConfig): Promise<T>;
}
