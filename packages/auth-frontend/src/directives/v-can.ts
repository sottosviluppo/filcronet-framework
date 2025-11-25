import type { Directive } from "vue";
import { useAuthStore } from "../stores";
import type { PermissionString } from "../composables/permissions/usePermissions";

/**
 * Vue directive to show/hide elements based on permissions
 *
 * @export
 * @const vCan
 *
 * @example
 * ```vue
 * <template>
 *   <!-- Show only if user has permission -->
 *   <button v-can="'users:create'">Create User</button>
 *
 *   <!-- Show if user has ALL permissions -->
 *   <button v-can="['users:update', 'users:delete']">Edit & Delete</button>
 *
 *   <!-- Show if user has ANY permission -->
 *   <button v-can:any="['users:update', 'users:delete']">Edit or Delete</button>
 * </template>
 * ```
 */
export const vCan: Directive<
  HTMLElement,
  PermissionString | PermissionString[]
> = {
  mounted(el, binding) {
    checkPermission(el, binding);
  },

  updated(el, binding) {
    checkPermission(el, binding);
  },
};

/**
 * Check permission and show/hide element
 *
 * @private
 */
function checkPermission(
  el: HTMLElement,
  binding: {
    value: PermissionString | PermissionString[];
    arg?: string;
  }
) {
  const authStore = useAuthStore();
  const userPermissions = authStore.userPermissions || [];

  const requiredPermissions = Array.isArray(binding.value)
    ? binding.value
    : [binding.value];

  let hasPermission: boolean;

  if (binding.arg === "any") {
    // v-can:any - user needs ANY of the permissions
    hasPermission = requiredPermissions.some((p) =>
      userPermissions.includes(p)
    );
  } else {
    // v-can - user needs ALL permissions
    hasPermission = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );
  }

  // Show/hide element
  if (hasPermission) {
    el.style.removeProperty("display");
  } else {
    el.style.display = "none";
  }
}
