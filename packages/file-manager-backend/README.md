# @sottosviluppo/file-manager-backend

Complete file upload and management system for NestJS applications.

This package provides enterprise-grade file management with validation, storage organization, metadata extraction, and automatic cleanup - all with zero authentication coupling.

## Features

- **File Upload**: Single and multiple file uploads with multipart/form-data
- **Storage Management**: Date-based directory structure (YYYY/MM) with separate public/private areas
- **Validation**: MIME type allowlists, file size limits, and magic bytes verification
- **Metadata Extraction**: Automatic image dimension extraction (JPEG, PNG, GIF, WebP, BMP)
- **Soft Delete**: Configurable retention period with automatic cleanup
- **Batch Operations**: Update or delete multiple files in a single request
- **Entity Associations**: Polymorphic relations to link files with any entity
- **Tags & Categories**: Flexible file organization and filtering
- **Swagger Documentation**: Full OpenAPI documentation for all endpoints

## Installation

```bash
# Using pnpm (recommended)
pnpm add @sottosviluppo/file-manager-backend

# Using npm
npm install @sottosviluppo/file-manager-backend

# Using yarn
yarn add @sottosviluppo/file-manager-backend
```

### Peer Dependencies

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/typeorm @nestjs/platform-express @nestjs/swagger @nestjs/schedule typeorm multer
```

### GitHub Packages Authentication

This package is hosted on GitHub Packages. Configure your `.npmrc`:

```ini
@sottosviluppo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Quick Start

