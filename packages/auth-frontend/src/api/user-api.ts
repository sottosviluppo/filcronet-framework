import {
  IApiResponse,
  IPaginatedApiResponse,
  IPaginationParams,
  IUser,
  UserStatus,
} from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Data for creating a new user
 *
 * @export
 * @interface CreateUserData
 */
export interface CreateUserData {
  /**
   * User email address (must be unique)
   *
   * @type {string}
   * @memberof CreateUserData
   */
  email: string;

  /**
   * Optional username (must be unique if provided)
   *
   * @type {string}
   * @memberof CreateUserData
   */
  username?: string;

  /**
   * User's first name
   *
   * @type {string}
   * @memberof CreateUserData
   */
  firstName?: string;

  /**
   * User's last name
   *
   * @type {string}
   * @memberof CreateUserData
   */
  lastName?: string;

  /**
   * User password (optional - if not provided, invitation will be sent)
   *
   * Must meet GDPR requirements: min 12 chars, complexity rules
   *
   * @type {string}
   * @memberof CreateUserData
   */
  password?: string;

  /**
   * Array of role IDs to assign
   *
   * If not provided, default 'user' role is assigned
   *
   * @type {string[]}
   * @memberof CreateUserData
   */
  roleIds?: string[];

  /**
   * Base URL for invitation link (required if password not provided)
   *
   * @type {string}
   * @memberof CreateUserData
   *
   * @example 'https://app.example.com/set-password'
   */
  invitationUrl?: string;
}

/**
 * Data for updating an existing user
 *
 * @export
 * @interface UpdateUserData
 */
export interface UpdateUserData {
  /**
   * Updated username
   *
   * @type {string}
   * @memberof UpdateUserData
   */
  username?: string;

  /**
   * Updated first name
   *
   * @type {string}
   * @memberof UpdateUserData
   */
  firstName?: string;

  /**
   * Updated last name
   *
   * @type {string}
   * @memberof UpdateUserData
   */
  lastName?: string;

  /**
   * Updated account status
   *
   * @type {UserStatus}
   * @memberof UpdateUserData
   */
  status?: UserStatus;

  /**
   * Updated role IDs
   *
   * @type {string[]}
   * @memberof UpdateUserData
   */
  roleIds?: string[];
}

/**
 * Response when user is created with password
 *
 * @export
 * @interface CreateUserResponse
 */
export interface CreateUserResponse {
  /**
   * Created user data
   *
   * @type {IUser}
   * @memberof CreateUserResponse
   */
  user: IUser;

  /**
   * Success message
   *
   * @type {string}
   * @memberof CreateUserResponse
   */
  message: string;
}

/**
 * Response when user is created without password (invitation flow)
 *
 * @export
 * @interface CreateUserWithInvitationResponse
 */
export interface CreateUserWithInvitationResponse {
  /**
   * Created user data
   *
   * @type {IUser}
   * @memberof CreateUserWithInvitationResponse
   */
  user: IUser;

  /**
   * Invitation token for setting password
   *
   * @type {string}
   * @memberof CreateUserWithInvitationResponse
   */
  invitationToken: string;

  /**
   * Complete invitation URL with token
   *
   * @type {string}
   * @memberof CreateUserWithInvitationResponse
   */
  invitationUrl: string;

  /**
   * Success message
   *
   * @type {string}
   * @memberof CreateUserWithInvitationResponse
   */
  message: string;
}

/**
 * User management API client
 *
 * Provides CRUD operations for user management (admin only).
 * All methods require appropriate permissions.
 *
 * @export
 * @class UserApi
 *
 * @example
 * ```typescript
 * const userApi = new UserApi(httpClient);
 *
 * // List users with pagination
 * const response = await userApi.findAll({ page: 1, limit: 10 });
 *
 * // Create user with invitation
 * const result = await userApi.create({
 *   email: 'newuser@example.com',
 *   invitationUrl: 'https://app.example.com/set-password',
 * });
 *
 * // Update user
 * await userApi.update(userId, { status: UserStatus.ACTIVE });
 *
 * // Delete user
 * await userApi.delete(userId);
 * ```
 */
export class UserApi {
  /**
   * Creates an instance of UserApi
   *
   * @param {IHttpClient} httpClient - HTTP client for API requests
   * @memberof UserApi
   */
  constructor(private httpClient: IHttpClient) {}

