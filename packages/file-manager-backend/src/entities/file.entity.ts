/**
 * @fileoverview File entity for TypeORM persistence
 * @packageDocumentation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";

/**
 * File metadata extracted from file content
 *
 * @export
 * @interface IFileMetadata
 */
export interface IFileMetadata {
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** File format */
  format?: string;
  /** ISO timestamp when metadata was extracted */
  extractedAt?: string;
  /** Custom description */
  description?: string;
  /** Allow any additional custom fields */
  [key: string]: unknown;
}

/**
 * File entity representing uploaded files in the system
 *
 * Files are stored in date-based directories (YYYY/MM) to avoid
 * filesystem limitations. The storageName contains the full relative
 * path including the date folders.
 *
 * Supports PostgreSQL, MySQL, and MSSQL databases.
 *
 * @export
 * @class FileEntity
 *
 * @example
 * ```typescript
 * const file = new FileEntity();
 * file.originalName = 'document.pdf';
 * file.storageName = '2024/12/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf';
 * file.mimeType = 'application/pdf';
 * file.size = 1024000;
 * file.isPublic = false;
 * file.path = '/invoices/'; // Virtual path for organization
 * ```
 */
@Entity("files")
@Index(["entityType", "entityId"])
@Index(["uploadedById"])
@Index(["isPublic"])
@Index(["category"])
@Index(["path"])
export class FileEntity {
  /**
   * Unique identifier (UUID)
   *
   * @type {string}
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Original filename as uploaded by the user
   *
   * @type {string}
   * @example 'my-document.pdf'
   */
  @Column({ length: 255 })
  originalName: string;

  /**
   * Relative path to the file in storage, including date-based directories
   * Format: YYYY/MM/uuid.extension
   *
   * @type {string}
   * @example '2024/12/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf'
   */
  @Column({ length: 500, unique: true })
  @Index()
  storageName: string;

  /**
   * MIME type of the file
   *
   * @type {string}
   * @example 'application/pdf', 'image/jpeg'
   */
  @Column({ length: 127 })
  @Index()
  mimeType: string;

  /**
   * File size in bytes
   *
   * @type {number}
   */
  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) =>
        typeof value === "string" ? parseInt(value, 10) : value,
    },
  })
  size: number;

  /**
   * Virtual path for logical organization
   * Does not affect physical storage location
   * Must start and end with /
   *
   * @type {string}
   * @example '/documents/invoices/2024/'
   */
  @Column({ length: 1000, default: "/" })
  path: string;

  /**
   * Whether the file is publicly accessible without authentication
   *
   * @type {boolean}
   */
  @Column({ default: false })
  isPublic: boolean;

  /**
   * Type of the associated entity (polymorphic relation)
   *
   * @type {(string | null)}
   * @example 'user', 'order', 'product'
   */
  @Column({ length: 100, nullable: true })
  entityType: string | null;

  /**
   * ID of the associated entity (polymorphic relation)
   *
   * @type {(string | null)}
   * @example '123', 'abc-def-ghi'
   */
  @Column({ length: 100, nullable: true })
  entityId: string | null;

  /**
   * Extracted file metadata (dimensions, format, etc.)
   * Stored as JSON in the database
   *
   * @type {(IFileMetadata | null)}
   */
  @Column({ type: "simple-json", nullable: true })
  metadata: IFileMetadata | null;

  /**
   * Array of tags for categorization
   *
   * @type {(string[] | null)}
   */
  @Column({ type: "simple-json", nullable: true })
  tags: string[] | null;

  /**
   * Category for logical grouping
   *
   * @type {(string | null)}
   * @example 'invoices', 'avatars', 'documents'
   */
  @Column({ length: 100, nullable: true })
  category: string | null;

  /**
   * ID of the user who uploaded the file
   *
   * @type {string}
   */
  @Column({ type: "uuid" })
  uploadedById: string;

  /**
   * Timestamp when the file was uploaded
   *
   * @type {Date}
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the file was last updated
   *
   * @type {Date}
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Timestamp when the file was soft-deleted
   * Null if the file is not deleted
   *
   * @type {(Date | null)}
   */
  @DeleteDateColumn()
  deletedAt: Date | null;

  /**
   * Creates a response object with download URL
   * Use this for API responses
   *
   * @param {string} downloadUrl - The URL to download/access the file
   * @returns {object} File data with download URL
   *
   * @example
   * ```typescript
   * const response = file.toResponseObject('/api/v1/files/123/download');
   * ```
   */
  toResponseObject(downloadUrl: string) {
    return {
      id: this.id,
      originalName: this.originalName,
      mimeType: this.mimeType,
      size: this.size,
      path: this.path,
      isPublic: this.isPublic,
      entityType: this.entityType,
      entityId: this.entityId,
      metadata: this.metadata,
      tags: this.tags,
      category: this.category,
      uploadedById: this.uploadedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      downloadUrl,
    };
  }
}
