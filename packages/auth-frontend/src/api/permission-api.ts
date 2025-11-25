import { IApiResponse, IPermission } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Permission API client
 *
 * @export
 * @class PermissionApi
 */
export class PermissionApi {
  constructor(private httpClient: IHttpClient) {}

  /**
   * Get all available permissions
   *
   * @returns {Promise<IPermission[]>}
   * @memberof PermissionApi
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
   * Get single permission by ID
   *
   * @param {string} permissionId - Permission UUID
   * @returns {Promise<IPermission>}
   * @memberof PermissionApi
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