  /**
   * Creates a new user
   *
   * If password is provided, user is created with that password.
   * If password is not provided, an invitation email is sent.
   *
   * Requires 'users:create' permission.
   *
   * @param {CreateUserData} data - User creation data
   * @returns {Promise<CreateUserResponse | CreateUserWithInvitationResponse>} Created user with optional invitation
   * @throws {Error} If email exists, validation fails, or lacks permission
   * @memberof UserApi
   *
   * @example
   * ```typescript
   * // Create with password
   * const response = await userApi.create({
   *   email: 'user@example.com',
   *   password: 'SecureP@ss123!',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   roleIds: ['role-uuid'],
   * });
   *
   * // Create with invitation
   * const response = await userApi.create({
   *   email: 'user@example.com',
   *   invitationUrl: 'https://app.example.com/set-password',
   *   roleIds: ['role-uuid'],
   * });
   *
   * if ('invitationToken' in response) {
   *   console.log('Invitation sent:', response.invitationUrl);
   * }
   * ```
   */
  async create(
    data: CreateUserData
  ): Promise<CreateUserResponse | CreateUserWithInvitationResponse> {
    const response = await this.httpClient.post<
      IApiResponse<CreateUserResponse | CreateUserWithInvitationResponse>
    >("/users", data);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create user");
    }

    return response.data;
  }

  /**
   * Retrieves paginated list of users
   *
   * Requires 'users:list' permission.
   *
   * @param {IPaginationParams} [params] - Pagination and sorting options
   * @returns {Promise<IPaginatedApiResponse<IUser>>} Paginated user list
   * @throws {Error} If request fails or lacks permission
   * @memberof UserApi
   *
   * @example
   * ```typescript
   * // Basic pagination
   * const response = await userApi.findAll({ page: 1, limit: 20 });
   *
   * // With sorting
   * const response = await userApi.findAll({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'createdAt',
   *   sortOrder: 'DESC',
   * });
   *
   * console.log(`Showing ${response.data.length} of ${response.pagination.total}`);
   * ```
   */
  async findAll(
    params?: IPaginationParams
  ): Promise<IPaginatedApiResponse<IUser>> {
    const response = await this.httpClient.get<IPaginatedApiResponse<IUser>>(
      "/users",
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch users");
    }

    return response;
  }

  /**
   * Retrieves a single user by ID
   *
   * Requires 'users:read' permission.
   *
   * @param {string} userId - User UUID
   * @returns {Promise<IUser>} User data with roles and permissions
   * @throws {Error} If user not found or lacks permission
   * @memberof UserApi
   *
   * @example
   * ```typescript
   * const user = await userApi.findOne('550e8400-e29b-41d4-a716-446655440000');
   * console.log(`User: ${user.email}`);
   * console.log(`Roles: ${user.roles.map(r => r.name).join(', ')}`);
   * ```
   */
  async findOne(userId: string): Promise<IUser> {
    const response = await this.httpClient.get<IApiResponse<IUser>>(
      `/users/${userId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch user");
    }

    return response.data;
  }

  /**
   * Updates an existing user
   *
   * Requires 'users:update' permission.
   *
   * @param {string} userId - User UUID
   * @param {UpdateUserData} data - Fields to update
   * @returns {Promise<IUser>} Updated user data
   * @throws {Error} If user not found, validation fails, or lacks permission
   * @memberof UserApi
   *
   * @example
   * ```typescript
   * const updatedUser = await userApi.update(userId, {
   *   firstName: 'Jane',
   *   lastName: 'Smith',
   *   status: UserStatus.ACTIVE,
   * });
   * ```
   */
  async update(userId: string, data: UpdateUserData): Promise<IUser> {
    const response = await this.httpClient.patch<IApiResponse<IUser>>(
      `/users/${userId}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update user");
    }

    return response.data;
  }

  /**
   * Deletes a user permanently
   *
   * Requires 'users:delete' permission.
   *
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   * @throws {Error} If user not found or lacks permission
   * @memberof UserApi
   *
   * @example
   * ```typescript
   * await userApi.delete('550e8400-e29b-41d4-a716-446655440000');
   * console.log('User deleted');
   * ```
   */
  async delete(userId: string): Promise<void> {
    const response = await this.httpClient.delete<IApiResponse<void>>(
      `/users/${userId}`
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to delete user");
    }
  }
}
