import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for user login
 *
 * @export
 * @class LoginDto
 */
export class LoginDto {
  /**
   * User email address
   *
   * @type {string}
   * @memberof LoginDto
   */
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  /**
   * User password (minimum 6 characters)
   *
   * @type {string}
   * @memberof LoginDto
   */
  @ApiProperty({
    description: "User password",
    example: "SecureP@ss123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
