/**
 * Permission resource enumeration
 * Defines base system resources that can be protected
 * Client projects can extend this enum with custom resources
 *
 * @export
 * @enum {string}
 */
export enum PermissionResource {
  /**
   * User management resource
   */
  USERS = "users",

  /**
   * Role management resource
   */
  ROLES = "roles",

  /**
   * Permission management resource
   */
  PERMISSIONS = "permissions",

  /**
   * File upload/management resource
   */
  FILES = "files",

  // Client projects can add more:
  // PRODUCTS = 'products',
  // ORDERS = 'orders',
  // etc.
}
