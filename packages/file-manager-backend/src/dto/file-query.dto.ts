import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/**
 * Sortable fields enum
 */
export enum FileSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  ORIGINAL_NAME = "originalName",
  SIZE = "size",
  MIME_TYPE = "mimeType",
}

/**
 * Data Transfer Object for querying files with filtering and pagination
 *
 * @export
 * @class FileQueryDto
 */
export class FileQueryDto {
  /**
   * Page number (1-indexed)
   */
  @ApiPropertyOptional({
    description: "Page number (1-indexed)",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Items per page
   */
  @ApiPropertyOptional({
    description: "Items per page",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Sort field
   */
  @ApiPropertyOptional({
    description: "Field to sort by",
    enum: FileSortField,
    default: FileSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(FileSortField)
  sortBy?: FileSortField = FileSortField.CREATED_AT;

  /**
   * Sort order
   */
  @ApiPropertyOptional({
    description: "Sort order",
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * Filter by virtual path (prefix match)
   */
  @ApiPropertyOptional({
    description: "Filter by virtual path (prefix match)",
    example: "/documents/",
  })
  @IsOptional()
  @IsString()
  path?: string;

  /**
   * Filter by public/private visibility
   */
  @ApiPropertyOptional({
    description: "Filter by public/private visibility",
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Filter by entity type
   */
  @ApiPropertyOptional({
    description: "Filter by entity type",
    example: "order",
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  /**
   * Filter by entity ID
   */
  @ApiPropertyOptional({
    description: "Filter by entity ID",
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  /**
   * Filter by MIME type
   * Supports wildcards (e.g., 'image/*')
   */
  @ApiPropertyOptional({
    description: "Filter by MIME type. Supports wildcards (e.g., image/*)",
    example: "image/*",
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  /**
   * Filter by category
   */
  @ApiPropertyOptional({
    description: "Filter by category",
    example: "invoices",
  })
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * Filter by tags (files must have ALL specified tags)
   */
  @ApiPropertyOptional({
    description: "Filter by tags. Files must have ALL specified tags.",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    return value;
  })
  tags?: string[];

  /**
   * Filter by uploader user ID
   */
  @ApiPropertyOptional({
    description: "Filter by uploader user ID",
  })
  @IsOptional()
  @IsUUID()
  uploadedById?: string;

  /**
   * Search in original filename (case-insensitive)
   */
  @ApiPropertyOptional({
    description: "Search in original filename (case-insensitive)",
    example: "invoice",
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Include soft-deleted files
   */
  @ApiPropertyOptional({
    description: "Include soft-deleted files",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeDeleted?: boolean = false;
}
