import { storeToRefs } from "pinia";
import { useRoleManagementStore } from "../../stores";
import type { CreateRoleData, UpdateRoleData } from "../../api";

/**
 * Role management composable
 * Admin operations for managing roles
 *
 * @export
 * @function useRoleManagement
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRoleManagement } from '@filcronet/auth-frontend';
 *
 * const { roles, systemRoles, customRoles, fetchRoles, createRole } = useRoleManagement();
 *
 * onMounted(() => {
 *   fetchRoles();
 * });
 * </script>
 * ```
 */
export function useRoleManagement() {
  const store = useRoleManagementStore();

  const { roles, systemRoles, customRoles, isLoading, error } =
    storeToRefs(store);

  return {
    // State
    roles,
    systemRoles,
    customRoles,
    isLoading,
    error,

    // Methods
    fetchRoles: () => store.fetchRoles(),
    getRole: (roleId: string) => store.getRole(roleId),
    createRole: (data: CreateRoleData) => store.createRole(data),
    updateRole: (roleId: string, data: UpdateRoleData) =>
      store.updateRole(roleId, data),
    deleteRole: (roleId: string) => store.deleteRole(roleId),
    clearError: () => store.clearError(),
  };
}
