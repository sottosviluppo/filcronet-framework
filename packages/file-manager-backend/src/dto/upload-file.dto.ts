import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

/**
 * Data Transfer Object for file upload metadata
 * Used alongside multipart/form-data file upload
 *
 * @export
 * @class UploadFileDto
 */
export class UploadFileDto {
  /**
   * Virtual path for file organization
   * Must start and end with /
   */
  @ApiPropertyOptional({
    description:
      "Virtual path for file organization. Must start and end with /",
    example: "/documents/invoices/",
    default: "/",
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
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isPublic?: boolean;

  /**
   * Entity type for polymorphic association
   */
  @ApiPropertyOptional({
    description: "Entity type for polymorphic association",
    example: "order",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  /**
   * Entity ID for polymorphic association
   */
  @ApiPropertyOptional({
    description: "Entity ID for polymorphic association",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string;

  /**
   * Tags for categorization
   */
  @ApiPropertyOptional({
    description: "Tags for categorization",
    example: ["invoice", "2024", "paid"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
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
   * Category for logical grouping
   */
  @ApiPropertyOptional({
    description: "Category for logical grouping",
    example: "invoices",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
