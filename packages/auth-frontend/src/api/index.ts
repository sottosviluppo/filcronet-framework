/**
 * API clients module
 *
 * Provides HTTP API clients for authentication and user management.
 * All clients use the authentication-aware HTTP client for automatic
 * token handling and refresh.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import {
 *   AuthApi,
 *   UserApi,
 *   RoleApi,
 *   PermissionApi,
 *   AuthHttpClient,
 * } from '@sottosviluppo/auth-frontend';
 *
 * // Create HTTP client
 * const httpClient = new AuthHttpClient('https://api.example.com/v1');
 *
 * // Create API instances
 * const authApi = new AuthApi(httpClient, storage);
 * const userApi = new UserApi(httpClient);
 * const roleApi = new RoleApi(httpClient);
 * const permissionApi = new PermissionApi(httpClient);
 * ```
 */

export * from "./auth-api";
export * from "./user-api";
export * from "./role-api";
export * from "./permission-api";
export * from "./auth-http-client";
