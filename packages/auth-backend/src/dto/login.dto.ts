import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for user login
 *
 * Used to validate login requests. Password is not validated
 * for strength here since it's an existing password.
 *
 * @export
 * @class LoginDto
 *
 * @example
 * ```typescript
 * // Valid login request body
 * {
 *   "email": "user@example.com",
 *   "password": "userPassword123"
 * }
 * ```
 */
export class LoginDto {
  /**
   * User email address
   *
   * Must be a valid email format.
   *
   * @type {string}
   * @memberof LoginDto
   *
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
    format: "email",
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  /**
   * User password
   *
   * No strength validation on login - just checks it's not empty.
   *
   * @type {string}
   * @memberof LoginDto
   *
   * @example 'SecureP@ss123'
   */
  @ApiProperty({
    description: "User password",
    example: "SecureP@ss123",
  })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
