import { AxiosHttpClient } from "@sottosviluppo/frontend-core";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthRequestConfig } from "../interfaces/auth-request-config.interface";

/**
 * Internal request config with retry flag
 */
interface InternalRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

/**
 * Authentication-specific HTTP client
 *
 * @export
 * @class AuthHttpClient
 * @extends {AxiosHttpClient}
 */
export class AuthHttpClient extends AxiosHttpClient {
  private refreshCallback?: () => Promise<string>;
  private unauthorizedCallback?: () => void;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(baseURL: string) {
    super(baseURL);
    this.setupAuthInterceptors();
  }

  /**
   * Override GET to pass skipAuthRefresh to axios config
   */
  async get<T>(url: string, config?: AuthRequestConfig): Promise<T> {
    return super.get<T>(url, config);
  }

  /**
   * Override POST to pass skipAuthRefresh to axios config
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.post<T>(url, data, config);
  }

  /**
   * Override PATCH to pass skipAuthRefresh to axios config
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.patch<T>(url, data, config);
  }

  /**
   * Override PUT to pass skipAuthRefresh to axios config
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AuthRequestConfig
  ): Promise<T> {
    return super.put<T>(url, data, config);
  }

  /**
   * Override DELETE to pass skipAuthRefresh to axios config
   */
  async delete<T>(url: string, config?: AuthRequestConfig): Promise<T> {
    return super.delete<T>(url, config);
  }

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

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshCallback();

            this.failedQueue.forEach((promise) => promise.resolve(newToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((promise) => promise.reject(refreshError));
            this.failedQueue = [];

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

  setupAutoRefresh(refreshCallback: () => Promise<string>): void {
    this.refreshCallback = refreshCallback;
  }

  onUnauthorized(callback: () => void): void {
    this.unauthorizedCallback = callback;
  }

  setAuthToken(token: string | null): void {
    this.setHeader("Authorization", token ? `Bearer ${token}` : null);
  }
}
