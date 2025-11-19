import { IsString, MinLength, Matches, Validate, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsStrongPasswordConstraint } from "../validators/is-strong-password.validator";

/**
 * Data Transfer Object for setting password (first time)
 * Used when user receives invitation
 *
 * @export
 * @class SetPasswordDto
 */
export class SetPasswordDto {
  /**
   * Invitation token from email
   *
   * @type {string}
   * @memberof SetPasswordDto
   */
  @ApiProperty({
    description: "Invitation token received via email",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  /**
   * Password to set
   * Must be at least 12 characters with at least one uppercase, one lowercase and one number
   *
   * @type {string}
   * @memberof SetPasswordDto
   */
  @ApiProperty({
    description:
      "New password (GDPR-compliant: min 12 chars, 3 of 4 character types)",
    example: "NewSecureP@ss2024",
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @Validate(IsStrongPasswordConstraint)
  password: string;
}
