import { computed } from "vue";
import { useAuth } from "../auth/useAuth";

/**
 * Permission string type
 * Format: "resource:action"
 */
export type PermissionString = `${string}:${string}`;

/**
 * Permissions composable
 * Provides utilities for checking user permissions
 *
 * @export
 * @function usePermissions
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePermissions } from '@filcronet/auth-frontend';
 *
 * const { can, canAny, canAll } = usePermissions();
 * </script>
 *
 * <template>
 *   <button v-if="can('users:create')" @click="createUser">
 *     Create User
 *   </button>
 *
 *   <div v-if="canAny(['users:update', 'users:delete'])">
 *     <button>Edit</button>
 *     <button>Delete</button>
 *   </div>
 * </template>
 * ```
 */
export function usePermissions() {
  const { userPermissions } = useAuth();

  /**
   * All user permissions
   */
  const permissions = computed(() => userPermissions.value || []);

  /**
   * Check if user has a specific permission
   *
   * @param {PermissionString} permission - Permission to check (e.g., 'users:create')
   * @returns {boolean} True if user has the permission
   *
   * @example
   * ```typescript
   * if (can('users:create')) {
   *   // User can create users
   * }
   * ```
   */
  function can(permission: PermissionString): boolean {
    return permissions.value.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   *
   * @param {PermissionString[]} permissionList - Array of permissions
   * @returns {boolean} True if user has at least one permission
   *
   * @example
   * ```typescript
   * if (canAny(['users:update', 'users:delete'])) {
   *   // User can either update or delete users
   * }
   * ```
   */
  function canAny(permissionList: PermissionString[]): boolean {
    return permissionList.some((permission) => can(permission));
  }

  /**
   * Check if user has all specified permissions
   *
   * @param {PermissionString[]} permissionList - Array of permissions
   * @returns {boolean} True if user has all permissions
   *
   * @example
   * ```typescript
   * if (canAll(['users:create', 'users:update'])) {
   *   // User can both create and update users
   * }
   * ```
   */
  function canAll(permissionList: PermissionString[]): boolean {
    return permissionList.every((permission) => can(permission));
  }

  /**
   * Check if user can manage a resource (has 'resource:manage' permission)
   *
   * @param {string} resource - Resource name (e.g., 'users', 'products')
   * @returns {boolean} True if user can manage the resource
   *
   * @example
   * ```typescript
   * if (canManage('users')) {
   *   // User has full access to users
   * }
   * ```
   */
  function canManage(resource: string): boolean {
    return can(`${resource}:manage` as PermissionString);
  }

  return {
    // Computed
    permissions,

    // Methods
    can,
    canAny,
    canAll,
    canManage,
  };
}
