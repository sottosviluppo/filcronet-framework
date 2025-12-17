import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BatchFileOperationDto } from "./batch-file-operation.dto";

/**
 * Data Transfer Object for batch updating multiple files
 * Extends BatchFileOperationDto with update fields
 *
 * @export
 * @class BatchUpdateFilesDto
 * @extends {BatchFileOperationDto}
 */
export class BatchUpdateFilesDto extends BatchFileOperationDto {
  /**
   * New path for all files
   * Must start and end with /
   */
  @ApiPropertyOptional({
    description: "New path for all files. Must start and end with /",
    example: "/documents/archive/",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(/^\/.*\/$/, { message: "Path must start and end with /" })
  path?: string;

  /**
   * New visibility for all files
   */
  @ApiPropertyOptional({
    description: "New visibility for all files",
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /**
   * New category for all files
   */
  @ApiPropertyOptional({
    description: "New category for all files",
    example: "archived",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  /**
   * Tags to add to all files
   */
  @ApiPropertyOptional({
    description: "Tags to add to all files",
    type: [String],
    example: ["archived", "2024"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  addTags?: string[];

  /**
   * Tags to remove from all files
   */
  @ApiPropertyOptional({
    description: "Tags to remove from all files",
    type: [String],
    example: ["active", "pending"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  removeTags?: string[];
}
