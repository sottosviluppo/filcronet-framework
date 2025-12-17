import { IsArray, IsUUID, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for batch file operations
 * Base class for operations that work on multiple files
 *
 * @export
 * @class BatchFileOperationDto
 */
export class BatchFileOperationDto {
  /**
   * Array of file IDs to operate on
   */
  @ApiProperty({
    description: "Array of file UUIDs to operate on",
    type: [String],
    example: [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one file ID is required" })
  @IsUUID("4", { each: true })
  fileIds: string[];
}
