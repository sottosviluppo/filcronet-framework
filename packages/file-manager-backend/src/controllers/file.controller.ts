/**
 * @fileoverview File management controller
 * Handles file upload, download, update, and deletion operations
 * @packageDocumentation
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  Res,
  HttpCode,
  HttpStatus,
  StreamableFile,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import type { Response, Request } from "express";

import { FileService } from "../services/file.service";
import { StorageService, IUploadedFile } from "../services/storage.service";
import { UploadFileDto } from "../dto/upload-file.dto";
import { UpdateFileDto } from "../dto/update-file.dto";
import { FileQueryDto } from "../dto/file-query.dto";
import { BatchUpdateFilesDto } from "../dto/batch-update-files.dto";
import { BatchFileOperationDto } from "../dto/batch-file-operation.dto";
import { IApiResponse, IPaginatedApiResponse } from "@sottosviluppo/core";
import { ResponseHelper } from "../utils/response.helper";
import { IFileMetadata } from "../entities/file.entity";
import { FileManagerGuard } from "../guards/file-manager.guard";

/**
 * Extended Request with user property
 * The consuming application is responsible for populating req.user
 */
interface IAuthenticatedRequest extends Request {
  user?: { id: string; [key: string]: any };
}

/**
 * File response type with download URL
 *
 * @export
 * @interface IFileResponse
 */
export interface IFileResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  isPublic: boolean;
  entityType: string | null;
  entityId: string | null;
  metadata: IFileMetadata | null;
  tags: string[] | null;
  category: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  downloadUrl: string;
}

/**
 * Controller for file management operations
 * Provides endpoints for upload, download, update, and deletion of files
 *
 * @export
 * @class FileController
 */
