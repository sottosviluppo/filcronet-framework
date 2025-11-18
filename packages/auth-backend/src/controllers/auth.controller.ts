import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthService } from "../services/auth.service";
import { PasswordRecoveryService } from "../services/password-recovery.service";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { SetPasswordDto } from "../dto/set-password.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import { Public } from "../decorators/public.decorator";
import { JwtPayload, TokenType } from "../interfaces/jwt-payload.interface";
import type {
  AuthResponseWithTokens,
  TokenPairResponse,
} from "../interfaces/auth-response.interface";
import { RefreshTokenDto } from "../dto/refresh-token.dto";

/**
 * Controller handling authentication endpoints
 *
 * @export
 * @class AuthController
 */
@ApiTags("Authentication")
@Controller({
  path: "auth",
  version: "1",
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  /**
   * Registers a new user account
   */
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 409, description: "Email or username already exists" })
  @ApiResponse({ status: 400, description: "Invalid data" })
  async register(
    @Body() registerDto: RegisterDto
  ): Promise<AuthResponseWithTokens> {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticates user and returns token pair
   */
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseWithTokens> {
    return this.authService.login(loginDto);
  }

  /**
   * Refreshes access token using refresh token
   */
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<TokenPairResponse> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  /**
   * Retrieves current authenticated user profile
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Current user data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.validateUser(user);
  }

  // ===== PASSWORD RECOVERY ENDPOINTS =====

  /**
   * Requests password reset
   */
  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent (if account exists)",
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Query("resetUrl")
    resetUrlBase: string = "http://localhost:3000/reset-password"
  ) {
    return this.passwordRecoveryService.forgotPassword(
      forgotPasswordDto.email,
      resetUrlBase
    );
  }

  /**
   * Resets password using token
   */
  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordRecoveryService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  /**
   * Sets password for first time (invitation)
   */
  @Public()
  @Post("set-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set password (first time from invitation)" })
  @ApiResponse({ status: 200, description: "Password set successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid token or user already has password",
  })
  async setPassword(@Body() setPasswordDto: SetPasswordDto) {
    return this.passwordRecoveryService.setPassword(
      setPasswordDto.token,
      setPasswordDto.password
    );
  }

  /**
   * Validates a token
   */
  @Public()
  @Get("validate-token")
  @ApiOperation({ summary: "Validate a token without consuming it" })
  @ApiQuery({ name: "token", description: "Token to validate" })
  @ApiQuery({
    name: "type",
    enum: TokenType,
    description: "Expected token type",
  })
  @ApiResponse({ status: 200, description: "Token validation result" })
  async validateToken(
    @Query("token") token: string,
    @Query("type") type: TokenType
  ) {
    return this.passwordRecoveryService.validateToken(token, type);
  }
}
