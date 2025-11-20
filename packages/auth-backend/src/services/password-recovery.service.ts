import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Optional,
  forwardRef,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthService } from "./auth.service";
import { TokenType } from "../interfaces/jwt-payload.interface";
import { IEmailService } from "../interfaces/email-service.interface";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";
import { PasswordValidator, UserStatus } from "@sottosviluppo/core";
import { UserEntity } from "../entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { mapPasswordErrorKeys } from "../utils/password-error-messages";

/**
 * Service handling password recovery and invitation flows
 *
 * @export
 * @class PasswordRecoveryService
 */
@Injectable()
export class PasswordRecoveryService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject("AUTH_OPTIONS")
    private options: AuthModuleOptions,
    @Optional()
    @Inject("EMAIL_SERVICE")
    private emailService?: IEmailService
  ) {}

  /**
   * Initiates password reset process
   * Sends email with reset token (security by obscurity - always returns success)
   *
   * @param {string} email - User email address
   * @param {string} resetUrlBase - Base URL for reset (e.g., 'https://app.com/reset-password')
   * @returns {Promise<{ message: string }>}
   * @memberof PasswordRecoveryService
   */
  async forgotPassword(
    email: string,
    resetUrlBase: string
  ): Promise<{ message: string }> {
    // Security by obscurity: always return success message
    const successMessage =
      "If an account with that email exists, a password reset link has been sent";

    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        // User doesn't exist, but don't reveal this
        return { message: successMessage };
      }

      if (
        user.status !== UserStatus.ACTIVE &&
        user.status !== UserStatus.PENDING_VERIFICATION
      ) {
        // Account suspended/inactive, but don't reveal this
        return { message: successMessage };
      }

      // Generate reset token WITH current password version
      const expiresIn = this.options.passwordReset?.expiresIn ?? "15m";
      const token = this.authService.generateSpecialToken(
        user.id,
        user.email,
        TokenType.PASSWORD_RESET,
        expiresIn,
        user.passwordVersion
      );

      // Send email if service is configured
      if (this.emailService) {
        const resetUrl = `${resetUrlBase}?token=${token}`;
        await this.emailService.sendPasswordResetEmail(
          user.email,
          token,
          resetUrl
        );
      }

      return { message: successMessage };
    } catch (error) {
      // Log error internally but don't expose it
      console.error("Password reset error:", error);
      return { message: successMessage };
    }
  }

  /**
   * Resets user password using reset token
   * Invalidates token by incrementing password version
   *
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{ message: string }>}
   * @throws {BadRequestException} If token is invalid or expired
   * @memberof PasswordRecoveryService
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    // Verify token (includes version check)
    const payload = await this.authService.verifySpecialToken(
      token,
      TokenType.PASSWORD_RESET
    );

    // Find user
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException("Account suspended");
    }

    const validationResult = PasswordValidator.validatePassword(newPassword, {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!validationResult.isValid) {
      const errorMessages = mapPasswordErrorKeys(validationResult.errorKeys);

      throw new BadRequestException({
        message: "Password validation failed",
        errors: errorMessages,
      });
    }
    // Update password and increment version to invalidate token
    user.password = newPassword;
    user.passwordVersion = (user.passwordVersion || 0) + 1;
    user.status = UserStatus.ACTIVE;

    // Save with new password
    await this.userRepository.save(user);

    return { message: "Password reset successfully" };
  }

  /**
   * Sets password for user (first time, from invitation)
   * Invalidates token by incrementing password version
   *
   * @param {string} token - Invitation token
   * @param {string} password - Password to set
   * @returns {Promise<{ message: string }>}
   * @throws {BadRequestException} If token is invalid or user already has password
   * @memberof PasswordRecoveryService
   */
  async setPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    // Verify token (includes version check)
    const payload = await this.authService.verifySpecialToken(
      token,
      TokenType.INVITATION
    );

    // Find user
    const user = await this.userService.findByEmail(payload.email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has a password
    const userWithPassword = await this.userService.findOne(user.id);

    if (!userWithPassword) {
      throw new NotFoundException("User not found");
    }

    if (userWithPassword.password) {
      throw new BadRequestException(
        "User already has a password. Use password reset instead."
      );
    }

    const validationResult = PasswordValidator.validatePassword(password, {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!validationResult.isValid) {
      const errorMessages = mapPasswordErrorKeys(validationResult.errorKeys);

      throw new BadRequestException({
        message: "Password validation failed",
        errors: errorMessages,
      });
    }

    // Set password, increment version to invalidate token, and activate account
    userWithPassword.password = password;
    userWithPassword.passwordVersion =
      (userWithPassword.passwordVersion || 0) + 1;
    userWithPassword.status = UserStatus.ACTIVE;
    userWithPassword.emailVerified = true;

    await this.userRepository.save(userWithPassword);

    return { message: "Password set successfully" };
  }

  /**
   * Generates invitation token for user without password
   * Used by admin to invite users
   *
   * @param {string} userId - User ID
   * @param {string} invitationUrlBase - Base URL for invitation (e.g., 'https://app.com/set-password')
   * @returns {Promise<{ token: string; invitationUrl: string }>}
   * @throws {NotFoundException} If user not found
   * @throws {BadRequestException} If user already has password
   * @memberof PasswordRecoveryService
   */
  async generateInvitation(
    userId: string,
    invitationUrlBase: string
  ): Promise<{ token: string; invitationUrl: string }> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user already has password
    const userWithPassword = await this.userRepository.findOne({
      where: { id: user.id },
      select: ["id", "password", "passwordVersion"],
    });

    if (!userWithPassword) {
      throw new NotFoundException("User not found");
    }

    if (userWithPassword.password) {
      throw new BadRequestException("User already has a password");
    }

    // Generate invitation token WITH current password version
    const expiresIn = this.options.invitation?.expiresIn ?? "7d";
    const token = this.authService.generateSpecialToken(
      user.id,
      user.email,
      TokenType.INVITATION,
      expiresIn,
      userWithPassword.passwordVersion || 0
    );

    const invitationUrl = `${invitationUrlBase}?token=${token}`;

    // Send email if service is configured
    if (this.emailService) {
      await this.emailService.sendInvitationEmail(
        user.email,
        token,
        invitationUrl
      );
    }

    return { token, invitationUrl };
  }

  /**
   * Validates a token without consuming it
   * Useful for frontend to check if token is valid before showing form
   *
   * @param {string} token - Token to validate
   * @param {TokenType} expectedType - Expected token type
   * @returns {Promise<{ valid: boolean; email?: string }>}
   * @memberof PasswordRecoveryService
   */
  async validateToken(
    token: string,
    expectedType: TokenType
  ): Promise<{ valid: boolean; email?: string }> {
    try {
      const payload = await this.authService.verifySpecialToken(
        token,
        expectedType
      );
      return { valid: true, email: payload.email };
    } catch (error) {
      return { valid: false };
    }
  }
}