@ApiTags("Files")
@Controller({ path: "files", version: "1" })
@UseGuards(FileManagerGuard)
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly storageService: StorageService
  ) {}

  // ===== UPLOAD ENDPOINTS =====

  /**
   * Uploads a single file
   *
   * @param {Express.Multer.File} file - Uploaded file
   * @param {UploadFileDto} dto - Upload metadata
   * @param {IAuthenticatedRequest} req - Request with user info
   * @returns {Promise<IApiResponse<IFileResponse>>} Uploaded file data
   * @memberof FileController
   */
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a single file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        path: { type: "string", example: "/documents/" },
        isPublic: { type: "boolean", default: false },
        entityType: { type: "string", example: "order" },
        entityId: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string", example: "invoices" },
      },
      required: ["file"],
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file or validation error" })
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: IUploadedFile,
    @Body() dto: UploadFileDto,
    @Req() req: IAuthenticatedRequest
  ): Promise<IApiResponse<IFileResponse>> {
    const result = await this.fileService.uploadFile(file, dto);
    return ResponseHelper.success(
      result.file.toResponseObject(result.downloadUrl),
      "File uploaded successfully"
    );
  }

  /**
   * Uploads multiple files
   *
   * @param {Express.Multer.File[]} files - Uploaded files
   * @param {UploadFileDto} dto - Common upload metadata
   * @param {IAuthenticatedRequest} req - Request with user info
   * @returns {Promise<IApiResponse<IFileResponse[]>>} Uploaded files data
   * @memberof FileController
   */
  @Post("upload/multiple")
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiOperation({ summary: "Upload multiple files (max 10)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string", format: "binary" } },
        path: { type: "string", example: "/documents/" },
        isPublic: { type: "boolean", default: false },
        entityType: { type: "string" },
        entityId: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
      },
      required: ["files"],
    },
  })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  @HttpCode(HttpStatus.CREATED)
  async uploadMultipleFiles(
    @UploadedFiles() files: IUploadedFile[],
    @Body() dto: UploadFileDto,
    @Req() req: IAuthenticatedRequest
  ): Promise<IApiResponse<IFileResponse[]>> {
    const results = await this.fileService.uploadFiles(files, dto);
    const responses = results.map((r) =>
      r.file.toResponseObject(r.downloadUrl)
    );
    return ResponseHelper.success(
      responses,
      `${results.length} files uploaded successfully`
    );
  }

  // ===== QUERY ENDPOINTS =====

  /**
   * Lists files with filtering and pagination
   *
   * @param {FileQueryDto} query - Query parameters
   * @returns {Promise<IPaginatedApiResponse<IFileResponse>>} Paginated file list
   * @memberof FileController
   */
  @Get()
  @ApiOperation({ summary: "List files with filtering and pagination" })
  @ApiResponse({ status: 200, description: "Files retrieved successfully" })
  async findAll(
    @Query() query: FileQueryDto
  ): Promise<IPaginatedApiResponse<IFileResponse>> {
    const result = await this.fileService.findAll(query);
    const data = result.data.map((f) =>
      f.toResponseObject(this.fileService.getDownloadUrl(f))
    );

    return {
      success: true,
      data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Gets a single file by ID
   *
   * @param {string} id - File UUID
   * @returns {Promise<IApiResponse<IFileResponse>>} File data
   * @memberof FileController
   */
  @Get(":id")
  @ApiOperation({ summary: "Get file by ID" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File retrieved successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<IFileResponse>> {
    const file = await this.fileService.findById(id);
    return ResponseHelper.success(
      file.toResponseObject(this.fileService.getDownloadUrl(file))
    );
  }

  /**
   * Gets files associated with an entity
   *
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<IApiResponse<IFileResponse[]>>} Associated files
   * @memberof FileController
   */
  @Get("entity/:entityType/:entityId")
  @ApiOperation({ summary: "Get files by entity association" })
  @ApiParam({ name: "entityType", description: "Entity type (e.g., order)" })
  @ApiParam({ name: "entityId", description: "Entity ID" })
  @ApiResponse({ status: 200, description: "Files retrieved successfully" })
  async findByEntity(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string
  ): Promise<IApiResponse<IFileResponse[]>> {
    const files = await this.fileService.findByEntity(entityType, entityId);
    const data = files.map((f) =>
      f.toResponseObject(this.fileService.getDownloadUrl(f))
    );
    return ResponseHelper.success(data);
  }

  // ===== DOWNLOAD ENDPOINT =====

  /**
   * Downloads a file (for private files)
   * Public files should be served directly via static file serving
   *
   * @param {string} id - File UUID
   * @param {Response} res - Express response object
   * @returns {Promise<StreamableFile>} File stream
   * @memberof FileController
   */
  @Get(":id/download")
  @ApiOperation({ summary: "Download a file" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File stream" })
  @ApiResponse({ status: 404, description: "File not found" })
  async downloadFile(
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const file = await this.fileService.findById(id);
    const stream = this.storageService.getFileStream(
      file.storageName,
      file.isPublic
    );

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        file.originalName
      )}"`,
      "Content-Length": file.size.toString(),
    });

    return new StreamableFile(stream);
  }

  // ===== UPDATE ENDPOINTS =====

  /**
   * Updates file metadata
   *
   * @param {string} id - File UUID
   * @param {UpdateFileDto} dto - Update data
   * @returns {Promise<IApiResponse<IFileResponse>>} Updated file
   * @memberof FileController
   */
  @Patch(":id")
  @ApiOperation({ summary: "Update file metadata" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File updated successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateFileDto
  ): Promise<IApiResponse<IFileResponse>> {
    const file = await this.fileService.update(id, dto);
    return ResponseHelper.success(
      file.toResponseObject(this.fileService.getDownloadUrl(file)),
      "File updated successfully"
    );
  }

  /**
   * Batch updates multiple files
   *
   * @param {BatchUpdateFilesDto} dto - Batch update data
   * @returns {Promise<IApiResponse<IFileResponse[]>>} Updated files
   * @memberof FileController
   */
  @Patch("batch/update")
  @ApiOperation({ summary: "Batch update multiple files" })
  @ApiResponse({ status: 200, description: "Files updated successfully" })
  async batchUpdate(
    @Body() dto: BatchUpdateFilesDto
  ): Promise<IApiResponse<IFileResponse[]>> {
    const files = await this.fileService.batchUpdate(dto);
    const data = files.map((f) =>
      f.toResponseObject(this.fileService.getDownloadUrl(f))
    );
    return ResponseHelper.success(
      data,
      `${files.length} files updated successfully`
    );
  }

  // ===== DELETE ENDPOINTS =====

  /**
   * Soft deletes a file (can be restored)
   *
   * @param {string} id - File UUID
   * @returns {Promise<IApiResponse<void>>} Success response
   * @memberof FileController
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a file (can be restored)" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async softDelete(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<void>> {
    await this.fileService.softDelete(id);
    return ResponseHelper.successMessage("File deleted successfully");
  }

  /**
   * Permanently deletes a file (cannot be restored)
   *
   * @param {string} id - File UUID
   * @returns {Promise<IApiResponse<void>>} Success response
   * @memberof FileController
   */
  @Delete(":id/permanent")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Permanently delete a file (cannot be restored)" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File permanently deleted" })
  @ApiResponse({ status: 404, description: "File not found" })
  async hardDelete(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<void>> {
    await this.fileService.hardDelete(id);
    return ResponseHelper.successMessage("File permanently deleted");
  }

  /**
   * Restores a soft-deleted file
   *
   * @param {string} id - File UUID
   * @returns {Promise<IApiResponse<IFileResponse>>} Restored file
   * @memberof FileController
   */
  @Post(":id/restore")
  @ApiOperation({ summary: "Restore a soft-deleted file" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File restored successfully" })
  @ApiResponse({ status: 400, description: "File is not deleted" })
  @ApiResponse({ status: 404, description: "File not found" })
  async restore(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<IFileResponse>> {
    const file = await this.fileService.restore(id);
    return ResponseHelper.success(
      file.toResponseObject(this.fileService.getDownloadUrl(file)),
      "File restored successfully"
    );
  }

  /**
   * Batch soft deletes multiple files
   *
   * @param {BatchFileOperationDto} dto - File IDs to delete
   * @returns {Promise<IApiResponse<{ deleted: number }>>} Deletion count
   * @memberof FileController
   */
  @Delete("batch/delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Batch soft delete multiple files" })
  @ApiResponse({ status: 200, description: "Files deleted successfully" })
  async batchSoftDelete(
    @Body() dto: BatchFileOperationDto
  ): Promise<IApiResponse<{ deleted: number }>> {
    const deleted = await this.fileService.batchSoftDelete(dto.fileIds);
    return ResponseHelper.success(
      { deleted },
      `${deleted} files deleted successfully`
    );
  }
}
