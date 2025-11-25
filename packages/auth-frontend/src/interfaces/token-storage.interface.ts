/**
 * Token-specific storage interface for authentication
 * Provides specialized API for managing access tokens and user data
 *
 * @export
 * @interface ITokenStorage
 *
 * @example
 * ```typescript
 * const storage: ITokenStorage = new MemoryTokenStorage();
 *
 * // Store access token
 * storage.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 *
 * // Store user data
 * storage.setUser({ id: '123', email: 'user@example.com' });
 *
 * // Retrieve
 * const token = storage.getToken();
 * const user = storage.getUser<User>();
 *
 * // Clear on logout
 * storage.clear();
 * ```
 */
export interface ITokenStorage {
  /**
   * Retrieves the access token
   *
   * @returns {(string | null)} Access token or null if not found
   * @memberof ITokenStorage
   */
  getToken(): string | null;

  /**
   * Stores the access token
   *
   * @param {string} token - JWT access token
   * @memberof ITokenStorage
   */
  setToken(token: string): void;

  /**
   * Removes the access token from storage
   *
   * @memberof ITokenStorage
   */
  removeToken(): void;

  /**
   * Retrieves user data from storage
   *
   * @template T - User type
   * @returns {(T | null)} User data or null
   * @memberof ITokenStorage
   */
  getUser<T>(): T | null;

  /**
   * Stores user data
   *
   * @template T - User type
   * @param {T} user - User object
   * @memberof ITokenStorage
   */
  setUser<T>(user: T): void;

  /**
   * Removes user data from storage
   *
   * @memberof ITokenStorage
   */
  removeUser(): void;

  /**
   * Clears all authentication data (token and user)
   *
   * @memberof ITokenStorage
   */
  clear(): void;
}
