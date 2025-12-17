/**
 * @fileoverview Administrative file management controller
 * Handles cleanup, statistics, and system operations
 * @packageDocumentation
 */

import { Controller, Get, Post, HttpCode, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { CleanupService } from "../services/cleanup.service";
import { StorageService } from "../services/storage.service";
import { IApiResponse } from "@sottosviluppo/core";
import { ResponseHelper } from "../utils/response.helper";
import { formatBytes } from "../constants/file-manager.constants";

/**
 * Storage statistics response
 *
 * @export
 * @interface IStorageStats
 */
export interface IStorageStats {
  publicCount: number;
  privateCount: number;
  publicSize: number;
  privateSize: number;
  totalCount: number;
  totalSize: number;
  publicSizeFormatted: string;
  privateSizeFormatted: string;
  totalSizeFormatted: string;
}

/**
 * Cleanup statistics response
 *
 * @export
 * @interface ICleanupStats
 */
export interface ICleanupStats {
  enabled: boolean;
  retentionDays: number;
  pendingDeletion: number;
}

/**
 * Cleanup result response
 *
 * @export
 * @interface ICleanupResult
 */
export interface ICleanupResult {
  deleted: number;
  errors: number;
}

/**
 * Health check response
 *
 * @export
 * @interface IHealthCheckResponse
 */
export interface IHealthCheckResponse {
  status: string;
  storage: {
    publicPath: string;
    privatePath: string;
  };
  cleanup: ICleanupStats;
}

/**
 * Controller for administrative file operations
 * Provides endpoints for storage stats, cleanup, and system management
 *
 * NOTE: This controller does NOT include authentication guards.
 * The consuming application must apply guards at the module or application level.
 * These endpoints should be restricted to admin users only.
 *
 * @export
 * @class AdminFileController
 *
 * @example
 * ```typescript
 * // Protect these routes in your application
 * // Option 1: Global guards
 * // Option 2: Route-specific guards in a wrapper controller
 * // Option 3: Middleware
 * ```
 */
@ApiTags("Files - Admin")
@Controller({ path: "files/admin", version: "1" })
@ApiBearerAuth()
export class AdminFileController {
  constructor(
    private readonly cleanupService: CleanupService,
    private readonly storageService: StorageService
  ) {}

  // ===== STATISTICS ENDPOINTS =====

  /**
   * Gets storage statistics
   *
   * @returns {Promise<IApiResponse<IStorageStats>>} Storage statistics
   * @memberof AdminFileController
   */
  @Get("stats/storage")
  @ApiOperation({ summary: "Get storage statistics" })
  @ApiResponse({ status: 200, description: "Storage statistics retrieved" })
  async getStorageStats(): Promise<IApiResponse<IStorageStats>> {
    const stats = await this.storageService.getStorageStats();

    const response: IStorageStats = {
      ...stats,
      totalCount: stats.publicCount + stats.privateCount,
      totalSize: stats.publicSize + stats.privateSize,
      publicSizeFormatted: formatBytes(stats.publicSize),
      privateSizeFormatted: formatBytes(stats.privateSize),
      totalSizeFormatted: formatBytes(stats.publicSize + stats.privateSize),
    };

    return ResponseHelper.success(response);
  }

  /**
   * Gets cleanup service statistics
   *
   * @returns {Promise<IApiResponse<ICleanupStats>>} Cleanup statistics
   * @memberof AdminFileController
   */
  @Get("stats/cleanup")
  @ApiOperation({ summary: "Get cleanup service statistics" })
  @ApiResponse({ status: 200, description: "Cleanup statistics retrieved" })
  async getCleanupStats(): Promise<IApiResponse<ICleanupStats>> {
    const stats = await this.cleanupService.getCleanupStats();
    return ResponseHelper.success(stats);
  }

  // ===== CLEANUP ENDPOINTS =====

  /**
   * Manually triggers the cleanup process
   * Permanently deletes files that have been soft-deleted beyond the retention period
   *
   * @returns {Promise<IApiResponse<ICleanupResult>>} Cleanup result
   * @memberof AdminFileController
   */
  @Post("cleanup/run")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Manually trigger cleanup of expired files" })
  @ApiResponse({ status: 200, description: "Cleanup completed" })
  async triggerCleanup(): Promise<IApiResponse<ICleanupResult>> {
    const result = await this.cleanupService.triggerCleanup();
    return ResponseHelper.success(
      result,
      `Cleanup completed: ${result.deleted} files deleted, ${result.errors} errors`
    );
  }

  // ===== HEALTH CHECK =====

  /**
   * Checks file manager health status
   *
   * @returns {Promise<IApiResponse<IHealthCheckResponse>>} Health status
   * @memberof AdminFileController
   */
  @Get("health")
  @ApiOperation({ summary: "Check file manager health status" })
  @ApiResponse({ status: 200, description: "Health status retrieved" })
  async healthCheck(): Promise<IApiResponse<IHealthCheckResponse>> {
    const cleanupStats = await this.cleanupService.getCleanupStats();

    return ResponseHelper.success({
      status: "healthy",
      storage: {
        publicPath: this.storageService.getPublicPath(),
        privatePath: this.storageService.getPrivatePath(),
      },
      cleanup: cleanupStats,
    });
  }
}
