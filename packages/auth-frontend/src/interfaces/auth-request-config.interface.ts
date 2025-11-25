import { RequestConfig } from "@sottosviluppo/frontend-core";

/**
 * Extended request configuration for auth-aware HTTP client
 *
 * @export
 * @interface AuthRequestConfig
 * @extends {RequestConfig}
 */
export interface AuthRequestConfig extends RequestConfig {
  /**
   * Skip automatic token refresh on 401 response
   * Use for auth endpoints like login, register, refresh
   *
   * @type {boolean}
   * @memberof AuthRequestConfig
   */
  skipAuthRefresh?: boolean;
}