### Basic Setup (No Authentication)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // ... your database config
      autoLoadEntities: true, // Required!
      synchronize: true, // Only for development
    }),

    FilcronetFileManagerModule.forRoot({
      storage: {
        basePath: './uploads',
        publicUrlPath: '/uploads/public',
      },
      validation: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/*', 'application/pdf'],
      },
    }),
  ],
})
export class AppModule {}
```

### With Authentication (@sottosviluppo/auth-backend)

When using with `@sottosviluppo/auth-backend`, you need to:

1. Add `files` to the resources configuration in auth-backend
2. Pass the guards to file-manager-backend

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  FilcronetAuthModule,
  JwtAuthGuard,
  PermissionsGuard,
} from '@sottosviluppo/auth-backend';
import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'mydb',
      autoLoadEntities: true,
      synchronize: true,
    }),

    // Serve public files statically
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads', 'public'),
      serveRoot: '/uploads/public',
    }),

    // Auth module - IMPORTANT: Add 'files' resource for permissions
    FilcronetAuthModule.forRoot({
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
        refreshExpiresIn: '7d',
      },
      resources: [
        // This creates permissions: files:create, files:read, files:update, 
        // files:delete, files:list, files:manage
        { name: 'files', description: 'File management' },
        // ... your other resources
      ],
    }),

    // File manager with guards from auth-backend
    FilcronetFileManagerModule.forRoot({
      storage: {
        basePath: './uploads',
        publicUrlPath: '/uploads/public',
      },
      validation: {
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'],
        validateMagicBytes: true,
      },
      cleanup: {
        enabled: true,
        retentionDays: 30,
      },
      defaults: {
        isPublic: false,
      },
      guards: {
        guards: [JwtAuthGuard, PermissionsGuard],
      },
    }),
  ],
})
export class AppModule {}
```

### Required Permissions

When using with `@sottosviluppo/auth-backend`, the following permissions are used by the endpoints:

| Endpoint | Required Permission | Description |
|----------|-------------------|-------------|
| `POST /v1/files/upload` | `files:create` | Upload single file |
| `POST /v1/files/upload/multiple` | `files:create` | Upload multiple files |
| `GET /v1/files` | `files:list` | List files |
| `GET /v1/files/:id` | `files:read` | Get file details |
| `GET /v1/files/:id/download` | `files:read` | Download file |
| `GET /v1/files/entity/:type/:id` | `files:list` | Get files by entity |
| `PATCH /v1/files/:id` | `files:update` | Update file metadata |
| `PATCH /v1/files/batch/update` | `files:update` | Batch update |
| `DELETE /v1/files/:id` | `files:delete` | Soft delete file |
| `DELETE /v1/files/:id/permanent` | `files:manage` | Permanent delete |
| `DELETE /v1/files/batch/delete` | `files:delete` | Batch soft delete |
| `POST /v1/files/:id/restore` | `files:update` | Restore deleted file |
| `GET /v1/files/admin/*` | `files:manage` | Admin endpoints |
| `POST /v1/files/admin/cleanup/run` | `files:manage` | Trigger cleanup |

**Note**: You must add `{ name: 'files', description: 'File management' }` to the `resources` array in `FilcronetAuthModule.forRoot()` configuration. This will automatically create all the required permissions (`files:create`, `files:read`, `files:update`, `files:delete`, `files:list`, `files:manage`).

### Async Configuration (with ConfigService)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';

@Module({
  imports: [
    ConfigModule.forRoot(),

    FilcronetFileManagerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: {
          basePath: config.get('UPLOAD_PATH', './uploads'),
          publicUrlPath: config.get('PUBLIC_URL_PATH', '/uploads/public'),
        },
        validation: {
          maxFileSize: parseInt(config.get('MAX_FILE_SIZE', '10485760')),
          allowedMimeTypes: config.get('ALLOWED_TYPES', 'image/*,application/pdf').split(','),
          validateMagicBytes: config.get('VALIDATE_MAGIC_BYTES', 'true') === 'true',
        },
        cleanup: {
          enabled: config.get('CLEANUP_ENABLED', 'false') === 'true',
          retentionDays: parseInt(config.get('RETENTION_DAYS', '30')),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

## Storage Structure

Files are organized in date-based directories (YYYY/MM) to avoid filesystem limitations on files per directory:

```
uploads/
├── public/
│   ├── 2024/
│   │   ├── 11/
│   │   │   ├── a1b2c3d4-uuid.jpg
│   │   │   └── e5f6g7h8-uuid.pdf
│   │   └── 12/
│   │       └── i9j0k1l2-uuid.png
│   └── 2025/
│       └── 01/
│           └── m3n4o5p6-uuid.jpg
└── private/
    └── 2024/
        └── 12/
            └── q7r8s9t0-uuid.pdf
```

- **Physical path**: Determined automatically by upload date (`YYYY/MM/uuid.ext`)
- **Virtual path**: User-defined logical organization (`/invoices/2024/`, `/avatars/`)
- **storageName**: Contains the full relative path (e.g., `2024/12/uuid.pdf`)

## Configuration Options

### Storage Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `basePath` | `string` | Yes | - | Base directory for file storage |
| `publicUrlPath` | `string` | Yes | - | URL path prefix for public files |
| `publicDir` | `string` | No | `'public'` | Subdirectory for public files |
| `privateDir` | `string` | No | `'private'` | Subdirectory for private files |

### Validation Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `maxFileSize` | `number` | No | `10485760` (10MB) | Maximum file size in bytes |
| `allowedMimeTypes` | `string[]` | Yes | - | Allowed MIME types (supports wildcards like `image/*`) |
| `mimeTypeRules` | `Record<string, { maxSize: number }>` | No | - | Per-MIME-type size limits |
| `validateMagicBytes` | `boolean` | No | `true` | Validate file content matches MIME type |

### Cleanup Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `enabled` | `boolean` | No | `false` | Enable automatic cleanup of soft-deleted files |
| `retentionDays` | `number` | No | `30` | Days to retain soft-deleted files |
| `cronExpression` | `string` | No | `'0 3 * * *'` | Cron schedule for cleanup job |

### Defaults Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `isPublic` | `boolean` | No | `false` | Default visibility for uploaded files |

### Guards Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `guards` | `Type<CanActivate>[]` | No | `[]` | Guards to protect all endpoints |

## API Reference

### File Endpoints

All endpoints are prefixed with `/v1/files`.

#### Upload Single File

```http
POST /v1/files/upload
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `File` | Yes | The file to upload |
| `path` | `string` | No | Virtual path (must start and end with `/`) |
| `isPublic` | `boolean` | No | File visibility |
| `entityType` | `string` | No | Associated entity type |
| `entityId` | `string` | No | Associated entity ID |
| `tags` | `string[]` | No | Tags for categorization |
| `category` | `string` | No | Category for grouping |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "path": "/documents/",
    "isPublic": false,
    "downloadUrl": "/v1/files/550e8400-e29b-41d4-a716-446655440000/download",
    "createdAt": "2024-12-15T10:30:00Z"
  },
  "message": "File uploaded successfully"
}
```

#### Upload Multiple Files

```http
POST /v1/files/upload/multiple
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | `File[]` | Yes | Files to upload (max 10) |
| `path` | `string` | No | Virtual path for all files |
| `isPublic` | `boolean` | No | Visibility for all files |
| `entityType` | `string` | No | Associated entity type |
| `entityId` | `string` | No | Associated entity ID |
| `tags` | `string[]` | No | Tags for all files |
| `category` | `string` | No | Category for all files |

#### List Files

```http
GET /v1/files
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 100) |
| `sortBy` | `string` | `createdAt` | Sort field |
| `sortOrder` | `ASC\|DESC` | `DESC` | Sort order |
| `path` | `string` | - | Filter by path prefix |
| `isPublic` | `boolean` | - | Filter by visibility |
| `entityType` | `string` | - | Filter by entity type |
| `entityId` | `string` | - | Filter by entity ID |
| `mimeType` | `string` | - | Filter by MIME type (supports wildcards) |
| `category` | `string` | - | Filter by category |
| `tags` | `string[]` | - | Filter by tags (must have ALL) |
| `uploadedById` | `string` | - | Filter by uploader |
| `search` | `string` | - | Search in filename |
| `includeDeleted` | `boolean` | `false` | Include soft-deleted files |

#### Get File by ID

```http
GET /v1/files/:id
```

#### Get Files by Entity

```http
GET /v1/files/entity/:entityType/:entityId
```

#### Download File

```http
GET /v1/files/:id/download
```

Returns the file as a stream with appropriate `Content-Type` and `Content-Disposition` headers.

#### Update File Metadata

```http
PATCH /v1/files/:id
Content-Type: application/json
```

```json
{
  "path": "/documents/archive/",
  "isPublic": true,
  "tags": ["archived", "2024"],
  "category": "archive"
}
```

#### Batch Update Files

```http
PATCH /v1/files/batch/update
Content-Type: application/json
```

```json
{
  "fileIds": ["uuid-1", "uuid-2"],
  "path": "/archive/",
  "category": "archived",
  "addTags": ["processed"],
  "removeTags": ["pending"]
}
```

#### Soft Delete File

```http
DELETE /v1/files/:id
```

#### Permanently Delete File

```http
DELETE /v1/files/:id/permanent
```

#### Restore Soft-Deleted File

```http
POST /v1/files/:id/restore
```

#### Batch Soft Delete

```http
DELETE /v1/files/batch/delete
Content-Type: application/json
```

```json
{
  "fileIds": ["uuid-1", "uuid-2"]
}
```

### Admin Endpoints

All admin endpoints are prefixed with `/v1/files/admin`.

#### Get Storage Statistics

```http
GET /v1/files/admin/stats/storage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicCount": 150,
    "privateCount": 320,
    "publicSize": 157286400,
    "privateSize": 524288000,
    "totalCount": 470,
    "totalSize": 681574400,
    "publicSizeFormatted": "150 MB",
    "privateSizeFormatted": "500 MB",
    "totalSizeFormatted": "650 MB"
  }
}
```

#### Get Cleanup Statistics

```http
GET /v1/files/admin/stats/cleanup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "retentionDays": 30,
    "pendingDeletion": 15
  }
}
```

#### Trigger Manual Cleanup

```http
POST /v1/files/admin/cleanup/run
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 15,
    "errors": 0
  },
  "message": "Cleanup completed: 15 files deleted, 0 errors"
}
```

#### Health Check

```http
GET /v1/files/admin/health
```

## Services

The package exports several services that can be injected into your own services:

### FileService

Main service for file operations.

```typescript
import { Injectable } from '@nestjs/common';
import { FileService } from '@sottosviluppo/file-manager-backend';

@Injectable()
export class MyService {
  constructor(private readonly fileService: FileService) {}

  async attachFileToOrder(fileId: string, orderId: string) {
    return this.fileService.update(fileId, {
      entityType: 'order',
      entityId: orderId,
    });
  }

  async getOrderFiles(orderId: string) {
    return this.fileService.findByEntity('order', orderId);
  }
}
```

### StorageService

Low-level storage operations.

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '@sottosviluppo/file-manager-backend';

@Injectable()
export class MyService {
  constructor(private readonly storageService: StorageService) {}

  async getStorageInfo() {
    return this.storageService.getStorageStats();
  }
}
```

### CleanupService

Manual cleanup operations.

```typescript
import { Injectable } from '@nestjs/common';
import { CleanupService } from '@sottosviluppo/file-manager-backend';

@Injectable()
export class MyService {
  constructor(private readonly cleanupService: CleanupService) {}

  async performCleanup() {
    return this.cleanupService.triggerCleanup();
  }
}
```

## Magic Bytes Validation

The package validates file content against claimed MIME types using magic bytes signatures. This prevents users from uploading malicious files disguised as allowed types.

### Supported MIME Types

- **Images**: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, ICO, AVIF, HEIC
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF, ODT, ODS, ODP, EPUB
- **Archives**: ZIP, RAR, 7Z, GZIP, TAR, BZIP2, XZ
- **Video**: MP4, WebM, AVI, QuickTime, Matroska, MPEG, 3GPP, WMV, FLV
- **Audio**: MP3, WAV, OGG, FLAC, AAC, M4A, WMA, MIDI
- **Fonts**: WOFF, WOFF2, TTF, OTF
- **Data**: JSON, XML, HTML, WASM

### Utility Functions

```typescript
import {
  validateMagicBytes,
  detectMimeType,
  canValidateMimeType,
  getSupportedMimeTypes,
} from '@sottosviluppo/file-manager-backend';

// Validate file content
const result = validateMagicBytes(fileBuffer, 'image/jpeg');
if (!result.valid) {
  console.error(result.message);
}

// Detect MIME type from buffer
const mimeType = detectMimeType(fileBuffer);

// Check if validation is available
const canValidate = canValidateMimeType('image/jpeg'); // true

// Get all supported types
const supported = getSupportedMimeTypes();
```

## Database Schema

The package creates a `files` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID` | Primary key |
| `originalName` | `VARCHAR(255)` | Original filename |
| `storageName` | `VARCHAR(500)` | Relative storage path (e.g., `2024/12/uuid.pdf`) |
| `mimeType` | `VARCHAR(127)` | File MIME type |
| `size` | `BIGINT` | File size in bytes |
| `path` | `VARCHAR(1000)` | Virtual path for organization |
| `isPublic` | `BOOLEAN` | Visibility flag |
| `entityType` | `VARCHAR(100)` | Associated entity type |
| `entityId` | `VARCHAR(100)` | Associated entity ID |
| `metadata` | `JSON` | Extracted metadata |
| `tags` | `JSON` | Array of tags |
| `category` | `VARCHAR(100)` | Category |
| `uploadedById` | `UUID` | Uploader user ID |
| `createdAt` | `TIMESTAMP` | Creation timestamp |
| `updatedAt` | `TIMESTAMP` | Last update timestamp |
| `deletedAt` | `TIMESTAMP` | Soft delete timestamp |

### Indexes

- `(entityType, entityId)` - For entity lookups
- `(uploadedById)` - For user file queries
- `(isPublic)` - For visibility filtering
- `(category)` - For category filtering
- `(path)` - For path filtering
- `(storageName)` - Unique index
- `(mimeType)` - For type filtering

## Troubleshooting

### Files table not created

Ensure `autoLoadEntities: true` is set in your TypeORM configuration:

```typescript
TypeOrmModule.forRoot({
  autoLoadEntities: true,
  // ...
})
```

### Endpoints return 401 Unauthorized

1. Ensure you're passing a valid JWT token in the `Authorization` header
2. Ensure the user has the required permissions (e.g., `files:create` for upload)
3. If using with auth-backend, ensure you've added the `files` resource:

```typescript
FilcronetAuthModule.forRoot({
  // ...
  resources: [
    { name: 'files', description: 'File management' }, // Required!
  ],
})
```

### Guards not working

1. Ensure guards are exported from their module:
```typescript
// auth.module.ts
exports: [JwtAuthGuard, PermissionsGuard]
```

2. Ensure auth module is imported before file-manager module:
```typescript
imports: [
  FilcronetAuthModule.forRoot({ ... }), // First
  FilcronetFileManagerModule.forRoot({ ... }), // Second
]
```

### Upload fails with "File type not allowed"

1. Check your `allowedMimeTypes` configuration
2. Enable magic bytes validation to see actual detected type
3. Use wildcards for categories: `image/*` instead of listing each type

### Public files return 404

Ensure you've configured static file serving with the correct path structure:

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'uploads', 'public'),
  serveRoot: '/uploads/public',
})
```

**Note**: Public files are now stored in date-based subdirectories (e.g., `/uploads/public/2024/12/uuid.jpg`). The static file server will handle this automatically.

### Cleanup not running

1. Ensure `cleanup.enabled: true` in configuration
2. Check that `@nestjs/schedule` is installed
3. Verify logs for cleanup service initialization

### TypeScript errors with DTOs

Ensure you have these packages installed:
```bash
pnpm add class-validator class-transformer
```

## Environment Variables Example

```env
# Storage
UPLOAD_PATH=./uploads
PUBLIC_URL_PATH=/uploads/public

# Validation
MAX_FILE_SIZE=10485760
ALLOWED_TYPES=image/*,application/pdf,text/plain
VALIDATE_MAGIC_BYTES=true

# Cleanup
CLEANUP_ENABLED=true
RETENTION_DAYS=30
```

## Requirements

- Node.js >= 20
- NestJS >= 10
- TypeORM >= 0.3
- PostgreSQL / MySQL / SQLite

## License

UNLICENSED - Private package for Filcronet projects.