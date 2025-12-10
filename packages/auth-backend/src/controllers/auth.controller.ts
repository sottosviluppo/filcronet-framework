import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ResponseHelper } from "../utils/response.helper";
import type { IApiResponse } from "@sottosviluppo/core";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../decorators/public.decorator";
import { JwtPayload, TokenType } from "../interfaces/jwt-payload.interface";
import { SetPasswordDto } from "../dto/set-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserEntity } from "../entities/user.entity";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseWithTokens } from "../interfaces/auth-response.interface";
import { RegisterDto } from "../dto/register.dto";
import { PasswordRecoveryService } from "../services/password-recovery.service";
import { AuthService } from "../services/auth.service";
import { Response, Request } from "express";
import { durationToMs } from "../utils/duration.helper";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";

/**
 * Default refresh token expiration (7 days in ms)
 */
const DEFAULT_REFRESH_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;
@ApiTags("Authentication")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  /**
   * Refresh token cookie max age in milliseconds
   */
  private readonly refreshTokenMaxAge: number;

  constructor(
    private readonly authService: AuthService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
    @Inject("AUTH_OPTIONS")
    private readonly options: AuthModuleOptions
  ) {
    // Calculate cookie maxAge from configuration
    this.refreshTokenMaxAge = this.options.jwt.refreshExpiresIn
      ? durationToMs(this.options.jwt.refreshExpiresIn)
      : DEFAULT_REFRESH_EXPIRATION_MS;
  }

  /**
   * Register a new user
   */
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request
  ): Promise<IApiResponse<Omit<AuthResponseWithTokens, "refreshToken">>> {
    const result = await this.authService.register(registerDto);

    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(response, request, result.refreshToken);

    // Don't return refresh token in response body
    const { refreshToken, ...data } = result;

    return ResponseHelper.success(data, "Registration successful");
  }

  /**
   * User login
   */
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request
  ): Promise<IApiResponse<Omit<AuthResponseWithTokens, "refreshToken">>> {
    const result = await this.authService.login(loginDto);

    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(response, request, result.refreshToken);

    // Don't return refresh token in response body
    const { refreshToken, ...data } = result;

    return ResponseHelper.success(data, "Login successful");
  }

  /**
   * Refresh access token using HttpOnly cookie
   */
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<IApiResponse<{ accessToken: string; user: any }>> {
    // Get refresh token from HttpOnly cookie
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // Update refresh token cookie with new one
    this.setRefreshTokenCookie(response, request, result.refreshToken);

    return ResponseHelper.success(
      {
        accessToken: result.accessToken,
        user: result.user, // Include user data for frontend to update store
      },
      "Token refreshed successfully"
    );
  }

  /**
   * Logout (clear refresh token cookie)
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User logout" })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request
  ): Promise<IApiResponse<void>> {
    // Clear refresh token cookie
    response.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: this.buildCookiePathFromRequest(request),
    });

    return ResponseHelper.successMessage("Logout successful");
  }

  /**
   * Get current user profile
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(
    @CurrentUser() user: JwtPayload
  ): Promise<IApiResponse<UserEntity>> {
    const userData = await this.authService.validateUser(user);
    return ResponseHelper.success(userData);
  }

  // ===== PASSWORD RECOVERY ENDPOINTS =====

  /**
   * Request password reset
   */
  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  async forgotPassword(
    @Body() dto: { email: string; resetUrl: string }
  ): Promise<IApiResponse<void>> {
    const result = await this.passwordRecoveryService.forgotPassword(
      dto.email,
      dto.resetUrl
    );
    return ResponseHelper.successMessage(result.message);
  }

  /**
   * Reset password with token
   */
  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<IApiResponse<void>> {
    const result = await this.passwordRecoveryService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
    return ResponseHelper.successMessage(result.message);
  }

  /**
   * Set password from invitation
   */
  @Public()
  @Post("set-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set password (first time from invitation)" })
  async setPassword(
    @Body() setPasswordDto: SetPasswordDto
  ): Promise<IApiResponse<void>> {
    const result = await this.passwordRecoveryService.setPassword(
      setPasswordDto.token,
      setPasswordDto.password
    );
    return ResponseHelper.successMessage(result.message);
  }

  /**
   * Validate a token
   */
  @Public()
  @Get("validate-token")
  @ApiOperation({ summary: "Validate a token without consuming it" })
  async validateToken(
    @Query("token") token: string,
    @Query("type") type: TokenType
  ): Promise<IApiResponse<{ valid: boolean; email?: string }>> {
    const result = await this.passwordRecoveryService.validateToken(
      token,
      type
    );
    return ResponseHelper.success(result);
  }

  /**
   * Resend invitation to user (SPOSTATO DA UserController)
   */
  @Post("resend-invitation")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users:update")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend invitation to user" })
  async resendInvitation(
    @Body() dto: { userId: string; invitationUrl: string }
  ): Promise<IApiResponse<{ invitationToken: string; invitationUrl: string }>> {
    const result = await this.passwordRecoveryService.generateInvitation(
      dto.userId,
      dto.invitationUrl
    );
    return ResponseHelper.success(result, "Invitation sent successfully");
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Sets the refresh token HttpOnly cookie with configured expiration
   *
   * @private
   * @param {Response} response - Express response object
   * @param {Request} request - Express request object
   * @param {string} refreshToken - JWT refresh token
   * @memberof AuthController
   */
  private setRefreshTokenCookie(
    response: Response,
    request: Request,
    refreshToken: string
  ): void {
    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: this.refreshTokenMaxAge,
      path: this.buildCookiePathFromRequest(request),
    });
  }

  /**
   * Builds the cookie path from the current request URL
   * Extracts the base path up to and including '/auth'
   *
   * @private
   * @param {Request} request - Express request object
   * @returns {string} Cookie path (e.g., '/api/v1/auth')
   *
   * @example
   * // Request to: /api/v1/auth/login
   * // Returns: '/api/v1/auth'
   *
   * // Request to: /v1/auth/refresh
   * // Returns: '/v1/auth'
   */
  private buildCookiePathFromRequest(request: Request): string {
    const fullPath = request.baseUrl + request.path;
    const authIndex = fullPath.indexOf("/auth");

    if (authIndex !== -1) {
      return fullPath.substring(0, authIndex + "/auth".length);
    }

    return "/auth";
  }
}
