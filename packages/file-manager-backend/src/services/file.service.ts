import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import type { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import { FileEntity } from "../entities/file.entity";
import { StorageService, IUploadedFile } from "./storage.service";
import { MetadataService } from "./metadata.service";
import type { UploadFileDto } from "../dto/upload-file.dto";
import type { UpdateFileDto } from "../dto/update-file.dto";
import type { FileQueryDto } from "../dto/file-query.dto";
import type { BatchUpdateFilesDto } from "../dto/batch-update-files.dto";
import {
  FILE_MANAGER_DEFAULTS,
  FILE_MANAGER_OPTIONS,
  formatBytes,
} from "../constants/file-manager.constants";
import { validateMagicBytes } from "../utils/magic-bytes.util";

/**
 * Result of a file upload operation
 *
 * @export
 * @interface IUploadResult
 */
export interface IUploadResult {
  file: FileEntity;
  downloadUrl: string;
}

/**
 * Main service for file management operations
 *
 * @export
 * @class FileService
 */
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly mimeTypeRules: Record<string, { maxSize: number }>;
  private readonly validateMagicBytes: boolean;
  private readonly defaultIsPublic: boolean;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @Inject(FILE_MANAGER_OPTIONS)
    private readonly options: IFileManagerModuleOptions,
    private readonly storageService: StorageService,
    private readonly metadataService: MetadataService
  ) {
    this.maxFileSize =
      options.validation.maxFileSize ?? FILE_MANAGER_DEFAULTS.MAX_FILE_SIZE;
    this.allowedMimeTypes = options.validation.allowedMimeTypes;
    this.mimeTypeRules = options.validation.mimeTypeRules ?? {};
    this.validateMagicBytes =
      options.validation.validateMagicBytes ??
      FILE_MANAGER_DEFAULTS.VALIDATE_MAGIC_BYTES;
    this.defaultIsPublic =
      options.defaults?.isPublic ?? FILE_MANAGER_DEFAULTS.IS_PUBLIC;
  }

  /**
   * Uploads a single file
   *
   * @param {IUploadedFile} file - Uploaded file from multer
   * @param {UploadFileDto} dto - Upload metadata
   * @returns {Promise<IUploadResult>} Upload result
   * @throws {BadRequestException} If file validation fails
   * @memberof FileService
   */
  async uploadFile(
    file: IUploadedFile,
    dto: UploadFileDto
  ): Promise<IUploadResult> {
    // Validate file
    this.validateFile(file);

    const isPublic = dto.isPublic ?? this.defaultIsPublic;

    // Store file
    const storageResult = await this.storageService.storeFile(file, isPublic);

    // Extract metadata
    const metadata = await this.metadataService.extractMetadata(
      file.buffer,
      file.mimetype
    );

    // Create database record
    const fileEntity = this.fileRepository.create({
      originalName: file.originalname,
      storageName: storageResult.storageName,
      mimeType: file.mimetype,
      size: file.size,
      path: dto.path ?? "/",
      isPublic,
      entityType: dto.entityType ?? null,
      entityId: dto.entityId ?? null,
      metadata,
      tags: dto.tags ?? null,
      category: dto.category ?? null,
      uploadedById: dto.uploadedById,
    });

    const savedFile = await this.fileRepository.save(fileEntity);

    return {
      file: savedFile,
      downloadUrl: this.getDownloadUrl(savedFile),
    };
  }

  /**
   * Uploads multiple files
   *
   * @param {IUploadedFile[]} files - Array of uploaded files
   * @param {UploadFileDto} dto - Common upload metadata
   * @param {string} userId - ID of the uploading user
   * @returns {Promise<IUploadResult[]>} Array of upload results
   * @memberof FileService
   */
  async uploadFiles(
    files: IUploadedFile[],
    dto: UploadFileDto
  ): Promise<IUploadResult[]> {
    const results: IUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, dto);
      results.push(result);
    }

    return results;
  }

  /**
   * Gets a file by ID
   *
   * @param {string} id - File ID
   * @param {boolean} [includeDeleted=false] - Include soft-deleted files
   * @returns {Promise<FileEntity>} File entity
   * @throws {NotFoundException} If file not found
   * @memberof FileService
   */
  async findById(id: string, includeDeleted = false): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  /**
   * Queries files with filtering and pagination
   *
   * @param {FileQueryDto} query - Query parameters
   * @returns {Promise<{ data: FileEntity[]; total: number }>} Query results
   * @memberof FileService
   */
  async findAll(query: FileQueryDto): Promise<{
    data: FileEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.fileRepository.createQueryBuilder("file");

    // Soft delete filter
    if (!query.includeDeleted) {
      qb.andWhere("file.deletedAt IS NULL");
    }

    // Apply filters
    if (query.path) {
      qb.andWhere("file.path LIKE :path", { path: `${query.path}%` });
    }

    if (query.isPublic !== undefined) {
      qb.andWhere("file.isPublic = :isPublic", { isPublic: query.isPublic });
    }

    if (query.entityType) {
      qb.andWhere("file.entityType = :entityType", {
        entityType: query.entityType,
      });
    }

    if (query.entityId) {
      qb.andWhere("file.entityId = :entityId", { entityId: query.entityId });
    }

    if (query.mimeType) {
      if (query.mimeType.endsWith("/*")) {
        const category = query.mimeType.slice(0, -2);
        qb.andWhere("file.mimeType LIKE :mimeType", {
          mimeType: `${category}/%`,
        });
      } else {
        qb.andWhere("file.mimeType = :mimeType", { mimeType: query.mimeType });
      }
    }

    if (query.category) {
      qb.andWhere("file.category = :category", { category: query.category });
    }

    if (query.uploadedById) {
      qb.andWhere("file.uploadedById = :uploadedById", {
        uploadedById: query.uploadedById,
      });
    }

    if (query.search) {
      qb.andWhere("LOWER(file.originalName) LIKE LOWER(:search)", {
        search: `%${query.search}%`,
      });
    }

    if (query.tags && query.tags.length > 0) {
      // Files must have ALL specified tags
      for (let i = 0; i < query.tags.length; i++) {
        qb.andWhere(`file.tags LIKE :tag${i}`, {
          [`tag${i}`]: `%${query.tags[i]}%`,
        });
      }
    }

    // Get total count
    const total = await qb.getCount();

    // Apply sorting and pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    qb.orderBy(
      `file.${query.sortBy ?? "createdAt"}`,
      query.sortOrder ?? "DESC"
    );
    qb.skip(offset).take(limit);

    const data = await qb.getMany();
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  /**
   * Updates file metadata
   *
   * @param {string} id - File ID
   * @param {UpdateFileDto} dto - Update data
   * @returns {Promise<FileEntity>} Updated file
   * @memberof FileService
   */
  async update(id: string, dto: UpdateFileDto): Promise<FileEntity> {
    const file = await this.findById(id);

    // Handle visibility change (move file)
    if (dto.isPublic !== undefined && dto.isPublic !== file.isPublic) {
      await this.storageService.moveFile(
        file.storageName,
        file.isPublic,
        dto.isPublic
      );
      file.isPublic = dto.isPublic;
    }

    // Update fields
    if (dto.path !== undefined) file.path = dto.path;
    if (dto.entityType !== undefined) file.entityType = dto.entityType;
    if (dto.entityId !== undefined) file.entityId = dto.entityId;
    if (dto.tags !== undefined) file.tags = dto.tags;
    if (dto.category !== undefined) file.category = dto.category;

    // Merge metadata instead of replacing
    if (dto.metadata !== undefined) {
      if (dto.metadata === null) {
        // Explicit null = remove all metadata
        file.metadata = null;
      } else {
        // Merge new metadata with existing
        file.metadata = {
          ...file.metadata,
          ...dto.metadata,
        };
      }
    }

    return this.fileRepository.save(file);
  }

  /**
   * Soft deletes a file
   *
   * @param {string} id - File ID
   * @returns {Promise<void>}
   * @memberof FileService
   */
  async softDelete(id: string): Promise<void> {
    const file = await this.findById(id);
    await this.fileRepository.softDelete(file.id);
  }

  /**
   * Permanently deletes a file and its physical storage
   *
   * @param {string} id - File ID
   * @returns {Promise<void>}
   * @memberof FileService
   */
  async hardDelete(id: string): Promise<void> {
    const file = await this.findById(id, true);
    await this.storageService.deleteFile(file.storageName, file.isPublic);
    await this.fileRepository.delete(id);
  }

  /**
   * Restores a soft-deleted file
   *
   * @param {string} id - File ID
   * @returns {Promise<FileEntity>} Restored file
   * @memberof FileService
   */
  async restore(id: string): Promise<FileEntity> {
    const file = await this.findById(id, true);

    if (!file.deletedAt) {
      throw new BadRequestException("File is not deleted");
    }

    await this.fileRepository.restore(id);
    return this.findById(id);
  }

  /**
   * Gets files associated with an entity
   *
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<FileEntity[]>} Associated files
   * @memberof FileService
   */
  async findByEntity(
    entityType: string,
    entityId: string
  ): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Batch updates files
   *
   * @param {BatchUpdateFilesDto} dto - Batch update data
   * @returns {Promise<FileEntity[]>} Updated files
   * @memberof FileService
   */
  async batchUpdate(dto: BatchUpdateFilesDto): Promise<FileEntity[]> {
    const files = await this.fileRepository.find({
      where: { id: In(dto.fileIds) },
    });

    const updatedFiles: FileEntity[] = [];

    for (const file of files) {
      if (dto.path) file.path = dto.path;
      if (dto.category) file.category = dto.category;

      // Handle visibility change
      if (dto.isPublic !== undefined && dto.isPublic !== file.isPublic) {
        await this.storageService.moveFile(
          file.storageName,
          file.isPublic,
          dto.isPublic
        );
        file.isPublic = dto.isPublic;
      }

      // Handle tags
      if (dto.addTags) {
        const currentTags = file.tags ?? [];
        file.tags = [...new Set([...currentTags, ...dto.addTags])];
      }
      if (dto.removeTags) {
        file.tags = (file.tags ?? []).filter(
          (t) => !dto.removeTags!.includes(t)
        );
        if (file.tags.length === 0) file.tags = null;
      }

      updatedFiles.push(await this.fileRepository.save(file));
    }

    return updatedFiles;
  }

  /**
   * Batch deletes files (soft delete)
   *
   * @param {string[]} fileIds - File IDs to delete
   * @returns {Promise<number>} Number of deleted files
   * @memberof FileService
   */
  async batchSoftDelete(fileIds: string[]): Promise<number> {
    const result = await this.fileRepository.softDelete({ id: In(fileIds) });
    return result.affected ?? 0;
  }

  /**
   * Gets the download URL for a file
   *
   * @param {FileEntity} file - File entity
   * @returns {string} Download URL
   * @memberof FileService
   */
  getDownloadUrl(file: FileEntity): string {
    if (file.isPublic) {
      return this.storageService.getPublicUrl(file.storageName);
    }
    return `/v1/files/${file.id}/download`;
  }

  /**
   * Validates an uploaded file
   */
  private validateFile(file: IUploadedFile): void {
    // Check MIME type allowlist
    if (!this.isMimeTypeAllowed(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed`
      );
    }

    // Get max size for this MIME type
    const maxSize = this.getMaxSizeForMimeType(file.mimetype);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size (${formatBytes(
          file.size
        )}) exceeds maximum allowed size (${formatBytes(maxSize)})`
      );
    }

    // Validate magic bytes
    if (this.validateMagicBytes) {
      const validation = validateMagicBytes(file.buffer, file.mimetype);
      if (!validation.valid) {
        throw new BadRequestException(validation.message);
      }
    }
  }

  /**
   * Checks if a MIME type is allowed
   */
  private isMimeTypeAllowed(mimeType: string): boolean {
    for (const allowed of this.allowedMimeTypes) {
      if (allowed === mimeType) return true;
      if (allowed.endsWith("/*")) {
        const category = allowed.slice(0, -2);
        if (mimeType.startsWith(`${category}/`)) return true;
      }
    }
    return false;
  }

  /**
   * Gets the maximum file size for a MIME type
   */
  private getMaxSizeForMimeType(mimeType: string): number {
    // Check exact match
    if (this.mimeTypeRules[mimeType]?.maxSize) {
      return this.mimeTypeRules[mimeType].maxSize;
    }

    // Check wildcard
    const category = mimeType.split("/")[0];
    const wildcardKey = `${category}/*`;
    if (this.mimeTypeRules[wildcardKey]?.maxSize) {
      return this.mimeTypeRules[wildcardKey].maxSize;
    }

    return this.maxFileSize;
  }
}
