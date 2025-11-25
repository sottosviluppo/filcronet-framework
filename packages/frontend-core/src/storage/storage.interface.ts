/**
 * Generic storage interface for key-value data persistence
 * Provides a unified API for different storage backends (memory, localStorage, sessionStorage)
 *
 * @export
 * @interface IStorage
 *
 * @example
 * ```typescript
 * const storage: IStorage = new MemoryStorage();
 * storage.set('user', { name: 'John', id: 123 });
 * const user = storage.get<User>('user');
 * ```
 */
export interface IStorage {
  /**
   * Retrieves a value from storage
   *
   * @template T - Expected value type
   * @param {string} key - Storage key
   * @returns {(T | null)} Stored value or null if not found
   * @memberof IStorage
   *
   * @example
   * ```typescript
   * const user = storage.get<User>('user');
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  get<T>(key: string): T | null;

  /**
   * Stores a value in storage
   *
   * @template T - Value type
   * @param {string} key - Storage key
   * @param {T} value - Value to store
   * @memberof IStorage
   *
   * @example
   * ```typescript
   * storage.set('user', { name: 'John', id: 123 });
   * storage.set('settings', { theme: 'dark', language: 'en' });
   * ```
   */
  set<T>(key: string, value: T): void;

  /**
   * Removes a value from storage
   *
   * @param {string} key - Storage key
   * @memberof IStorage
   *
   * @example
   * ```typescript
   * storage.remove('user');
   * ```
   */
  remove(key: string): void;

  /**
   * Clears all values from storage
   *
   * @memberof IStorage
   *
   * @example
   * ```typescript
   * storage.clear(); // Removes all stored data
   * ```
   */
  clear(): void;

  /**
   * Checks if a key exists in storage
   *
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   * @memberof IStorage
   *
   * @example
   * ```typescript
   * if (storage.has('user')) {
   *   const user = storage.get('user');
   * }
   * ```
   */
  has(key: string): boolean;
}
