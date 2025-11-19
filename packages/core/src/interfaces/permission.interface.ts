import { PermissionAction } from "../enums";

/**
 * Permission entity interface
 * Represents a single permission in the RBAC system
 * Permissions follow the pattern: resource:action (e.g., 'users:create')
 *
 * @export
 * @interface IPermission
 */
export interface IPermission {
  /**
   * Unique permission identifier (UUID)
   *
   * @type {string}
   */
  id: string;

  /**
   * Resource this permission applies to
   * Examples: 'users', 'products', 'orders'
   *
   * @type {string}
   */
  resource: string;

  /**
   * Action that can be performed on the resource
   * Examples: 'create', 'read', 'update', 'delete'
   *
   * @type {PermissionAction}
   */
  action: PermissionAction;

  /**
   * Optional human-readable description
   * Explains what this permission allows
   *
   * @type {string}
   */
  description?: string;

  /**
   * Timestamp of permission creation
   *
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp of last update
   *
   * @type {Date}
   */
  updatedAt: Date;
}
