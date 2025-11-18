import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "./user.service";
import { RoleService } from "./role.service";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { JwtPayload, TokenType } from "../interfaces/jwt-payload.interface";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";
import { UserEntity } from "../entities/user.entity";
import { UserStatus } from "@filcronet/core";
import { StringValue } from "ms";

/**
 * Authentication response with token pair
 *
 * @interface AuthResponseWithTokens
 */
interface AuthResponseWithTokens {
  user: Omit<UserEntity, "password">;
  accessToken: string;
  refreshToken: string;
}

/**
 * Service handling authentication operations
 *
 * @export
 * @class AuthService
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private jwtService: JwtService,
    @Inject("AUTH_OPTIONS")
    private options: AuthModuleOptions
  ) {}

  /**
   * Registers a new user with default role
   *
   * @param {RegisterDto} registerDto - Registration data
   * @returns {Promise<AuthResponseWithTokens>} User and token pair
   * @throws {BadRequestException} If default role configuration is invalid
   * @throws {ConflictException} If email or username already exists
   * @memberof AuthService
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseWithTokens> {
    const defaultRole = await this.roleService.findByName("user");

    if (!defaultRole) {
      throw new BadRequestException("Invalid role configuration");
    }

    const user = await this.userService.create({
      email: registerDto.email,
      username: registerDto.username,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: registerDto.password,
      roleIds: [defaultRole.id],
    });

    const tokens = await this.generateTokenPair(user);

    return {
      user: user.toSafeObject(),
      ...tokens,
    };
  }

  /**
   * Authenticates user with email and password
   *
   * @param {LoginDto} loginDto - Login credentials
   * @returns {Promise<AuthResponseWithTokens>} User and token pair
   * @throws {UnauthorizedException} If credentials are invalid or account is not active
   * @memberof AuthService
   */
  async login(loginDto: LoginDto): Promise<AuthResponseWithTokens> {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account suspended");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException("Account inactive");
    }

    await this.userService.updateLastLogin(user.id);

    const tokens = await this.generateTokenPair(user);

    return {
      user: user.toSafeObject(),
      ...tokens,
    };
  }

  /**
   * Refreshes access token using refresh token
   *
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} New token pair
   * @throws {UnauthorizedException} If refresh token is invalid or user not found
   * @memberof AuthService
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      if (payload.type !== TokenType.REFRESH) {
        throw new UnauthorizedException("Invalid token type");
      }

      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("Account not active");
      }

      return this.generateTokenPair(user);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /**
   * Validates user from JWT payload
   *
   * @param {JwtPayload} payload - JWT token payload
   * @returns {Promise<UserEntity>} User entity
   * @throws {UnauthorizedException} If user not found or not active
   * @memberof AuthService
   */
  async validateUser(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account not active");
    }

    return user;
  }

  /**
   * Generates access and refresh token pair
   *
   * @private
   * @param {UserEntity} user - User entity
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} Token pair
   * @memberof AuthService
   */
  private async generateTokenPair(
    user: UserEntity
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const permissions = user.roles
      .flatMap((role) => role.permissions)
      .map((permission) => `${permission.resource}:${permission.action}`);

    const uniquePermissions = [...new Set(permissions)];

    // Access token with full user data
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      permissions: uniquePermissions,
      type: TokenType.ACCESS,
    };

    // Refresh token with minimal data
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: TokenType.REFRESH,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.options.jwt.expiresIn ?? "15m",
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.options.jwt.refreshExpiresIn ?? "7d",
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generates a special-purpose token (password reset, invitation)
   *
   * @private
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {TokenType} type - Token type
   * @param {(string | number)} expiresIn - Token expiration
   * @returns {string} Signed JWT token
   * @memberof AuthService
   */
  generateSpecialToken(
    userId: string,
    email: string,
    type: TokenType,
    expiresIn: StringValue | number
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type,
    };

    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * Verifies and decodes a special-purpose token
   *
   * @param {string} token - JWT token
   * @param {TokenType} expectedType - Expected token type
   * @returns {Promise<JwtPayload>} Decoded payload
   * @throws {UnauthorizedException} If token is invalid or wrong type
   * @memberof AuthService
   */
  async verifySpecialToken(
    token: string,
    expectedType: TokenType
  ): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.type !== expectedType) {
        throw new UnauthorizedException("Invalid token type");
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
