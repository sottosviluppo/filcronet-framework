/**
 * Token storage interface for authentication data
 *
 * Provides a specialized API for managing JWT access tokens and user data.
 * Implementations can use different storage backends (memory, localStorage, etc.)
 * with different security trade-offs.
 *
 * The default implementation (TokenStorage) uses in-memory storage for
 * XSS protection - tokens are not accessible via JavaScript injection attacks.
 *
 * @export
 * @interface ITokenStorage
 *
 * @example
 * ```typescript
 * // Using the default implementation
 * import { TokenStorage } from '@sottosviluppo/auth-frontend';
 *
 * const storage: ITokenStorage = new TokenStorage();
 *
 * // Store authentication data
 * storage.setToken('eyJhbGciOiJIUzI1NiIs...');
 * storage.setUser({ id: '123', email: 'user@example.com' });
 *
 * // Retrieve data
 * const token = storage.getToken();
 * const user = storage.getUser<IUser>();
 *
 * // Clear on logout
 * storage.clear();
 * ```
 *
 * @example
 * ```typescript
 * // Custom implementation with localStorage (less secure)
 * class LocalStorageTokenStorage implements ITokenStorage {
 *   getToken(): string | null {
 *     return localStorage.getItem('access_token');
 *   }
 *   setToken(token: string): void {
 *     localStorage.setItem('access_token', token);
 *   }
 *   // ... other methods
 * }
 * ```
 */
export interface ITokenStorage {
  /**
   * Retrieves the stored access token
   *
   * @returns {(string | null)} JWT access token or null if not stored
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * const token = storage.getToken();
   * if (token) {
   *   httpClient.setAuthToken(token);
   * }
   * ```
   */
  getToken(): string | null;

  /**
   * Stores the access token
   *
   * @param {string} token - JWT access token to store
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * const response = await authApi.login(credentials);
   * storage.setToken(response.accessToken);
   * ```
   */
  setToken(token: string): void;

  /**
   * Removes the access token from storage
   *
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * // Remove only the token, keep user data
   * storage.removeToken();
   * ```
   */
  removeToken(): void;

  /**
   * Retrieves stored user data
   *
   * @template T - User data type (typically IUser from @sottosviluppo/core)
   * @returns {(T | null)} User data or null if not stored
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * import { IUser } from '@sottosviluppo/core';
   *
   * const user = storage.getUser<IUser>();
   * if (user) {
   *   console.log(`Logged in as ${user.email}`);
   * }
   * ```
   */
  getUser<T>(): T | null;

  /**
   * Stores user data
   *
   * @template T - User data type
   * @param {T} user - User object to store
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * const response = await authApi.login(credentials);
   * storage.setUser(response.user);
   * ```
   */
  setUser<T>(user: T): void;

  /**
   * Removes user data from storage
   *
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * // Remove only user data, keep token
   * storage.removeUser();
   * ```
   */
  removeUser(): void;

  /**
   * Clears all authentication data from storage
   *
   * Removes both access token and user data.
   * Call this on logout for complete cleanup.
   *
   * @memberof ITokenStorage
   *
   * @example
   * ```typescript
   * async function logout() {
   *   await authApi.logout(); // Clear HttpOnly cookie on server
   *   storage.clear();        // Clear local storage
   * }
   * ```
   */
  clear(): void;
}
