import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for requesting password reset
 *
 * @export
 * @class ForgotPasswordDto
 */
export class ForgotPasswordDto {
  /**
   * User email address
   *
   * @type {string}
   * @memberof ForgotPasswordDto
   */
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;
}
