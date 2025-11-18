import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IUpdateUserDto, UserStatus } from "@sottosviluppo/core";

/**
 * Data Transfer Object for updating user information
 * All fields are optional
 *
 * @export
 * @class UpdateUserDto
 * @implements {IUpdateUserDto}
 */
export class UpdateUserDto implements IUpdateUserDto {
  /**
   * Updated username
   *
   * @type {string}
   * @memberof UpdateUserDto
   */
  @ApiPropertyOptional({
    description: "Username",
    example: "john_doe_updated",
  })
  @IsOptional()
  @IsString()
  username?: string;

  /**
   * Updated first name
   *
   * @type {string}
   * @memberof UpdateUserDto
   */
  @ApiPropertyOptional({
    description: "First name",
    example: "John",
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  /**
   * Updated last name
   *
   * @type {string}
   * @memberof UpdateUserDto
   */
  @ApiPropertyOptional({
    description: "Last name",
    example: "Doe",
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  /**
   * Updated user status
   *
   * @type {UserStatus}
   * @memberof UpdateUserDto
   */
  @ApiPropertyOptional({
    description: "User status",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * Updated array of role IDs
   *
   * @type {string[]}
   * @memberof UpdateUserDto
   */
  @ApiPropertyOptional({
    description: "Array of role IDs",
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  roleIds?: string[];
}
