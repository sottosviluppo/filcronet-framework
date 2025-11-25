// src/composables/admin/useUserManagement.ts

import { storeToRefs } from "pinia";
import { useUserManagementStore } from "../../stores";
import type { CreateUserData, UpdateUserData } from "../../api";
import { IPaginationParams } from "@sottosviluppo/core";

/**
 * User management composable
 * Admin operations for managing users
 *
 * @export
 * @function useUserManagement
 *
 * @example
 * ```vue
 * <script setup>
 * import { useUserManagement } from '@filcronet/auth-frontend';
 *
 * const { users, fetchUsers, createUser, deleteUser } = useUserManagement();
 *
 * onMounted(() => {
 *   fetchUsers({ page: 1, limit: 20 });
 * });
 * </script>
 * ```
 */
export function useUserManagement() {
  const store = useUserManagementStore();

  const { users, isLoading, error, pagination } = storeToRefs(store);

  return {
    // State
    users,
    isLoading,
    error,
    pagination,

    // Methods
    fetchUsers: (params?: IPaginationParams) => store.fetchUsers(params),
    getUser: (userId: string) => store.getUser(userId),
    createUser: (data: CreateUserData) => store.createUser(data),
    updateUser: (userId: string, data: UpdateUserData) =>
      store.updateUser(userId, data),
    deleteUser: (userId: string) => store.deleteUser(userId),
    clearError: () => store.clearError(),
  };
}
