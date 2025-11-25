import { IApiResponse, IRole } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Create role data
 */
export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

/**
 * Update role data
 */
export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

/**
 * Role management API client
 *
 * @export
 * @class RoleApi
 */
export class RoleApi {
  constructor(private httpClient: IHttpClient) {}

  /**
   * Create a new role
   *
   * @param {CreateRoleData} data - Role data
   * @returns {Promise<IRole>}
   * @memberof RoleApi
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
   * Get all roles
   *
   * @returns {Promise<IRole[]>}
   * @memberof RoleApi
   */
  async findAll(): Promise<IRole[]> {
    const response = await this.httpClient.get<IApiResponse<IRole[]>>("/roles");

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch roles");
    }

    return response.data;
  }

  /**
   * Get single role by ID
   *
   * @param {string} roleId - Role UUID
   * @returns {Promise<IRole>}
   * @memberof RoleApi
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
   * Update role
   *
   * @param {string} roleId - Role UUID
   * @param {UpdateRoleData} data - Update data
   * @returns {Promise<IRole>}
   * @memberof RoleApi
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
   * Delete role
   *
   * @param {string} roleId - Role UUID
   * @returns {Promise<void>}
   * @memberof RoleApi
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
