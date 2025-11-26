import { PermissionAction } from "../enums/permission-action.enum";

/**
 * Permission string type in format "resource:action"
 *
 * Used throughout the framework to represent permissions in a consistent format.
 * The resource is typically a plural noun (e.g., 'users', 'products') and
 * the action is one of the PermissionAction enum values.
 *
 * @export
 * @typedef {PermissionString}
 *
 * @example
 * ```typescript
 * const permission: PermissionString = 'users:create';
 * const adminPermission: PermissionString = 'products:manage';
 * ```
 */
export type PermissionString = `${string}:${PermissionAction}`;

/**
 * Resource definition for the dynamic permission system
 *
 * Defines a resource and optionally which actions are available for it.
 * Used during bootstrap to automatically generate permissions.
 *
 * @export
 * @interface ResourceDefinition
 *
 * @example
 * ```typescript
 * // Basic resource (all actions will be generated)
 * const usersResource: ResourceDefinition = {
 *   name: 'users',
 *   description: 'User management',
 * };
 *
 * // Resource with specific actions only
 * const reportsResource: ResourceDefinition = {
 *   name: 'reports',
 *   description: 'Analytics reports',
 *   actions: [PermissionAction.READ, PermissionAction.LIST],
 * };
 * ```
 */
export interface ResourceDefinition {
  /**
   * Resource name in lowercase, typically plural
   *
   * This becomes the first part of permission strings (e.g., 'users' in 'users:create').
   * Use kebab-case for multi-word resources (e.g., 'blog-posts').
   *
   * @type {string}
   * @memberof ResourceDefinition
   *
   * @example 'users', 'products', 'blog-posts', 'order-items'
   */
  name: string;

  /**
   * Human-readable description of the resource
   *
   * Used for documentation and admin UI display.
   *
   * @type {string}
   * @memberof ResourceDefinition
   *
   * @example 'User account management', 'Product catalog'
   */
  description?: string;

  /**
   * Specific actions to generate for this resource
   *
   * If not specified, all PermissionAction values will be generated.
   * Use this to limit permissions for resources that don't need all actions.
   *
   * @type {PermissionAction[]}
   * @memberof ResourceDefinition
   *
   * @example
   * ```typescript
   * // Only allow read and list for audit logs
   * actions: [PermissionAction.READ, PermissionAction.LIST]
   * ```
   */
  actions?: PermissionAction[];
}
