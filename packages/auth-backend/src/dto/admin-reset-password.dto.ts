import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for admin-initiated password reset
 * Allows administrators to force-reset a user's password
 *
 * @export
 * @class AdminResetPasswordDto
 */
export class AdminResetPasswordDto {
  /**
   * New password for the user
   * Must meet GDPR-compliant password requirements
   *
   * @type {string}
   * @memberof AdminResetPasswordDto
   */
  @ApiProperty({
    description:
      "New password (must meet GDPR requirements: min 12 chars, 3/4 character types)",
    example: "SecureP@ssw0rd123",
    minLength: 12,
  })
  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters" })
  newPassword: string;
}
