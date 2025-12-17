import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import type { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import { FileEntity } from "../entities/file.entity";
import { StorageService } from "./storage.service";
import {
  FILE_MANAGER_DEFAULTS,
  FILE_MANAGER_OPTIONS,
} from "../constants/file-manager.constants";

/**
 * Service responsible for cleaning up soft-deleted files
 *
 * @export
 * @class CleanupService
 */
@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);
  private readonly enabled: boolean;
  private readonly retentionDays: number;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @Inject(FILE_MANAGER_OPTIONS)
    private readonly options: IFileManagerModuleOptions,
    private readonly storageService: StorageService
  ) {
    this.enabled = options.cleanup?.enabled ?? false;
    this.retentionDays =
      options.cleanup?.retentionDays ?? FILE_MANAGER_DEFAULTS.RETENTION_DAYS;
  }

  /**
   * Module initialization
   *
   * @returns {Promise<void>}
   * @memberof CleanupService
   */
  async onModuleInit(): Promise<void> {
    if (this.enabled) {
      this.logger.log(
        `Cleanup service enabled. Retention: ${this.retentionDays} days`
      );
    } else {
      this.logger.log("Cleanup service is disabled");
    }
  }

  /**
   * Scheduled cleanup task (runs daily at 3 AM by default)
   * Only runs if cleanup is enabled
   *
   * @returns {Promise<void>}
   * @memberof CleanupService
   */
  @Cron("0 3 * * *")
  async handleScheduledCleanup(): Promise<void> {
    if (!this.enabled) return;
    await this.runCleanup();
  }

  /**
   * Runs the cleanup process
   *
   * @returns {Promise<{ deleted: number; errors: number }>} Cleanup statistics
   * @memberof CleanupService
   */
  async runCleanup(): Promise<{ deleted: number; errors: number }> {
    this.logger.log("Starting cleanup process...");

    const expiredFiles = await this.getExpiredFiles();

    if (expiredFiles.length === 0) {
      this.logger.log("No expired files to clean up");
      return { deleted: 0, errors: 0 };
    }

    this.logger.log(`Found ${expiredFiles.length} expired files to delete`);

    let deleted = 0;
    let errors = 0;

    for (const file of expiredFiles) {
      try {
        // Delete physical file
        await this.storageService.deleteFile(file.storageName, file.isPublic);

        // Hard delete from database
        await this.fileRepository.delete(file.id);

        deleted++;
        this.logger.debug(`Deleted file: ${file.id} (${file.originalName})`);
      } catch (error) {
        errors++;
        this.logger.error(`Failed to delete file ${file.id}: ${error}`);
      }
    }

    this.logger.log(
      `Cleanup completed. Deleted: ${deleted}, Errors: ${errors}`
    );

    return { deleted, errors };
  }

  /**
   * Gets files that have been soft-deleted and are past retention period
   *
   * @returns {Promise<FileEntity[]>} Files to be permanently deleted
   * @memberof CleanupService
   */
  async getExpiredFiles(): Promise<FileEntity[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.retentionDays);

    return this.fileRepository.find({
      where: {
        deletedAt: LessThan(expirationDate),
      },
      withDeleted: true,
    });
  }

  /**
   * Manually triggers cleanup
   *
   * @returns {Promise<{ deleted: number; errors: number }>} Cleanup statistics
   * @memberof CleanupService
   */
  async triggerCleanup(): Promise<{ deleted: number; errors: number }> {
    this.logger.log("Manual cleanup triggered");
    return this.runCleanup();
  }

  /**
   * Gets cleanup statistics
   *
   * @returns {Promise<object>} Statistics
   * @memberof CleanupService
   */
  async getCleanupStats(): Promise<{
    enabled: boolean;
    retentionDays: number;
    pendingDeletion: number;
  }> {
    const expiredFiles = await this.getExpiredFiles();

    return {
      enabled: this.enabled,
      retentionDays: this.retentionDays,
      pendingDeletion: expiredFiles.length,
    };
  }
}
