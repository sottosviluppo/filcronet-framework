import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  Validate,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ICreateUserDto } from "@sottosviluppo/core";
import { IsStrongPasswordConstraint } from "../validators/is-strong-password.validator";

/**
 * Data Transfer Object for creating a new user
 * Used by administrators to create users with specific roles
 *
 * @export
 * @class CreateUserDto
 * @implements {ICreateUserDto}
 */
export class CreateUserDto implements ICreateUserDto {
  /**
   * User email address (must be unique)
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  /**
   * Username (optional, must be unique if provided)
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiPropertyOptional({
    description: "Username",
    example: "john_doe",
  })
  @IsOptional()
  @IsString()
  username?: string;

  /**
   * User first name
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiPropertyOptional({
    description: "First name",
    example: "John",
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  /**
   * User last name
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiPropertyOptional({
    description: "Last name",
    example: "Doe",
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  /**
   * User password (will be hashed automatically)
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiPropertyOptional({
    description:
      "User password (optional - if not provided, invitation email will be sent). GDPR-compliant: min 12 chars, 3 of 4 character types",
    example: "SecureP@ss123",
    minLength: 12,
  })
  @IsOptional()
  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @Validate(IsStrongPasswordConstraint)
  password?: string;

  /**
   * Array of role IDs to assign to the user
   * If not provided, default "user" role will be assigned
   *
   * @type {string[]}
   * @memberof CreateUserDto
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

  /**
   * Base URL for invitation link (required if password is not provided)
   * Example: "https://app.example.com/set-password"
   * Final URL will be: "https://app.example.com/set-password?token=..."
   *
   * @type {string}
   * @memberof CreateUserDto
   */
  @ApiPropertyOptional({
    description:
      "Base URL for invitation link (required if password not provided)",
    example: "https://app.example.com/set-password",
  })
  @IsOptional()
  @IsString()
  invitationUrl?: string;
}
