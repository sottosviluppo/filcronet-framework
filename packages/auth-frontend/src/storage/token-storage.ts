import { MemoryStorage } from "@sottosviluppo/frontend-core";

/**
 * Token storage keys
 *
 * @enum {string}
 */
enum StorageKey {
  ACCESS_TOKEN = "access_token",
  USER = "user",
}

/**
 * Token-specific storage adapter
 * Uses in-memory storage for access tokens (XSS-safe)
 * Refresh tokens are handled via HttpOnly cookies (backend-side)
 *
 * @export
 * @class TokenStorage
 *
 * @example
 * ```typescript
 * const storage = new TokenStorage();
 *
 * // Store access token (in memory)
 * storage.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 *
 * // Store user data
 * storage.setUser({ id: '123', email: 'user@example.com' });
 *
 * // Retrieve
 * const token = storage.getToken();
 * const user = storage.getUser<User>();
 *
 * // On page refresh, token is lost (memory cleared)
 * // but automatically restored via refresh token cookie
 * ```
 */
export class TokenStorage {
  /**
   * Internal storage instance
   * Uses memory storage for XSS protection
   *
   * @private
   * @type {MemoryStorage}
   * @memberof TokenStorage
   */
  private storage = new MemoryStorage();

  /**
   * Retrieves the access token
   *
   * @returns {(string | null)} Access token or null if not found
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * const token = storage.getToken();
   * if (token) {
   *   // Use token for API requests
   *   httpClient.setAuthToken(token);
   * }
   * ```
   */
  getToken(): string | null {
    return this.storage.get<string>(StorageKey.ACCESS_TOKEN);
  }

  /**
   * Stores the access token in memory
   * Token is lost on page refresh (intentional for security)
   *
   * @param {string} token - JWT access token
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // After successful login
   * const response = await authAPI.login(credentials);
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
   * // On logout
   * storage.removeToken();
   * ```
   */
  removeToken(): void {
    this.storage.remove(StorageKey.ACCESS_TOKEN);
  }

  /**
   * Retrieves user data from storage
   *
   * @template T - User type
   * @returns {(T | null)} User data or null
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * interface User {
   *   id: string;
   *   email: string;
   *   roles: string[];
   * }
   *
   * const user = storage.getUser<User>();
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
   * @template T - User type
   * @param {T} user - User object
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * storage.setUser({
   *   id: '123',
   *   email: 'user@example.com',
   *   roles: ['user', 'admin']
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
   */
  removeUser(): void {
    this.storage.remove(StorageKey.USER);
  }

  /**
   * Clears all authentication data
   * Removes both token and user data
   *
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * // Complete logout
   * storage.clear();
   * httpClient.setAuthToken(null);
   * ```
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Checks if user is currently authenticated
   * Based on presence of access token
   *
   * @returns {boolean} True if access token exists
   * @memberof TokenStorage
   *
   * @example
   * ```typescript
   * if (storage.hasToken()) {
   *   // User is authenticated
   *   await fetchProtectedData();
   * } else {
   *   // Redirect to login
   *   router.push('/login');
   * }
   * ```
   */
  hasToken(): boolean {
    return this.storage.has(StorageKey.ACCESS_TOKEN);
  }
}
