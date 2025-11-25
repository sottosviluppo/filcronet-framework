import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { RoleApi, type CreateRoleData, type UpdateRoleData } from "../api";
import { IRole } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * Role management store
 * Handles role CRUD operations (admin only)
 *
 * @export
 * @function useRoleManagementStore
 */
export const useRoleManagementStore = defineStore(
  "filcronet-role-management",
  () => {
    // ===== STATE =====
    const roles = ref<IRole[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // ===== PRIVATE INSTANCES =====
    let roleApi: RoleApi;

    // ===== COMPUTED =====

    /**
     * System roles (cannot be deleted)
     */
    const systemRoles = computed(() => {
      return roles.value.filter((role) => role.isSystem);
    });

    /**
     * Custom roles (can be modified/deleted)
     */
    const customRoles = computed(() => {
      return roles.value.filter((role) => !role.isSystem);
    });

    // ===== ACTIONS =====

    /**
     * Initialize role management store
     *
     * @param {IHttpClient} httpClient - HTTP client instance
     * @memberof useRoleManagementStore
     */
    function initialize(httpClient: IHttpClient): void {
      roleApi = new RoleApi(httpClient);
    }

    /**
     * Fetch all roles
     *
     * @returns {Promise<void>}
     * @memberof useRoleManagementStore
     */
    async function fetchRoles(): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const fetchedRoles = await roleApi.findAll();
        roles.value = fetchedRoles;
      } catch (err: any) {
        error.value = err.message || "Failed to fetch roles";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Get single role by ID
     *
     * @param {string} roleId - Role UUID
     * @returns {Promise<IRole>}
     * @memberof useRoleManagementStore
     */
    async function getRole(roleId: string): Promise<IRole> {
      isLoading.value = true;
      error.value = null;

      try {
        const role = await roleApi.findOne(roleId);
        return role;
      } catch (err: any) {
        error.value = err.message || "Failed to fetch role";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Create a new role
     *
     * @param {CreateRoleData} data - Role data
     * @returns {Promise<IRole>}
     * @memberof useRoleManagementStore
     */
    async function createRole(data: CreateRoleData): Promise<IRole> {
      isLoading.value = true;
      error.value = null;

      try {
        const newRole = await roleApi.create(data);

        // Add to local list
        roles.value.push(newRole);

        return newRole;
      } catch (err: any) {
        error.value = err.message || "Failed to create role";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Update role
     *
     * @param {string} roleId - Role UUID
     * @param {UpdateRoleData} data - Update data
     * @returns {Promise<IRole>}
     * @memberof useRoleManagementStore
     */
    async function updateRole(
      roleId: string,
      data: UpdateRoleData
    ): Promise<IRole> {
      isLoading.value = true;
      error.value = null;

      try {
        const updatedRole = await roleApi.update(roleId, data);

        // Update in local list
        const index = roles.value.findIndex((r) => r.id === roleId);
        if (index !== -1) {
          roles.value[index] = updatedRole;
        }

        return updatedRole;
      } catch (err: any) {
        error.value = err.message || "Failed to update role";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Delete role
     *
     * @param {string} roleId - Role UUID
     * @returns {Promise<void>}
     * @memberof useRoleManagementStore
     */
    async function deleteRole(roleId: string): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        await roleApi.delete(roleId);

        // Remove from local list
        roles.value = roles.value.filter((r) => r.id !== roleId);
      } catch (err: any) {
        error.value = err.message || "Failed to delete role";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Clear error state
     *
     * @memberof useRoleManagementStore
     */
    function clearError(): void {
      error.value = null;
    }

    return {
      // State
      roles,
      isLoading,
      error,

      // Computed
      systemRoles,
      customRoles,

      // Actions
      initialize,
      fetchRoles,
      getRole,
      createRole,
      updateRole,
      deleteRole,
      clearError,
    };
  }
);
