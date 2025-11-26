import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for resetting password with token
 *
 * Used when user clicks the reset link from email.
 * Password validation is done in the service layer with
 * user context for personal data checking.
 *
 * @export
 * @class ResetPasswordDto
 *
 * @example
 * ```typescript
 * // Valid reset password request body
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "newPassword": "MyNewSecureP@ss2024"
 * }
 * ```
 */
export class ResetPasswordDto {
  /**
   * Password reset token from email link
   *
   * JWT token containing user ID and type 'password_reset'.
   * Token is validated for expiration and version matching.
   *
   * @type {string}
   * @memberof ResetPasswordDto
   *
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @ApiProperty({
    description: "Password reset token received via email",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsNotEmpty({ message: "Token is required" })
  @IsString({ message: "Token must be a string" })
  token: string;

  /**
   * New password to set
   *
   * Must meet GDPR-compliant security requirements.
   * Full validation including personal data check is done
   * in the service layer where user context is available.
   *
   * Requirements:
   * - Minimum 12 characters
   * - At least 3 of: uppercase, lowercase, number, special char
   * - Cannot contain personal data
   *
   * @type {string}
   * @memberof ResetPasswordDto
   *
   * @example 'MyNewSecureP@ss2024'
   */
  @ApiProperty({
    description:
      "New password (GDPR-compliant: min 12 chars, 3 of 4 character types)",
    example: "MyNewSecureP@ss2024",
    minLength: 12,
  })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  newPassword: string;
}
