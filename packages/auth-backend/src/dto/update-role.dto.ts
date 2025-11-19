import { ApiPropertyOptional } from "@nestjs/swagger";
import { IUpdateRoleDto } from "@sottosviluppo/core";
import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

/**
 * Data Transfer Object for updating role information
 * All fields are optional
 *
 * @export
 * @class UpdateRoleDto
 * @implements {IUpdateRoleDto}
 */
export class UpdateRoleDto implements IUpdateRoleDto {
  /**
   * Updated name
   *
   * @type {string}
   * @memberof UpdateRoleDto
   */
  @ApiPropertyOptional({
    description: "Name",
    example: "user_updated",
  })
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Updated description
   *
   * @type {string}
   * @memberof UpdateRoleDto
   */
  @ApiPropertyOptional({
    description: "Description",
    example: "Updated User Role",
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Updated array of permission IDs
   *
   * @type {string[]}
   * @memberof UpdateRoleDto
   */
  @ApiPropertyOptional({
    description: "Array of permission IDs",
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  permissionIds?: string[];
}
