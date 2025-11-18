import { IPermission } from "./permission.interface";

/**
 * Role entity interface
 * Roles group permissions and are assigned to users
 *
 * @export
 * @interface IRole
 */
export interface IRole {
  /**
   * Unique role identifier (UUID)
   *
   * @type {string}
   */
  id: string;

  /**
   * Role name (unique)
   * Examples: 'admin', 'user', 'moderator'
   *
   * @type {string}
   */
  name: string;

  /**
   * Optional role description
   * Explains the role's purpose and scope
   *
   * @type {string}
   */
  description?: string;

  /**
   * Permissions assigned to this role
   *
   * @type {IPermission[]}
   */
  permissions: IPermission[];

  /**
   * Whether this is a system role
   * System roles cannot be modified or deleted
   * Examples: 'admin', 'user' base roles
   *
   * @type {boolean}
   */
  isSystem: boolean;

  /**
   * Timestamp of role creation
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

/**
 * Data Transfer Object for creating a new role
 *
 * @export
 * @interface ICreateRoleDto
 */
export interface ICreateRoleDto {
  /**
   * Role name (must be unique)
   *
   * @type {string}
   */
  name: string;

  /**
   * Optional role description
   *
   * @type {string}
   */
  description?: string;

  /**
   * Array of permission IDs to assign to this role
   *
   * @type {string[]}
   */
  permissionIds?: string[];
}

/**
 * Data Transfer Object for updating role information
 * All fields are optional
 *
 * @export
 * @interface IUpdateRoleDto
 */
export interface IUpdateRoleDto {
  /**
   * Updated role name
   *
   * @type {string}
   */
  name?: string;

  /**
   * Updated role description
   *
   * @type {string}
   */
  description?: string;

  /**
   * Updated array of permission IDs
   *
   * @type {string[]}
   */
  permissionIds?: string[];
}
