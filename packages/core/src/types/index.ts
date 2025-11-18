/**
 * Type utilities module
 * Provides essential TypeScript utility types for common patterns
 *
 * @packageDocumentation
 */

/**
 * Makes a type nullable (can be T or null)
 * Useful for database queries that might return null
 *
 * @export
 * @typedef {Nullable}
 * @template T
 *
 * @example
 * ```typescript
 * // Service method that might not find a user
 * async findByEmail(email: string): Promise<Nullable<User>> {
 *   return this.userRepo.findOne({ where: { email } }) || null;
 * }
 * ```
 */
export type Nullable<T> = T | null;

/**
 * Makes a type optional (can be T or undefined)
 *
 * @export
 * @typedef {Optional}
 * @template T
 *
 * @example
 * ```typescript
 * // Function with optional return
 * function findInCache(key: string): Optional<CachedData> {
 *   return cache.get(key);
 * }
 * ```
 */
export type Optional<T> = T | undefined;

/**
 * Makes all properties of T optional recursively
 * Extremely useful for update DTOs with nested objects
 *
 * @export
 * @typedef {DeepPartial}
 * @template T
 *
 * @example
 * ```typescript
 * interface UserSettings {
 *   profile: {
 *     avatar: string;
 *     bio: string;
 *   };
 *   preferences: {
 *     theme: 'light' | 'dark';
 *     notifications: {
 *       email: boolean;
 *       push: boolean;
 *     };
 *   };
 * }
 *
 * // All nested properties become optional
 * type UpdateSettings = DeepPartial<UserSettings>;
 *
 * // Valid partial update
 * const update: UpdateSettings = {
 *   preferences: {
 *     notifications: { email: false }
 *   }
 * };
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
