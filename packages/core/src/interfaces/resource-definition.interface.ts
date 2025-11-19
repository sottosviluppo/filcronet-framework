import { PermissionAction } from "../enums/permission-action.enum";

/**
 * Permission string format: "resource:action"
 * Example: "users:create", "products:read"
 */
export type PermissionString = `${string}:${PermissionAction}`;

/**
 * Resource definition for permission system
 */
export interface ResourceDefinition {
  /**
   * Resource name (lowercase, plural)
   * Examples: 'users', 'products', 'blog-posts'
   */
  name: string;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Actions to generate for this resource
   * If not specified, all actions will be generated
   */
  actions?: PermissionAction[];
}
