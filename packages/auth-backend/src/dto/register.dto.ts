import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  Validate,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsStrongPasswordConstraint } from "../validators/is-strong-password.validator";

/**
 * Data Transfer Object for user registration
 *
 * Includes GDPR-compliant password validation using the
 * IsStrongPasswordConstraint validator. Password is checked
 * against user's personal data to prevent weak passwords.
 *
 * @export
 * @class RegisterDto
 *
 * @example
 * ```typescript
 * // Valid registration request body
 * {
 *   "email": "user@example.com",
 *   "password": "MySecureP@ss2024",
 *   "username": "john_doe",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 * ```
 */
export class RegisterDto {
  /**
   * User email address
   *
   * Must be unique in the system and valid email format.
   *
   * @type {string}
   * @memberof RegisterDto
   *
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: "User email address (must be unique)",
    example: "user@example.com",
    format: "email",
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  /**
   * Optional username
   *
   * Must be 3-30 characters, containing only letters, numbers,
   * underscores, and hyphens. Must be unique if provided.
   *
   * @type {string}
   * @memberof RegisterDto
   *
   * @example 'john_doe'
   */
  @ApiPropertyOptional({
    description: "Username (letters, numbers, underscore, hyphen only)",
    example: "john_doe",
    minLength: 3,
    maxLength: 30,
    pattern: "^[a-zA-Z0-9_-]{3,30}$",
  })
  @IsOptional()
  @IsString({ message: "Username must be a string" })
  @Matches(/^[a-zA-Z0-9_-]{3,30}$/, {
    message:
      "Username can only contain letters, numbers, underscores and hyphens (3-30 characters)",
  })
  username?: string;

  /**
   * User's first name
   *
   * @type {string}
   * @memberof RegisterDto
   *
   * @example 'John'
   */
  @ApiPropertyOptional({
    description: "User first name",
    example: "John",
  })
  @IsOptional()
  @IsString({ message: "First name must be a string" })
  firstName?: string;

  /**
   * User's last name
   *
   * @type {string}
   * @memberof RegisterDto
   *
   * @example 'Doe'
   */
  @ApiPropertyOptional({
    description: "User last name",
    example: "Doe",
  })
  @IsOptional()
  @IsString({ message: "Last name must be a string" })
  lastName?: string;

  /**
   * User password
   *
   * Must meet GDPR-compliant security requirements:
   * - Minimum 12 characters
   * - At least 3 of: uppercase, lowercase, number, special char
   * - No sequential characters (123, abc)
   * - No repeated characters (aaa, 111)
   * - Cannot contain personal data (email, name, username)
   *
   * @type {string}
   * @memberof RegisterDto
   *
   * @example 'MySecureP@ss2024'
   */
  @ApiProperty({
    description:
      "Password (GDPR-compliant: min 12 chars, 3 of 4 character types, no personal data)",
    example: "MySecureP@ss2024",
    minLength: 12,
  })
  @IsString({ message: "Password must be a string" })
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @Validate(IsStrongPasswordConstraint)
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
