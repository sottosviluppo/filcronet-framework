/**
 * Enumerations module
 * Exports all enum types used across the Filcronet framework
 *
 * These enums provide type-safe constants for:
 * - User account statuses
 * - Permission actions (CRUD operations)
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { UserStatus, PermissionAction } from '@sottosviluppo/core';
 *
 * // Check user status
 * if (user.status === UserStatus.ACTIVE) {
 *   // User can access the system
 * }
 *
 * // Create permission string
 * const permission = `users:${PermissionAction.CREATE}`;
 * ```
 */

export * from "./user-status.enum";
export * from "./permission-action.enum";
