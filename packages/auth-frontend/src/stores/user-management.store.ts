import { defineStore } from "pinia";
import { ref } from "vue";
import {
  UserApi,
  type CreateUserData,
  type UpdateUserData,
  type CreateUserResponse,
  type CreateUserWithInvitationResponse,
} from "../api";
import { IPagination, IPaginationParams, IUser } from "@sottosviluppo/core";
import { IHttpClient } from "@sottosviluppo/frontend-core";

/**
 * User management store
 * Handles user CRUD operations (admin only)
 *
 * @export
 * @function useUserManagementStore
 */
export const useUserManagementStore = defineStore(
  "filcronet-user-management",
  () => {
    // ===== STATE =====
    const users = ref<IUser[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const pagination = ref<IPagination | null>(null);

    // ===== PRIVATE INSTANCES =====
    let userApi: UserApi;

    // ===== ACTIONS =====

    /**
     * Initialize user management store
     *
     * @param {IHttpClient} httpClient - HTTP client instance
     * @memberof useUserManagementStore
     */
    function initialize(httpClient: IHttpClient): void {
      userApi = new UserApi(httpClient);
    }

    /**
     * Fetch paginated list of users
     *
     * @param {IPaginationParams} [params] - Pagination parameters
     * @returns {Promise<void>}
     * @memberof useUserManagementStore
     */
    async function fetchUsers(params?: IPaginationParams): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await userApi.findAll(params);

        users.value = response.data || [];
        pagination.value = response.pagination;
      } catch (err: any) {
        error.value = err.message || "Failed to fetch users";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Get single user by ID
     *
     * @param {string} userId - User UUID
     * @returns {Promise<IUser>}
     * @memberof useUserManagementStore
     */
    async function getUser(userId: string): Promise<IUser> {
      isLoading.value = true;
      error.value = null;

      try {
        const user = await userApi.findOne(userId);
        return user;
      } catch (err: any) {
        error.value = err.message || "Failed to fetch user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Create a new user
     *
     * @param {CreateUserData} data - User data
     * @returns {Promise<CreateUserResponse | CreateUserWithInvitationResponse>}
     * @memberof useUserManagementStore
     */
    async function createUser(
      data: CreateUserData
    ): Promise<CreateUserResponse | CreateUserWithInvitationResponse> {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await userApi.create(data);

        // Add to local list
        users.value.push(response.user);

        return response;
      } catch (err: any) {
        error.value = err.message || "Failed to create user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Update user
     *
     * @param {string} userId - User UUID
     * @param {UpdateUserData} data - Update data
     * @returns {Promise<IUser>}
     * @memberof useUserManagementStore
     */
    async function updateUser(
      userId: string,
      data: UpdateUserData
    ): Promise<IUser> {
      isLoading.value = true;
      error.value = null;

      try {
        const updatedUser = await userApi.update(userId, data);

        // Update in local list
        const index = users.value.findIndex((u) => u.id === userId);
        if (index !== -1) {
          users.value[index] = updatedUser;
        }

        return updatedUser;
      } catch (err: any) {
        error.value = err.message || "Failed to update user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Delete user
     *
     * @param {string} userId - User UUID
     * @returns {Promise<void>}
     * @memberof useUserManagementStore
     */
    async function deleteUser(userId: string): Promise<void> {
      isLoading.value = true;
      error.value = null;

      try {
        await userApi.delete(userId);

        // Remove from local list
        users.value = users.value.filter((u) => u.id !== userId);
      } catch (err: any) {
        error.value = err.message || "Failed to delete user";
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Clear error state
     *
     * @memberof useUserManagementStore
     */
    function clearError(): void {
      error.value = null;
    }

    return {
      // State
      users,
      isLoading,
      error,
      pagination,

      // Actions
      initialize,
      fetchUsers,
      getUser,
      createUser,
      updateUser,
      deleteUser,
      clearError,
    };
  }
);
