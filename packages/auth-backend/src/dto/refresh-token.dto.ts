import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * DTO for refresh token request
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: "Valid refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
