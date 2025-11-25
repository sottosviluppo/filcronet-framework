import { IApiResponse, IPaginatedApiResponse, IPaginationParams, IUser, UserStatus } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Create user data
 */
export interface CreateUserData {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roleIds?: string[];
  invitationUrl?: string;
}

/**
 * Update user data
 */
export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roleIds?: string[];
}

/**
 * User creation response (with password)
 */
export interface CreateUserResponse {
  user: IUser;
  message: string;
}

/**
 * User creation response (with invitation)
 */
export interface CreateUserWithInvitationResponse {
  user: IUser;
  invitationToken: string;
  invitationUrl: string;
  message: string;
}

/**
 * User management API client
 * Handles user CRUD operations
 * 
 * @export
 * @class UserApi
 */
export class UserApi {
  constructor(private httpClient: IHttpClient) {}

  /**
   * Create a new user
   * 
   * @param {CreateUserData} data - User data
   * @returns {Promise<CreateUserResponse | CreateUserWithInvitationResponse>}
   * @memberof UserApi
   * 
   * @example
   * ```typescript
   * // Create with password
   * const response = await userApi.create({
   *   email: 'user@example.com',
   *   password: 'SecurePass123!',
   *   roleIds: ['role-uuid']
   * });
   * 
   * // Create with invitation
   * const response = await userApi.create({
   *   email: 'user@example.com',
   *   invitationUrl: 'https://app.com/set-password',
   *   roleIds: ['role-uuid']
   * });
   * ```
   */
  async create(
    data: CreateUserData
  ): Promise<CreateUserResponse | CreateUserWithInvitationResponse> {
    const response = await this.httpClient.post
      <IApiResponse<CreateUserResponse | CreateUserWithInvitationResponse>
    >('/users', data);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create user');
    }

    return response.data;
  }

  /**
   * Get paginated list of users
   * 
   * @param {IPaginationParams} [params] - Pagination parameters
   * @returns {Promise<IPaginatedApiResponse<IUser>>}
   * @memberof UserApi
   */
  async findAll(params?: IPaginationParams): Promise<IPaginatedApiResponse<IUser>> {
    const response = await this.httpClient.get<IPaginatedApiResponse<IUser>>(
      '/users',
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch users');
    }

    return response;
  }

  /**
   * Get single user by ID
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<IUser>}
   * @memberof UserApi
   */
  async findOne(userId: string): Promise<IUser> {
    const response = await this.httpClient.get<IApiResponse<IUser>>(
      `/users/${userId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }

    return response.data;
  }

  /**
   * Update user
   * 
   * @param {string} userId - User UUID
   * @param {UpdateUserData} data - Update data
   * @returns {Promise<IUser>}
   * @memberof UserApi
   */
  async update(userId: string, data: UpdateUserData): Promise<IUser> {
    const response = await this.httpClient.patch<IApiResponse<IUser>>(
      `/users/${userId}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }

    return response.data;
  }

  /**
   * Delete user
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   * @memberof UserApi
   */
  async delete(userId: string): Promise<void> {
    const response = await this.httpClient.delete<IApiResponse<void>>(
      `/users/${userId}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user');
    }
  }
}