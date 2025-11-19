import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ICreateRoleDto } from "@sottosviluppo/core";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

/**
 * Data Transfer Object for creating a new role
 * Used by administrators to create roles for specific users
 *
 * @export
 * @class CreateRoleDto
 * @implements {ICreateRoleDto}
 */
export class CreateRoleDto implements ICreateRoleDto {
  /**
   * Role name (must be unique)
   *
   * @type {string}
   * @memberof CreateRoleDto
   */
  @ApiProperty({
    description: "Name",
    example: "user",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Role description
   *
   * @type {string}
   * @memberof CreateRoleDto
   */
  @ApiPropertyOptional({
    description: "Description",
    example: "User Role",
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Array of permission IDs to assign to the role
   * If not provided, no users will be assigned
   *
   * @type {string[]}
   * @memberof CreateRoleDto
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
