import { MemoryStorage } from "@sottosviluppo/frontend-core";
import { ITokenStorage } from "../interfaces/token-storage.interface";

/**
 * Storage keys for authentication data
 *
 * @enum {string}
 */
enum StorageKey {
  /** Key for storing JWT access token */
  ACCESS_TOKEN = "access_token",
  /** Key for storing user data */
  USER = "user",
}

/**
 * In-memory token storage implementation
 *
 * Provides XSS-safe storage for access tokens by keeping them in memory
 * rather than localStorage/sessionStorage. Tokens are lost on page refresh,
 * but automatically restored via HttpOnly refresh token cookie.
 *
 * Security benefits:
 * - Access tokens not accessible via JavaScript injection attacks
 * - Refresh tokens stored in HttpOnly cookies (handled by backend)
 * - Automatic token refresh on page load via cookie
 *
 * @export
 * @class TokenStorage
 * @implements {ITokenStorage}
 *
 * @example
 * ```typescript
 * const storage = new TokenStorage();
 *
 * // Store access token after login
 * storage.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 *
 * // Store user data
 * storage.setUser({ id: '123', email: 'user@example.com', roles: [] });
 *
 * // Retrieve token for API calls
 * const token = storage.getToken();
 * if (token) {
 *   httpClient.setAuthToken(token);
 * }
 *
 * // Clear on logout
 * storage.clear();
 * ```
 */
export class TokenStorage implements ITokenStorage {
  /**
   * Internal memory storage instance
   *
   * @private
   * @type {MemoryStorage}
   * @memberof TokenStorage
   */
  private storage = new MemoryStorage();

  /**
   * Retrieves the stored access token
   *
   * @returns {(string | null)} JWT access token or null if not stored
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * const token = storage.getToken();
   * if (token) {
   *   // Use token for authenticated requests
   *   headers['Authorization'] = `Bearer ${token}`;
   * }
   * ```
   */
  getToken(): string | null {
    return this.storage.get<string>(StorageKey.ACCESS_TOKEN);
  }

  /**
   * Stores the access token in memory
   *
   * Token is kept only in memory for XSS protection.
   * Will be lost on page refresh but restored via refresh token cookie.
   *
   * @param {string} token - JWT access token to store
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // After successful login
   * const response = await authApi.login(credentials);
   * storage.setToken(response.accessToken);
   * ```
   */
  setToken(token: string): void {
    this.storage.set(StorageKey.ACCESS_TOKEN, token);
  }

  /**
   * Removes the access token from storage
   *
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // Remove only the token (keep user data)
   * storage.removeToken();
   * ```
   */
  removeToken(): void {
    this.storage.remove(StorageKey.ACCESS_TOKEN);
  }

  /**
   * Retrieves stored user data
   *
   * @template T - User data type (typically IUser from @sottosviluppo/core)
   * @returns {(T | null)} User data or null if not stored
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * import { IUser } from '@sottosviluppo/core';
   *
   * const user = storage.getUser<IUser>();
   * if (user) {
   *   console.log(`Welcome ${user.email}`);
   * }
   * ```
   */
  getUser<T>(): T | null {
    return this.storage.get<T>(StorageKey.USER);
  }

  /**
   * Stores user data in memory
   *
   * @template T - User data type
   * @param {T} user - User object to store
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * storage.setUser({
   *   id: '550e8400-e29b-41d4-a716-446655440000',
   *   email: 'user@example.com',
   *   roles: [{ name: 'user', permissions: [] }]
   * });
   * ```
   */
  setUser<T>(user: T): void {
    this.storage.set(StorageKey.USER, user);
  }

  /**
   * Removes user data from storage
   *
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // Remove only user data (keep token)
   * storage.removeUser();
   * ```
   */
  removeUser(): void {
    this.storage.remove(StorageKey.USER);
  }

  /**
   * Clears all authentication data from storage
   *
   * Removes both access token and user data.
   * Call this on logout to ensure complete cleanup.
   *
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // Complete logout cleanup
   * async function logout() {
   *   await authApi.logout(); // Clears HttpOnly cookie
   *   storage.clear();        // Clears memory storage
   *   router.push('/login');
   * }
   * ```
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Checks if an access token is currently stored
   *
   * @returns {boolean} True if access token exists in storage
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * if (storage.hasToken()) {
   *   // User might be authenticated, verify with API
   *   await authStore.fetchCurrentUser();
   * } else {
   *   // No token, redirect to login
   *   router.push('/login');
   * }
   * ```
   */
  hasToken(): boolean {
    return this.storage.has(StorageKey.ACCESS_TOKEN);
  }
}
