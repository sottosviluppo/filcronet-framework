/**
 * Filcronet File Manager Backend Package
 * Complete file upload and management system for NestJS
 *
 * This package provides:
 * - Single and multiple file uploads with validation
 * - Public and private file storage with automatic URL generation
 * - Magic bytes validation for secure file type verification
 * - Image metadata extraction (dimensions)
 * - Soft delete with configurable retention and automatic cleanup
 * - Batch operations (update, delete)
 * - Entity associations (polymorphic relations)
 * - Tag and category management
 * - Comprehensive API with Swagger documentation
 *
 * IMPORTANT: This package does NOT include authentication.
 * The consuming application must provide its own authentication guards.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';
 * import { APP_GUARD } from '@nestjs/core';
 * import { JwtAuthGuard, PermissionsGuard } from '@sottosviluppo/auth-backend';
 *
 * @Module({
 *   imports: [
 *     // Your auth module first
 *     FilcronetAuthModule.forRoot({ ... }),
 *
 *     // Then file manager
 *     FilcronetFileManagerModule.forRoot({
 *       storage: {
 *         basePath: './uploads',
 *         publicUrlPath: '/uploads/public',
 *       },
 *       validation: {
 *         maxFileSize: 10 * 1024 * 1024,
 *         allowedMimeTypes: ['image/*', 'application/pdf'],
 *         validateMagicBytes: true,
 *       },
 *       cleanup: {
 *         enabled: true,
 *         retentionDays: 30,
 *       },
 *     }),
 *   ],
 *   providers: [
 *     // Apply guards globally
 *     { provide: APP_GUARD, useClass: JwtAuthGuard },
 *     { provide: APP_GUARD, useClass: PermissionsGuard },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

// Module
export * from "./file-manager.module";

// Entities
export * from "./entities/file.entity";

// Services
export * from "./services/file.service";
export * from "./services/storage.service";
export * from "./services/metadata.service";
export * from "./services/cleanup.service";

// Controllers
export * from "./controllers/file.controller";
export * from "./controllers/admin-file.controller";

// DTOs
export * from "./dto/upload-file.dto";
export * from "./dto/update-file.dto";
export * from "./dto/file-query.dto";
export * from "./dto/batch-file-operation.dto";
export * from "./dto/batch-update-files.dto";

// Interfaces
export * from "./interfaces/file-manager-options.interface";

// Constants
export * from "./constants/file-manager.constants";

// Utils
export * from "./utils/magic-bytes.util";
export * from "./utils/response.helper";
