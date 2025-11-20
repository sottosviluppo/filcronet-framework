import { ResourceDefinition } from "@sottosviluppo/core";
import type { StringValue } from "ms";

/**
 * Configuration options for Filcronet Auth Module
 *
 * @export
 * @interface AuthModuleOptions
 */
export interface AuthModuleOptions {
  /**
   * JWT configuration options
   */
  jwt: {
    /**
     * Secret key for signing JWT tokens
     * IMPORTANT: Use a strong, unique secret in production
     *
     * @type {string}
     */
    secret: string;

    /**
     * Access token expiration time
     *
     * @type {(number | StringValue)}
     * @default '15m'
     */
    expiresIn?: number | StringValue;

    /**
     * Refresh token expiration time
     *
     * @type {(number | StringValue)}
     * @default '7d'
     */
    refreshExpiresIn?: number | StringValue;
  };

  /**
   * Number of bcrypt rounds for password hashing
   *
   * @type {number}
   * @default 10
   */
  bcryptRounds?: number;

  /**
   * Role assigned to new users registering via /auth/register
   *
   * System roles (always available):
   * - 'super-admin': Full system access (not recommended for public registration)
   * - 'admin': User and role management access
   * - 'user': Read-only access (recommended default)
   *
   * Custom roles: Can be created via POST /roles after initial setup
   * If using a custom role, ensure it exists before users can register
   *
   * @type {string}
   * @default 'user'
   *
   * @example
   * ```typescript
   * // Use system role (recommended for most cases)
   * defaultUserRole: 'user'
   *
   * // Use custom role (must be created first via API)
   * defaultUserRole: 'customer'
   * ```
   */
  defaultUserRole?: string;

  /**
   * Application-specific resources for permission system
   *
   * Default resources (users, roles, permissions) are automatically included.
   * You only need to define your custom application resources here.
   *
   * If you redefine a default resource, your configuration will override it.
   *
   * @type {ResourceDefinition[]}
   * @example
   * ```typescript
   * resources: [
   *   // Default resources (users, roles, permissions) are auto-included
   *   // Only define your custom resources:
   *   {
   *     name: 'products',
   *     description: 'Product catalog management',
   *     actions: [PermissionAction.CREATE, PermissionAction.READ] // Optional
   *   },
   *   {
   *     name: 'orders',
   *     description: 'Order processing and tracking'
   *   },
   * ]
   * ```
   */
  resources?: ResourceDefinition[];

  /**
   * Password reset token configuration
   */
  passwordReset?: {
    /**
     * Reset token expiration time
     *
     * @type {(number | StringValue)}
     * @default '15m'
     */
    expiresIn?: number | StringValue;
  };

  /**
   * Invitation token configuration (set password)
   */
  invitation?: {
    /**
     * Invitation token expiration time
     *
     * @type {(number | StringValue)}
     * @default '7d'
     */
    expiresIn?: number | StringValue;
  };
}
