import type { IStorage } from "./storage.interface";

/**
 * LocalStorage implementation
 * Data persists across browser sessions
 * Useful for non-sensitive data that should survive page refresh
 *
 * ⚠️ WARNING: Not suitable for sensitive data (vulnerable to XSS)
 *
 * @export
 * @class LocalStorage
 * @implements {IStorage}
 *
 * @example
 * ```typescript
 * const storage = new LocalStorage();
 * storage.set('theme', 'dark');
 *
 * // After page refresh:
 * storage.get('theme'); // 'dark' (data persists)
 * ```
 */
export class LocalStorage implements IStorage {
  /**
   * Retrieves a value from localStorage
   * Automatically parses JSON if stored as JSON
   *
   * @template T
   * @param {string} key - Storage key
   * @returns {(T | null)} Stored value or null
   * @memberof LocalStorage
   */
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      // Not JSON, return as-is
      return item as T;
    }
  }

  /**
   * Stores a value in localStorage
   * Automatically serializes objects to JSON
   *
   * @template T
   * @param {string} key - Storage key
   * @param {T} value - Value to store
   * @memberof LocalStorage
   */
  set<T>(key: string, value: T): void {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }

  /**
   * Removes a value from localStorage
   *
   * @param {string} key - Storage key
   * @memberof LocalStorage
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all values from localStorage
   *
   * @memberof LocalStorage
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Checks if a key exists in localStorage
   *
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   * @memberof LocalStorage
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
