import { IApiResponse, IUser } from "@sottosviluppo/core";
import { ITokenStorage } from "../interfaces/token-storage.interface";
import { IAuthHttpClient } from "../interfaces";

/**
 * Login credentials for authentication
 *
 * @export
 * @interface LoginCredentials
 */
export interface LoginCredentials {
  /**
   * User email address
   *
   * @type {string}
   * @memberof LoginCredentials
   */
  email: string;

  /**
   * User password
   *
   * @type {string}
   * @memberof LoginCredentials
   */
  password: string;
}

/**
 * Registration data for new user
 *
 * @export
 * @interface RegisterData
 */
export interface RegisterData {
  /**
   * User email address (must be unique)
   *
   * @type {string}
   * @memberof RegisterData
   */
  email: string;

  /**
   * Password (GDPR-compliant: min 12 chars, complexity requirements)
   *
   * @type {string}
   * @memberof RegisterData
   */
  password: string;

  /**
   * Optional username (must be unique if provided)
   *
   * @type {string}
   * @memberof RegisterData
   */
  username?: string;

  /**
   * User's first name
   *
   * @type {string}
   * @memberof RegisterData
   */
  firstName?: string;

  /**
   * User's last name
   *
   * @type {string}
   * @memberof RegisterData
   */
  lastName?: string;
}

/**
 * Authentication response from server
 *
 * Note: Refresh token is not included as it's stored in HttpOnly cookie
 *
 * @export
 * @interface AuthResponse
 */
export interface AuthResponse {
  /**
   * Authenticated user data
   *
   * @type {IUser}
   * @memberof AuthResponse
   */
  user: IUser;

  /**
   * JWT access token (short-lived)
   *
   * @type {string}
   * @memberof AuthResponse
   */
  accessToken: string;
}

/**
 * Authentication API client
 *
 * Handles all authentication-related API calls including:
 * - User registration and login
 * - Token refresh using HttpOnly cookies
 * - Password recovery flows
 * - Session management
 *
 * @export
 * @class AuthApi
 *
 * @example
 * ```typescript
 * const authApi = new AuthApi(httpClient, storage);
 *
 * // Login
 * const response = await authApi.login({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * console.log(`Welcome ${response.user.email}`);
 *
 * // Refresh token (uses HttpOnly cookie automatically)
 * const newTokens = await authApi.refreshToken();
 *
 * // Logout
 * await authApi.logout();
 * ```
 */
export class AuthApi {
  /**
   * Creates an instance of AuthApi
   *
   * @param {IAuthHttpClient} httpClient - Authentication-aware HTTP client
   * @param {ITokenStorage} storage - Token storage implementation
   * @memberof AuthApi
   */
  constructor(
    private httpClient: IAuthHttpClient,
    private storage: ITokenStorage
  ) {}

  /**
   * Registers a new user account
   *
   * Creates a new user and automatically authenticates them.
   * The access token is stored in memory and refresh token in HttpOnly cookie.
   *
   * @param {RegisterData} data - Registration data
   * @returns {Promise<AuthResponse>} User data and access token
   * @throws {Error} If email already exists or validation fails
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   const response = await authApi.register({
   *     email: 'newuser@example.com',
   *     password: 'SecureP@ss123!',
   *     firstName: 'John',
   *     lastName: 'Doe',
   *   });
   *   console.log(`Registered: ${response.user.email}`);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   * ```
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.httpClient.post<IApiResponse<AuthResponse>>(
      "/auth/register",
      data,
      { skipAuthRefresh: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Registration failed");
    }

    // Store token and user
    this.storage.setToken(response.data.accessToken);
    this.storage.setUser(response.data.user);
    this.httpClient.setAuthToken(response.data.accessToken);

    return response.data;
  }

  /**
   * Authenticates user with email and password
   *
   * On success, stores access token in memory and refresh token
   * is automatically stored in HttpOnly cookie by the backend.
   *
   * @param {LoginCredentials} credentials - Email and password
   * @returns {Promise<AuthResponse>} User data and access token
   * @throws {Error} If credentials are invalid or account is suspended
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   const response = await authApi.login({
   *     email: 'user@example.com',
   *     password: 'password123',
   *   });
   *   console.log(`Logged in as ${response.user.email}`);
   * } catch (error) {
   *   if (error.message === 'Account suspended') {
   *     showSuspendedMessage();
   *   } else {
   *     showInvalidCredentials();
   *   }
   * }
   * ```
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.httpClient.post<IApiResponse<AuthResponse>>(
      "/auth/login",
      credentials,
      { skipAuthRefresh: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Login failed");
    }

    // Store token and user
    this.storage.setToken(response.data.accessToken);
    this.storage.setUser(response.data.user);
    this.httpClient.setAuthToken(response.data.accessToken);

    return response.data;
  }

  /**
   * Refreshes access token using HttpOnly refresh token cookie
   *
   * The refresh token is automatically sent via cookie (credentials: include).
   * On success, updates stored access token and user data.
   *
   * @returns {Promise<AuthResponse>} New access token and updated user data
   * @throws {Error} If refresh token is invalid or expired
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   const response = await authApi.refreshToken();
   *   console.log('Token refreshed successfully');
   * } catch (error) {
   *   // Refresh failed, user needs to login again
   *   redirectToLogin();
   * }
   * ```
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.httpClient.post<IApiResponse<AuthResponse>>(
      "/auth/refresh",
      undefined,
      { skipAuthRefresh: true }
    );

    if (!response.success || !response.data) {
      this.storage.clear();
      this.httpClient.setAuthToken(null);
      throw new Error(response.message || "Token refresh failed");
    }

    // Update stored token and user
    this.storage.setToken(response.data.accessToken);
    this.storage.setUser(response.data.user);
    this.httpClient.setAuthToken(response.data.accessToken);

    return response.data;
  }

  /**
   * Logs out the current user
   *
   * Clears the HttpOnly refresh token cookie on the server
   * and removes local authentication state.
   *
   * @returns {Promise<void>}
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * await authApi.logout();
   * router.push('/login');
   * ```
   */
  async logout(): Promise<void> {
    await this.httpClient.post<IApiResponse<void>>("/auth/logout", undefined, {
      skipAuthRefresh: true,
    });

    // Clear local storage
    this.storage.clear();
    this.httpClient.setAuthToken(null);
  }

