/**
 * Permission action enumeration
 * Defines possible actions that can be performed on resources
 *
 * @export
 * @enum {string}
 */
export enum PermissionAction {
  /**
   * Create new resource instances
   */
  CREATE = "create",

  /**
   * Read/view a single resource
   */
  READ = "read",

  /**
   * Update/modify existing resource
   */
  UPDATE = "update",

  /**
   * Delete/remove resource
   */
  DELETE = "delete",

  /**
   * List/browse multiple resources
   */
  LIST = "list",

  /**
   * Full access to resource (all actions)
   */
  MANAGE = "manage",
}
