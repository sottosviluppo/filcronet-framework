import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  Validate,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsStrongPasswordConstraint } from "../validators/is-strong-password.validator";

/**
 * Data Transfer Object for user registration
 * GDPR-compliant password validation
 * 
 * @export
 * @class RegisterDto
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Username (letters, numbers, underscore, hyphen only)',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,30}$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens (3-30 characters)',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Password (GDPR-compliant: min 12 chars, 3 of 4 character types, no personal data, no common passwords)',
    example: 'MySecureP@ss2024',
    minLength: 12,
  })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Validate(IsStrongPasswordConstraint)
  password: string;
}