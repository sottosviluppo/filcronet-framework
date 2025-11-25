import type { IStorage } from "./storage.interface";

/**
 * In-memory storage implementation
 * Data is stored in memory and lost when page is refreshed
 * Useful for sensitive data like access tokens (XSS-safe)
 *
 * @export
 * @class MemoryStorage
 * @implements {IStorage}
 *
 * @example
 * ```typescript
 * const storage = new MemoryStorage();
 * storage.set('accessToken', 'token123');
 *
 * // On page refresh:
 * storage.get('accessToken'); // null (data lost)
 * ```
 */
export class MemoryStorage implements IStorage {
  /**
   * Internal data store
   *
   * @private
   * @type {Map<string, any>}
   * @memberof MemoryStorage
   */
  private data: Map<string, any> = new Map();

  /**
   * Retrieves a value from memory
   *
   * @template T
   * @param {string} key - Storage key
   * @returns {(T | null)} Stored value or null
   * @memberof MemoryStorage
   */
  get<T>(key: string): T | null {
    return this.data.get(key) ?? null;
  }

  /**
   * Stores a value in memory
   *
   * @template T
   * @param {string} key - Storage key
   * @param {T} value - Value to store
   * @memberof MemoryStorage
   */
  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  /**
   * Removes a value from memory
   *
   * @param {string} key - Storage key
   * @memberof MemoryStorage
   */
  remove(key: string): void {
    this.data.delete(key);
  }

  /**
   * Clears all values from memory
   *
   * @memberof MemoryStorage
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Checks if a key exists in memory
   *
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   * @memberof MemoryStorage
   */
  has(key: string): boolean {
    return this.data.has(key);
  }
}
