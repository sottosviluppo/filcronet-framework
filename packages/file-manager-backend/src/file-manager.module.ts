/**
 * @fileoverview File Manager module for NestJS
 * Provides complete file upload, storage, and management functionality
 * @packageDocumentation
 */

import { Module, DynamicModule, Global, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

// Entities
import { FileEntity } from "./entities/file.entity";

// Services
import { FileService } from "./services/file.service";
import { StorageService } from "./services/storage.service";
import { MetadataService } from "./services/metadata.service";
import { CleanupService } from "./services/cleanup.service";

// Controllers
import { FileController } from "./controllers/file.controller";
import { AdminFileController } from "./controllers/admin-file.controller";

// Interfaces
import {
  IFileManagerModuleOptions,
  IFileManagerModuleAsyncOptions,
} from "./interfaces/file-manager-options.interface";

// Constants
import {
  FILE_MANAGER_OPTIONS,
  FILE_MANAGER_DEFAULTS,
} from "./constants/file-manager.constants";

/**
 * Filcronet File Manager Module
 * Provides complete file management functionality:
 * - Single and multiple file uploads
 * - Public and private file storage
 * - File metadata extraction
 * - Soft delete with automatic cleanup
 * - Batch operations
 * - Entity associations
 *
 * IMPORTANT: This module does NOT include authentication/authorization.
 * Apply guards globally in your application or use @sottosviluppo/auth-backend.
 *
 * @export
 * @class FilcronetFileManagerModule
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';
 * import { APP_GUARD } from '@nestjs/core';
 * import { JwtAuthGuard } from '@sottosviluppo/auth-backend';
 *
 * @Module({
 *   imports: [
 *     FilcronetFileManagerModule.forRoot({
 *       storage: {
 *         basePath: './uploads',
 *         publicUrlPath: '/uploads/public',
 *       },
 *       validation: {
 *         maxFileSize: 10 * 1024 * 1024,
 *         allowedMimeTypes: ['image/*', 'application/pdf'],
 *       },
 *       cleanup: {
 *         enabled: true,
 *         retentionDays: 30,
 *       },
 *     }),
 *   ],
 *   providers: [
 *     // Apply authentication globally
 *     { provide: APP_GUARD, useClass: JwtAuthGuard },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class FilcronetFileManagerModule {
  private static readonly logger = new Logger(FilcronetFileManagerModule.name);

  /**
   * Configures the file manager module with static options
   *
   * @static
   * @param {IFileManagerModuleOptions} options - Module configuration
   * @returns {DynamicModule} Configured NestJS module
   * @memberof FilcronetFileManagerModule
   *
   * @example
   * ```typescript
   * FilcronetFileManagerModule.forRoot({
   *   storage: {
   *     basePath: '/var/www/uploads',
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
  static forRoot(options: IFileManagerModuleOptions): DynamicModule {
    this.logger.log("Initializing File Manager Module");

    const maxFileSize =
      options.validation?.maxFileSize ?? FILE_MANAGER_DEFAULTS.MAX_FILE_SIZE;

    const imports: any[] = [
      TypeOrmModule.forFeature([FileEntity]),
      MulterModule.register({
        storage: memoryStorage(),
        limits: { fileSize: maxFileSize },
      }),
    ];

    // Add ScheduleModule if cleanup is enabled
    if (options.cleanup?.enabled) {
      imports.push(ScheduleModule.forRoot());
      this.logger.log(
        `Cleanup enabled with ${
          options.cleanup.retentionDays ?? FILE_MANAGER_DEFAULTS.RETENTION_DAYS
        } days retention`
      );
    }

    return {
      module: FilcronetFileManagerModule,
      imports,
      controllers: [FileController, AdminFileController],
      providers: [
        {
          provide: FILE_MANAGER_OPTIONS,
          useValue: options,
        },
        StorageService,
        MetadataService,
        FileService,
        CleanupService,
      ],
      exports: [
        FileService,
        StorageService,
        MetadataService,
        CleanupService,
        FILE_MANAGER_OPTIONS,
      ],
    };
  }

  /**
   * Configures the file manager module with async options
   * Useful when configuration depends on other services (e.g., ConfigService)
   *
   * @static
   * @param {IFileManagerModuleAsyncOptions} options - Async module options
   * @returns {DynamicModule} Configured NestJS module
   * @memberof FilcronetFileManagerModule
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
   *     cleanup: {
   *       enabled: config.get('CLEANUP_ENABLED') === 'true',
   *       retentionDays: parseInt(config.get('RETENTION_DAYS')),
   *     },
   *   }),
   * })
   * ```
   */
  static forRootAsync(options: IFileManagerModuleAsyncOptions): DynamicModule {
    this.logger.log("Initializing File Manager Module (async)");

    return {
      module: FilcronetFileManagerModule,
      imports: [
        ...(options.imports || []),
        TypeOrmModule.forFeature([FileEntity]),
        // Multer configured async
        MulterModule.registerAsync({
          imports: options.imports,
          inject: options.inject,
          useFactory: async (...args: any[]) => {
            const config = options.useFactory
              ? await options.useFactory(...args)
              : ({} as IFileManagerModuleOptions);
            return {
              storage: memoryStorage(),
              limits: {
                fileSize:
                  config.validation?.maxFileSize ??
                  FILE_MANAGER_DEFAULTS.MAX_FILE_SIZE,
              },
            };
          },
        }),
        // Always include ScheduleModule for async (we don't know if cleanup is enabled yet)
        ScheduleModule.forRoot(),
      ],
      controllers: [FileController, AdminFileController],
      providers: [
        {
          provide: FILE_MANAGER_OPTIONS,
          useFactory: options.useFactory!,
          inject: options.inject || [],
        },
        StorageService,
        MetadataService,
        FileService,
        CleanupService,
      ],
      exports: [
        FileService,
        StorageService,
        MetadataService,
        CleanupService,
        FILE_MANAGER_OPTIONS,
      ],
      global: options.isGlobal ?? true,
    };
  }
}
