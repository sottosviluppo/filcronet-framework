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
   * Default roles to be created on application bootstrap
   *
   * @type {string[]}
   */
  defaultRoles?: string[];

  /**
   * Resources for permission system
   * Define which resources your application has
   * Permissions will be auto-generated for each resource
   *
   * @type {ResourceDefinition[]}
   * @example
   * resources: [
   *   { name: 'users', description: 'User management' },
   *   { name: 'products', description: 'Product catalog' },
   *   { name: 'orders', description: 'Order management' },
   * ]
   */
  resources: ResourceDefinition[];

  /**
   * Email configuration for password recovery and invitations
   * Optional - if not provided, email features will be disabled
   */
  email?: {
    /**
     * Email service to use
     * Must implement IEmailService interface
     */
    service?: any;
  };

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
