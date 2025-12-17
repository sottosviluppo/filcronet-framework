/**
 * @fileoverview Configuration interfaces for the FileManager module
 * @packageDocumentation
 */

import { ModuleMetadata, Type, CanActivate } from "@nestjs/common";

/**
 * Storage configuration options
 *
 * @export
 * @interface IStorageOptions
 */
export interface IStorageOptions {
  /**
   * Base path for file storage on the filesystem
   *
   * @type {string}
   * @example './uploads'
   */
  basePath: string;

  /**
   * URL path prefix for serving public files
   * Should match your static file serving configuration
   *
   * @type {string}
   * @example '/uploads/public'
   */
  publicUrlPath: string;

  /**
   * Subdirectory name for public files
   *
   * @type {string}
   * @default 'public'
   */
  publicDir?: string;

  /**
   * Subdirectory name for private files
   *
   * @type {string}
   * @default 'private'
   */
  privateDir?: string;
}

/**
 * Per-MIME-type validation rule
 *
 * @export
 * @interface IMimeTypeRule
 */
export interface IMimeTypeRule {
  /**
   * Maximum file size in bytes for this MIME type
   * Overrides the global maxFileSize
   *
   * @type {number}
   */
  maxSize: number;
}

/**
 * File validation configuration options
 *
 * @export
 * @interface IValidationOptions
 */
export interface IValidationOptions {
  /**
   * Maximum file size in bytes (global default)
   *
   * @type {number}
   * @default 10485760 (10MB)
   */
  maxFileSize?: number;

  /**
   * Allowed MIME types
   * Supports wildcards (e.g., 'image/*')
   *
   * @type {string[]}
   * @example ['image/jpeg', 'image/png', 'application/pdf']
   * @example ['image/*', 'application/pdf']
   */
  allowedMimeTypes: string[];

  /**
   * Per-MIME-type size limits
   * Keys can be exact types or wildcards
   *
   * @type {Record<string, IMimeTypeRule>}
   * @example { 'image/*': { maxSize: 5242880 }, 'video/*': { maxSize: 104857600 } }
   */
  mimeTypeRules?: Record<string, IMimeTypeRule>;

  /**
   * Validate file content using magic bytes
   * Prevents MIME type spoofing
   *
   * @type {boolean}
   * @default true
   */
  validateMagicBytes?: boolean;
}

/**
 * Cleanup/retention configuration options
 *
 * @export
 * @interface ICleanupOptions
 */
export interface ICleanupOptions {
  /**
   * Enable automatic cleanup of soft-deleted files
   *
   * @type {boolean}
   * @default true
   */
  enabled?: boolean;

  /**
   * Retention period in days before permanent deletion
   *
   * @type {number}
   * @default 30
   */
  retentionDays?: number;

  /**
   * Cron expression for cleanup job schedule
   *
   * @type {string}
   * @default '0 3 * * *' (daily at 3 AM)
   */
  cronExpression?: string;
}

/**
 * Metadata extraction configuration options
 *
 * @export
 * @interface IMetadataOptions
 */
export interface IMetadataOptions {
  /**
   * Extract image dimensions (width, height)
   *
   * @type {boolean}
   * @default true
   */
  extractImageDimensions?: boolean;
}

/**
 * Default values for file properties
 *
 * @export
 * @interface IDefaultsOptions
 */
export interface IDefaultsOptions {
  /**
   * Default visibility for uploaded files
   *
   * @type {boolean}
   * @default false (private)
   */
  isPublic?: boolean;
}

/**
 * Guard configuration for protecting file endpoints
 *
 * @export
 * @interface IGuardsOptions
 */
export interface IGuardsOptions {
  /**
   * Guards to apply to all file endpoints
   * These guards will be applied in order
   *
   * @type {Type<CanActivate>[]}
   * @example
   * ```typescript
   * import { JwtAuthGuard, PermissionsGuard } from '@sottosviluppo/auth-backend';
   *
   * guards: {
   *   guards: [JwtAuthGuard, PermissionsGuard],
   * }
   * ```
   */
  guards: Type<CanActivate>[];

  /**
   * Swagger security scheme name
   * This should match the security scheme defined in your Swagger setup
   * Common values: 'bearer', 'basic', 'api_key'
   * If not provided, no security decorator will be shown in Swagger
   *
   * @type {string}
   * @example 'bearer' // For JWT Bearer auth
   * @example 'basic' // For Basic auth
   */
  swaggerSecurityName?: string;
}

/**
 * Complete FileManager module configuration options
 *
 * @export
 * @interface IFileManagerModuleOptions
 *
 * @example
 * ```typescript
 * FilcronetFileManagerModule.forRoot({
 *   storage: {
 *     basePath: './uploads',
 *     publicUrlPath: '/uploads/public',
 *   },
 *   validation: {
 *     maxFileSize: 10 * 1024 * 1024,
 *     allowedMimeTypes: ['image/*', 'application/pdf'],
 *     validateMagicBytes: true,
 *   },
 *   cleanup: {
 *     enabled: true,
 *     retentionDays: 30,
 *   },
 * })
 * ```
 */
export interface IFileManagerModuleOptions {
  /**
   * Storage configuration (required)
   *
   * @type {IStorageOptions}
   */
  storage: IStorageOptions;

  /**
   * File validation configuration (required)
   *
   * @type {IValidationOptions}
   */
  validation: IValidationOptions;

  /**
   * Cleanup/retention configuration (optional)
   * If not provided, cleanup is disabled
   *
   * @type {ICleanupOptions}
   */
  cleanup?: ICleanupOptions;

  /**
   * Metadata extraction configuration (optional)
   *
   * @type {IMetadataOptions}
   */
  metadata?: IMetadataOptions;

  /**
   * Default values for file properties (optional)
   *
   * @type {IDefaultsOptions}
   */
  defaults?: IDefaultsOptions;

  /**
   * Guards to protect file endpoints (optional but recommended)
   * If not provided, endpoints will be unprotected!
   *
   * @type {IGuardsOptions}
   * @example
   * ```typescript
   * guards: {
   *   guards: [JwtAuthGuard, PermissionsGuard],
   * }
   * ```
   */
  guards?: IGuardsOptions;
}

/**
 * Async configuration options for FileManager module
 * Use when configuration depends on other services (e.g., ConfigService)
 *
 * @export
 * @interface IFileManagerModuleAsyncOptions
 *
 * @example
 * ```typescript
 * FilcronetFileManagerModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     storage: {
 *       basePath: config.get('UPLOAD_PATH'),
 *       publicUrlPath: config.get('PUBLIC_URL'),
 *     },
 *     validation: {
 *       maxFileSize: parseInt(config.get('MAX_FILE_SIZE')),
 *       allowedMimeTypes: config.get('ALLOWED_TYPES').split(','),
 *     },
 *   }),
 * })
 * ```
 */
export interface IFileManagerModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  /**
   * Factory function to create module options
   * Can be async
   *
   * @type {(...args: any[]) => Promise<IFileManagerModuleOptions> | IFileManagerModuleOptions}
   */
  useFactory: (
    ...args: any[]
  ) => Promise<IFileManagerModuleOptions> | IFileManagerModuleOptions;

  /**
   * Dependencies to inject into the factory function
   *
   * @type {any[]}
   */
  inject?: any[];

  /**
   * Whether the module should be global
   *
   * @type {boolean}
   * @default true
   */
  isGlobal?: boolean;
}
