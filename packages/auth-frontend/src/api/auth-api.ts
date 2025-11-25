import { IApiResponse, IUser } from "@sottosviluppo/core";
import { ITokenStorage } from "../interfaces/token-storage.interface";
import { IAuthHttpClient } from "../interfaces";

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Auth response (without refresh token, it's in HttpOnly cookie)
 */
export interface AuthResponse {
  user: IUser;
  accessToken: string;
}

/**
 * Authentication API client
 * Handles all auth-related API calls
 *
 * @export
 * @class AuthApi
 */
export class AuthApi {
  constructor(
    private httpClient: IAuthHttpClient,
    private storage: ITokenStorage
  ) {}

  /**
   * Register a new user
   *
   * @param {RegisterData} data - Registration data
   * @returns {Promise<AuthResponse>}
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * const response = await authApi.register({
   *   email: 'user@example.com',
   *   password: 'SecurePass123!',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
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
   * Login with credentials
   *
   * @param {LoginCredentials} credentials - Login credentials
   * @returns {Promise<AuthResponse>}
   * @memberof AuthApi
   *
   * @example
   * ```typescript
   * const response = await authApi.login({
   *   email: 'user@example.com',
   *   password: 'SecurePass123!'
   * });
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
   * Refresh access token using HttpOnly cookie
   *
   * @returns {Promise<AuthResponse>}
   * @memberof AuthApi
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
   * Logout (clears cookie and local state)
   *
   * @returns {Promise<void>}
   * @memberof AuthApi
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
   * Get current user profile
   *
   * @returns {Promise<IUser>}
   * @memberof AuthApi
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
   * Request password reset
   *
   * @param {string} email - User email
   * @param {string} resetUrl - Base URL for reset page
   * @returns {Promise<void>}
   * @memberof AuthApi
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
   * Reset password with token
   *
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @memberof AuthApi
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
   * Set password from invitation
   *
   * @param {string} token - Invitation token
   * @param {string} password - Password to set
   * @returns {Promise<void>}
   * @memberof AuthApi
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
   * Validate token without consuming it
   *
   * @param {string} token - Token to validate
   * @param {'password_reset' | 'invitation'} type - Token type
   * @returns {Promise<{ valid: boolean; email?: string }>}
   * @memberof AuthApi
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
   * Resend invitation to user
   *
   * @param {string} userId - User ID
   * @param {string} invitationUrl - Base URL for invitation page
   * @returns {Promise<{ invitationToken: string; invitationUrl: string }>}
   * @memberof AuthApi
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
