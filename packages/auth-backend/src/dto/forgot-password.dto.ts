import { IsEmail, IsNotEmpty, IsString, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for requesting password reset
 *
 * Contains the user's email and the base URL where
 * the reset link should redirect to.
 *
 * @export
 * @class ForgotPasswordDto
 *
 * @example
 * ```typescript
 * // Valid forgot password request body
 * {
 *   "email": "user@example.com",
 *   "resetUrl": "https://app.example.com/reset-password"
 * }
 * ```
 */
export class ForgotPasswordDto {
  /**
   * User email address
   *
   * The account associated with this email will receive
   * the password reset link (if it exists).
   *
   * @type {string}
   * @memberof ForgotPasswordDto
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
   * Base URL for the password reset page
   *
   * The reset token will be appended as a query parameter.
   * Final URL format: `{resetUrl}?token={token}`
   *
   * @type {string}
   * @memberof ForgotPasswordDto
   *
   * @example 'https://app.example.com/reset-password'
   */
  @ApiProperty({
    description: "Base URL for password reset page (token will be appended)",
    example: "https://app.example.com/reset-password",
  })
  @IsNotEmpty({ message: "Reset URL is required" })
  @IsString({ message: "Reset URL must be a string" })
  resetUrl: string;
}
