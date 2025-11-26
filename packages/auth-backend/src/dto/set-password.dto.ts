import { IsString, MinLength, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for setting password (invitation flow)
 *
 * Used when user is created without password and receives
 * an invitation email to set their password.
 *
 * @export
 * @class SetPasswordDto
 *
 * @example
 * ```typescript
 * // Valid set password request body
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "password": "MyNewSecureP@ss2024"
 * }
 * ```
 */
export class SetPasswordDto {
  /**
   * Invitation token from email link
   *
   * JWT token containing user ID and type 'invitation'.
   * Token is validated for expiration and version matching.
   * Can only be used once - version is incremented after use.
   *
   * @type {string}
   * @memberof SetPasswordDto
   *
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @ApiProperty({
    description: "Invitation token received via email",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsNotEmpty({ message: "Token is required" })
  @IsString({ message: "Token must be a string" })
  token: string;

  /**
   * Password to set for the account
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
   * @memberof SetPasswordDto
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
  password: string;
}
