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

// Guards
import { FileManagerGuard } from "./guards/file-manager.guard";

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
 * REQUIREMENTS:
 * - TypeORM must be configured with `autoLoadEntities: true`
 * - Guards should be provided via the `guards` option for authentication
 *
 * @export
 * @class FilcronetFileManagerModule
 *
 * @example
 * ```typescript
 * import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';
 * import { JwtAuthGuard, PermissionsGuard } from '@sottosviluppo/auth-backend';
 *
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       autoLoadEntities: true,
 *       // ...
 *     }),
 *
 *     FilcronetFileManagerModule.forRoot({
 *       storage: {
 *         basePath: './uploads',
 *         publicUrlPath: '/uploads/public',
 *       },
 *       validation: {
 *         allowedMimeTypes: ['image/*', 'application/pdf'],
 *       },
 *       guards: {
 *         guards: [JwtAuthGuard, PermissionsGuard],
 *       },
 *     }),
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
   */
  static forRoot(options: IFileManagerModuleOptions): DynamicModule {
    this.logger.log("Initializing File Manager Module");

    // Warn if no guards configured
    if (!options.guards?.guards?.length) {
      this.logger.warn(
        "⚠️  No guards configured! File endpoints will be unprotected. " +
          "Configure guards via the 'guards' option."
      );
    } else {
      this.logger.log(
        `Guards configured: ${options.guards.guards
          .map((g) => g.name)
          .join(", ")}`
      );
    }

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

    // Build providers array - include configured guard classes
    const providers: any[] = [
      {
        provide: FILE_MANAGER_OPTIONS,
        useValue: options,
      },
      StorageService,
      MetadataService,
      FileService,
      CleanupService,
      FileManagerGuard,
    ];

    // Add the guard classes themselves so they can be resolved by ModuleRef
    if (options.guards?.guards?.length) {
      for (const guard of options.guards.guards) {
        providers.push(guard);
      }
    }

    return {
      module: FilcronetFileManagerModule,
      imports,
      controllers: [FileController, AdminFileController],
      providers,
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
   *
   * @static
   * @param {IFileManagerModuleAsyncOptions} options - Async module options
   * @returns {DynamicModule} Configured NestJS module
   * @memberof FilcronetFileManagerModule
   */
  static forRootAsync(options: IFileManagerModuleAsyncOptions): DynamicModule {
    this.logger.log("Initializing File Manager Module (async)");

    return {
      module: FilcronetFileManagerModule,
      imports: [
        ...(options.imports || []),
        TypeOrmModule.forFeature([FileEntity]),
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
        FileManagerGuard,
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
