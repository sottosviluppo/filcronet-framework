import { Injectable, Inject, OnModuleInit, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { createReadStream, createWriteStream, ReadStream } from "fs";
import { mkdir, unlink, access, stat, readdir } from "fs/promises";
import { join, dirname, extname } from "path";
import { pipeline } from "stream/promises";
import type { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import {
  FILE_MANAGER_DEFAULTS,
  FILE_MANAGER_OPTIONS,
} from "../constants/file-manager.constants";

/**
 * Represents an uploaded file from multer
 *
 * @export
 * @interface IUploadedFile
 */
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Result of a file storage operation
 *
 * @export
 * @interface IStorageResult
 */
export interface IStorageResult {
  storageName: string;
  storagePath: string;
  size: number;
}

/**
 * Service responsible for filesystem operations
 * Handles file storage, retrieval, and deletion
 *
 * @export
 * @class StorageService
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;
  private readonly publicDir: string;
  private readonly privateDir: string;
  private readonly publicUrlPath: string;

  constructor(
    @Inject(FILE_MANAGER_OPTIONS)
    private readonly options: IFileManagerModuleOptions
  ) {
    this.basePath = options.storage.basePath;
    this.publicDir =
      options.storage.publicDir ?? FILE_MANAGER_DEFAULTS.PUBLIC_DIR;
    this.privateDir =
      options.storage.privateDir ?? FILE_MANAGER_DEFAULTS.PRIVATE_DIR;
    this.publicUrlPath = options.storage.publicUrlPath;
  }

  /**
   * Initializes storage directories on module startup
   *
   * @returns {Promise<void>}
   * @memberof StorageService
   */
  async onModuleInit(): Promise<void> {
    await this.ensureDirectoryExists(this.getPublicPath());
    await this.ensureDirectoryExists(this.getPrivatePath());
    this.logger.log(`Storage initialized at ${this.basePath}`);
  }

  /**
   * Gets the full path to the public storage directory
   *
   * @returns {string} Absolute path to public directory
   * @memberof StorageService
   */
  getPublicPath(): string {
    return join(this.basePath, this.publicDir);
  }

  /**
   * Gets the full path to the private storage directory
   *
   * @returns {string} Absolute path to private directory
   * @memberof StorageService
   */
  getPrivatePath(): string {
    return join(this.basePath, this.privateDir);
  }

  /**
   * Generates a unique storage name for a file
   *
   * @param {string} originalName - Original filename with extension
   * @returns {string} UUID-based unique filename
   * @memberof StorageService
   *
   * @example
   * ```typescript
   * generateStorageName('document.pdf')
   * // 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf'
   * ```
   */
  generateStorageName(originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    const uuid = randomUUID();
    return ext ? `${uuid}${ext}` : uuid;
  }

  /**
   * Stores a file to the appropriate directory based on visibility
   *
   * @param {IUploadedFile} file - Uploaded file from multer
   * @param {boolean} isPublic - Whether the file should be stored in public directory
   * @returns {Promise<IStorageResult>} Storage result with generated filename and path
   * @throws {Error} If file cannot be written
   * @memberof StorageService
   */
  async storeFile(
    file: IUploadedFile,
    isPublic: boolean
  ): Promise<IStorageResult> {
    const storageName = this.generateStorageName(file.originalname);
    const targetDir = isPublic ? this.getPublicPath() : this.getPrivatePath();
    const storagePath = join(targetDir, storageName);

    await this.writeFile(storagePath, file.buffer);

    return {
      storageName,
      storagePath,
      size: file.size,
    };
  }

  /**
   * Moves a file between public and private directories
   *
   * @param {string} storageName - Current storage name of the file
   * @param {boolean} fromPublic - Current location (true = public)
   * @param {boolean} toPublic - Target location (true = public)
   * @returns {Promise<string>} New storage path
   * @memberof StorageService
   */
  async moveFile(
    storageName: string,
    fromPublic: boolean,
    toPublic: boolean
  ): Promise<string> {
    if (fromPublic === toPublic) {
      const dir = toPublic ? this.getPublicPath() : this.getPrivatePath();
      return join(dir, storageName);
    }

    const sourceDir = fromPublic ? this.getPublicPath() : this.getPrivatePath();
    const targetDir = toPublic ? this.getPublicPath() : this.getPrivatePath();
    const sourcePath = join(sourceDir, storageName);
    const targetPath = join(targetDir, storageName);

    const readStream = createReadStream(sourcePath);
    const writeStream = createWriteStream(targetPath);
    await pipeline(readStream, writeStream);

    await this.deletePhysicalFile(sourcePath);

    return targetPath;
  }

  /**
   * Gets a readable stream for a file
   *
   * @param {string} storageName - Storage name of the file
   * @param {boolean} isPublic - Whether the file is in public directory
   * @returns {ReadStream} Readable stream of the file
   * @memberof StorageService
   */
  getFileStream(storageName: string, isPublic: boolean): ReadStream {
    const filePath = this.getFilePath(storageName, isPublic);
    return createReadStream(filePath);
  }

  /**
   * Gets the full filesystem path for a file
   *
   * @param {string} storageName - Storage name of the file
   * @param {boolean} isPublic - Whether the file is in public directory
   * @returns {string} Full filesystem path
   * @memberof StorageService
   */
  getFilePath(storageName: string, isPublic: boolean): string {
    const dir = isPublic ? this.getPublicPath() : this.getPrivatePath();
    return join(dir, storageName);
  }

  /**
   * Gets the public URL for a publicly accessible file
   *
   * @param {string} storageName - Storage name of the file
   * @returns {string} Public URL path
   * @memberof StorageService
   */
  getPublicUrl(storageName: string): string {
    return `${this.publicUrlPath}/${storageName}`;
  }

  /**
   * Deletes a file from the filesystem
   *
   * @param {string} storageName - Storage name of the file
   * @param {boolean} isPublic - Whether the file is in public directory
   * @returns {Promise<void>}
   * @memberof StorageService
   */
  async deleteFile(storageName: string, isPublic: boolean): Promise<void> {
    const filePath = this.getFilePath(storageName, isPublic);
    await this.deletePhysicalFile(filePath);
  }

  /**
   * Checks if a file exists
   *
   * @param {string} storageName - Storage name of the file
   * @param {boolean} isPublic - Whether to check in public directory
   * @returns {Promise<boolean>} True if file exists
   * @memberof StorageService
   */
  async fileExists(storageName: string, isPublic: boolean): Promise<boolean> {
    const filePath = this.getFilePath(storageName, isPublic);
    return this.pathExists(filePath);
  }

  /**
   * Gets file statistics
   *
   * @param {string} storageName - Storage name of the file
   * @param {boolean} isPublic - Whether the file is in public directory
   * @returns {Promise<import('fs').Stats>} File statistics
   * @memberof StorageService
   */
  async getFileStats(storageName: string, isPublic: boolean) {
    const filePath = this.getFilePath(storageName, isPublic);
    return stat(filePath);
  }

  /**
   * Lists all files in a directory
   *
   * @param {boolean} isPublic - Whether to list public directory
   * @returns {Promise<string[]>} Array of filenames
   * @memberof StorageService
   */
  async listFiles(isPublic: boolean): Promise<string[]> {
    const dir = isPublic ? this.getPublicPath() : this.getPrivatePath();
    try {
      return await readdir(dir);
    } catch {
      return [];
    }
  }

  /**
   * Gets storage statistics
   *
   * @returns {Promise<object>} Storage stats
   * @memberof StorageService
   */
  async getStorageStats(): Promise<{
    publicCount: number;
    privateCount: number;
    publicSize: number;
    privateSize: number;
  }> {
    const [publicFiles, privateFiles] = await Promise.all([
      this.listFiles(true),
      this.listFiles(false),
    ]);

    let publicSize = 0;
    let privateSize = 0;

    for (const file of publicFiles) {
      try {
        const stats = await this.getFileStats(file, true);
        publicSize += stats.size;
      } catch {
        // Ignore errors for individual files
      }
    }

    for (const file of privateFiles) {
      try {
        const stats = await this.getFileStats(file, false);
        privateSize += stats.size;
      } catch {
        // Ignore errors for individual files
      }
    }

    return {
      publicCount: publicFiles.length,
      privateCount: privateFiles.length,
      publicSize,
      privateSize,
    };
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  /**
   * Writes buffer content to a file
   */
  private async writeFile(filePath: string, content: Buffer): Promise<void> {
    await this.ensureDirectoryExists(dirname(filePath));
    const writeStream = createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      writeStream.write(content, (error) => {
        if (error) {
          reject(error);
        } else {
          writeStream.end(resolve);
        }
      });
    });
  }

  /**
   * Deletes a file from the filesystem
   */
  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, that's fine
    }
  }

  /**
   * Checks if a path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
