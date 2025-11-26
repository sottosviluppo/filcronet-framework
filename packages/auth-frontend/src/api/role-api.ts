import { IApiResponse, IRole } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Data for creating a new role
 *
 * @export
 * @interface CreateRoleData
 */
export interface CreateRoleData {
  /**
   * Role name (must be unique)
   *
   * @type {string}
   * @memberof CreateRoleData
   *
   * @example 'editor', 'moderator', 'customer'
   */
  name: string;

  /**
   * Human-readable role description
   *
   * @type {string}
   * @memberof CreateRoleData
   */
  description?: string;

  /**
   * Permission IDs to assign to this role
   *
   * @type {string[]}
   * @memberof CreateRoleData
   */
  permissionIds?: string[];
}

/**
 * Data for updating an existing role
 *
 * @export
 * @interface UpdateRoleData
 */
export interface UpdateRoleData {
  /**
   * Updated role name
   *
   * @type {string}
   * @memberof UpdateRoleData
   */
  name?: string;

  /**
   * Updated description
   *
   * @type {string}
   * @memberof UpdateRoleData
   */
  description?: string;

  /**
   * Updated permission IDs (replaces existing permissions)
   *
   * @type {string[]}
   * @memberof UpdateRoleData
   */
  permissionIds?: string[];
}

/**
 * Role management API client
 *
 * Provides CRUD operations for role management (admin only).
 * System roles (super-admin, admin, user) cannot be deleted.
 *
 * @export
 * @class RoleApi
 *
 * @example
 * ```typescript
 * const roleApi = new RoleApi(httpClient);
 *
 * // List all roles
 * const roles = await roleApi.findAll();
 *
 * // Create custom role
 * const newRole = await roleApi.create({
 *   name: 'editor',
 *   description: 'Can edit content',
 *   permissionIds: ['perm-1', 'perm-2'],
 * });
 *
 * // Update role permissions
 * await roleApi.update(roleId, {
 *   permissionIds: ['perm-1', 'perm-2', 'perm-3'],
 * });
 *
 * // Delete custom role
 * await roleApi.delete(roleId);
 * ```
 */
export class RoleApi {
  /**
   * Creates an instance of RoleApi
   *
   * @param {IHttpClient} httpClient - HTTP client for API requests
   * @memberof RoleApi
   */
  constructor(private httpClient: IHttpClient) {}

  /**
   * Creates a new role
   *
   * Requires 'roles:create' permission.
   *
   * @param {CreateRoleData} data - Role creation data
   * @returns {Promise<IRole>} Created role with permissions
   * @throws {Error} If role name exists or lacks permission
   * @memberof RoleApi
   *
   * @example
   * ```typescript
   * const role = await roleApi.create({
   *   name: 'editor',
   *   description: 'Content editor role',
   *   permissionIds: [
   *     'posts-create-id',
   *     'posts-update-id',
   *     'posts-delete-id',
   *   ],
   * });
   * console.log(`Created role: ${role.name}`);
   * ```
   */
  async create(data: CreateRoleData): Promise<IRole> {
    const response = await this.httpClient.post<IApiResponse<IRole>>(
      "/roles",
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create role");
    }

    return response.data;
  }

  /**
   * Retrieves all roles
   *
   * Requires 'roles:list' permission.
   *
   * @returns {Promise<IRole[]>} Array of all roles with permissions
   * @throws {Error} If request fails or lacks permission
   * @memberof RoleApi
   *
   * @example
   * ```typescript
   * const roles = await roleApi.findAll();
   *
   * // Separate system and custom roles
   * const systemRoles = roles.filter(r => r.isSystem);
   * const customRoles = roles.filter(r => !r.isSystem);
   * ```
   */
  async findAll(): Promise<IRole[]> {
    const response = await this.httpClient.get<IApiResponse<IRole[]>>("/roles");

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch roles");
    }

    return response.data;
  }

  /**
   * Retrieves a single role by ID
   *
   * Requires 'roles:read' permission.
   *
   * @param {string} roleId - Role UUID
   * @returns {Promise<IRole>} Role with permissions
   * @throws {Error} If role not found or lacks permission
   * @memberof RoleApi
   *
   * @example
   * ```typescript
   * const role = await roleApi.findOne('550e8400-e29b-41d4-a716-446655440000');
   * console.log(`Role: ${role.name}`);
   * console.log(`Permissions: ${role.permissions.length}`);
   * ```
   */
  async findOne(roleId: string): Promise<IRole> {
    const response = await this.httpClient.get<IApiResponse<IRole>>(
      `/roles/${roleId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch role");
    }

    return response.data;
  }

  /**
   * Updates an existing role
   *
   * System roles (super-admin) cannot be modified.
   * Requires 'roles:update' permission.
   *
   * @param {string} roleId - Role UUID
   * @param {UpdateRoleData} data - Fields to update
   * @returns {Promise<IRole>} Updated role
   * @throws {Error} If role not found, is system role, or lacks permission
   * @memberof RoleApi
   *
   * @example
   * ```typescript
   * const updatedRole = await roleApi.update(roleId, {
   *   description: 'Updated description',
   *   permissionIds: ['perm-1', 'perm-2', 'perm-3'],
   * });
   * ```
   */
  async update(roleId: string, data: UpdateRoleData): Promise<IRole> {
    const response = await this.httpClient.patch<IApiResponse<IRole>>(
      `/roles/${roleId}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update role");
    }

    return response.data;
  }

  /**
   * Deletes a role permanently
   *
   * System roles cannot be deleted.
   * Requires 'roles:delete' permission.
   *
   * @param {string} roleId - Role UUID
   * @returns {Promise<void>}
   * @throws {Error} If role not found, is system role, or lacks permission
   * @memberof RoleApi
   *
   * @example
   * ```typescript
   * try {
   *   await roleApi.delete(roleId);
   *   console.log('Role deleted');
   * } catch (error) {
   *   if (error.message.includes('system role')) {
   *     showError('Cannot delete system roles');
   *   }
   * }
   * ```
   */
  async delete(roleId: string): Promise<void> {
    const response = await this.httpClient.delete<IApiResponse<void>>(
      `/roles/${roleId}`
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to delete role");
    }
  }
}