  /**
   * Fetches current user profile from server
   *
   * Useful to get fresh user data or verify authentication status.
   *
   * @returns {Promise<IUser>} Current user data
   * @throws {Error} If not authenticated or request fails
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * const user = await authApi.getCurrentUser();
   * console.log(`Current user: ${user.email}`);
   * console.log(`Roles: ${user.roles.map(r => r.name).join(', ')}`);
   * ```
   */
  async getCurrentUser(): Promise<IUser> {
    const response = await this.httpClient.get<IApiResponse<IUser>>("/auth/me");

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch user");
    }

    // Update stored user
    this.storage.setUser(response.data);

    return response.data;
  }

  /**
   * Requests password reset email
   *
   * Sends a password reset link to the specified email if account exists.
   * For security, always returns success even if email doesn't exist.
   *
   * @param {string} email - User email address
   * @param {string} resetUrl - Base URL for reset page (token will be appended)
   * @returns {Promise<void>}
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * await authApi.forgotPassword(
   *   'user@example.com',
   *   'https://app.example.com/reset-password'
   * );
   * showMessage('If an account exists, a reset link has been sent.');
   * ```
   */
  async forgotPassword(email: string, resetUrl: string): Promise<void> {
    await this.httpClient.post<IApiResponse<void>>(
      "/auth/forgot-password",
      {
        email,
        resetUrl,
      },
      {
        skipAuthRefresh: true,
      }
    );
  }

  /**
   * Resets password using token from email
   *
   * @param {string} token - Reset token from email link
   * @param {string} newPassword - New password (must meet GDPR requirements)
   * @returns {Promise<void>}
   * @throws {Error} If token is invalid, expired, or password doesn't meet requirements
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   await authApi.resetPassword(tokenFromUrl, newPassword);
   *   showSuccess('Password reset successfully');
   *   router.push('/login');
   * } catch (error) {
   *   showError(error.message);
   * }
   * ```
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.httpClient.post<IApiResponse<void>>(
      "/auth/reset-password",
      {
        token,
        newPassword,
      },
      {
        skipAuthRefresh: true,
      }
    );
  }

  /**
   * Sets password for invited user (first-time password)
   *
   * Used when admin creates user without password and sends invitation.
   *
   * @param {string} token - Invitation token from email link
   * @param {string} password - Password to set (must meet GDPR requirements)
   * @returns {Promise<void>}
   * @throws {Error} If token is invalid, expired, or user already has password
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   await authApi.setPassword(invitationToken, password);
   *   showSuccess('Password set successfully');
   *   router.push('/login');
   * } catch (error) {
   *   if (error.message.includes('already has a password')) {
   *     router.push('/forgot-password');
   *   }
   * }
   * ```
   */
  async setPassword(token: string, password: string): Promise<void> {
    await this.httpClient.post<IApiResponse<void>>(
      "/auth/set-password",
      {
        token,
        password,
      },
      {
        skipAuthRefresh: true,
      }
    );
  }

  /**
   * Validates a token without consuming it
   *
   * Use to check if token is valid before showing password form.
   *
   * @param {string} token - Token to validate
   * @param {'password_reset' | 'invitation'} type - Token type
   * @returns {Promise<{ valid: boolean; email?: string }>} Validation result
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * const result = await authApi.validateToken(token, 'password_reset');
   * if (result.valid) {
   *   showPasswordForm(result.email);
   * } else {
   *   showError('This link has expired or is invalid.');
   * }
   * ```
   */
  async validateToken(
    token: string,
    type: "password_reset" | "invitation"
  ): Promise<{ valid: boolean; email?: string }> {
    const response = await this.httpClient.get<
      IApiResponse<{ valid: boolean; email?: string }>
    >("/auth/validate-token", {
      params: { token, type },
      skipAuthRefresh: true,
    });

    return response.data || { valid: false };
  }

  /**
   * Resends invitation email to user without password
   *
   * Admin function to resend invitation when original email was lost.
   *
   * @param {string} userId - User ID to resend invitation to
   * @param {string} invitationUrl - Base URL for invitation page
   * @returns {Promise<{ invitationToken: string; invitationUrl: string }>} New invitation details
   * @throws {Error} If user already has password or user not found
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * try {
   *   const result = await authApi.resendInvitation(
   *     userId,
   *     'https://app.example.com/set-password'
   *   );
   *   showSuccess('Invitation resent successfully');
   * } catch (error) {
   *   showError(error.message);
   * }
   * ```
   */
  async resendInvitation(
    userId: string,
    invitationUrl: string
  ): Promise<{ invitationToken: string; invitationUrl: string }> {
    const response = await this.httpClient.post<
      IApiResponse<{ invitationToken: string; invitationUrl: string }>
    >("/auth/resend-invitation", {
      userId,
      invitationUrl,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to resend invitation");
    }

    return response.data;
  }
}
