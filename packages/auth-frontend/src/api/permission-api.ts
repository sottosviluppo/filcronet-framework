import { IApiResponse, IPermission } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Permission API client
 *
 * Provides methods to fetch permissions from the backend.
 * Permissions are read-only and managed through the backend bootstrap process.
 *
 * @export
 * @class PermissionApi
 *
 * @example
 * ```typescript
 * import { PermissionApi } from '@sottosviluppo/auth-frontend';
 *
 * const permissionApi = new PermissionApi(httpClient);
 *
 * // Get all permissions
 * const permissions = await permissionApi.findAll();
 *
 * // Get single permission
 * const permission = await permissionApi.findOne('permission-uuid');
 * ```
 */
export class PermissionApi {
  /**
   * Creates an instance of PermissionApi
   *
   * @param {IHttpClient} httpClient - HTTP client for API requests
   * @memberof PermissionApi
   */
  constructor(private httpClient: IHttpClient) {}

  /**
   * Retrieves all available permissions
   *
   * Returns all permissions in the system, ordered by resource and action.
   * Requires 'permissions:list' permission.
   *
   * @returns {Promise<IPermission[]>} Array of all permissions
   * @throws {Error} If request fails or user lacks permission
   * @memberof PermissionApi
   *
   * @example
   * ```typescript
   * const permissions = await permissionApi.findAll();
   *
   * // Group by resource
   * const byResource = permissions.reduce((acc, p) => {
   *   acc[p.resource] = acc[p.resource] || [];
   *   acc[p.resource].push(p);
   *   return acc;
   * }, {});
   * ```
   */
  async findAll(): Promise<IPermission[]> {
    const response = await this.httpClient.get<IApiResponse<IPermission[]>>(
      "/permissions"
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch permissions");
    }

    return response.data;
  }

  /**
   * Retrieves a single permission by ID
   *
   * Requires 'permissions:read' permission.
   *
   * @param {string} permissionId - Permission UUID
   * @returns {Promise<IPermission>} Permission details
   * @throws {Error} If permission not found or user lacks permission
   * @memberof PermissionApi
   *
   * @example
   * ```typescript
   * const permission = await permissionApi.findOne('550e8400-e29b-41d4-a716-446655440000');
   * console.log(`${permission.resource}:${permission.action}`);
   * ```
   */
  async findOne(permissionId: string): Promise<IPermission> {
    const response = await this.httpClient.get<IApiResponse<IPermission>>(
      `/permissions/${permissionId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch permission");
    }

    return response.data;
  }
}
