import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { IFileMetadata } from "../entities/file.entity";

/**
 * Data Transfer Object for updating file metadata
 * All fields are optional
 *
 * @export
 * @class UpdateFileDto
 */
export class UpdateFileDto {
  /**
   * New virtual path
   * Must start and end with /
   */
  @ApiPropertyOptional({
    description: "New virtual path. Must start and end with /",
    example: "/documents/archive/",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(/^\/.*\/$/, { message: "Path must start and end with /" })
  path?: string;

  /**
   * Whether the file should be publicly accessible
   */
  @ApiPropertyOptional({
    description: "Whether the file should be publicly accessible",
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Entity type for polymorphic association
   * Pass null to remove association
   */
  @ApiPropertyOptional({
    description:
      "Entity type for polymorphic association. Pass null to remove.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string | null;

  /**
   * Entity ID for polymorphic association
   * Pass null to remove association
   */
  @ApiPropertyOptional({
    description: "Entity ID for polymorphic association. Pass null to remove.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string | null;

  /**
   * Tags for categorization (replaces existing tags)
   * Pass empty array to remove all tags
   */
  @ApiPropertyOptional({
    description:
      "Tags for categorization. Replaces existing tags. Pass empty array to remove all.",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  /**
   * Category for logical grouping
   * Pass null to remove category
   */
  @ApiPropertyOptional({
    description: "Category for logical grouping. Pass null to remove.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  /**
   * Custom metadata object
   * Can contain any additional properties (description, custom fields, etc.)
   * Pass null to remove all metadata
   * Note: This replaces the entire metadata object, not individual fields
   */
  @ApiPropertyOptional({
    description:
      "Custom metadata object. Replaces entire metadata. Pass null to remove.",
    example: { description: "My file description", customField: "value" },
  })
  @IsOptional()
  @IsObject()
  metadata?: IFileMetadata | null;
}
