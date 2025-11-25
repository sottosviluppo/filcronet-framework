import type { Directive } from "vue";
import { useAuthStore } from "../stores";

/**
 * Vue directive to show/hide elements based on roles
 *
 * @export
 * @const vRole
 *
 * @example
 * ```vue
 * <template>
 *   <!-- Show only if user has role -->
 *   <div v-role="'admin'">Admin Panel</div>
 *
 *   <!-- Show if user has ALL roles -->
 *   <div v-role="['admin', 'editor']">Admin + Editor Content</div>
 *
 *   <!-- Show if user has ANY role -->
 *   <div v-role:any="['admin', 'editor']">Admin or Editor Content</div>
 * </template>
 * ```
 */
export const vRole: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    checkRole(el, binding);
  },

  updated(el, binding) {
    checkRole(el, binding);
  },
};

/**
 * Check role and show/hide element
 *
 * @private
 */
function checkRole(
  el: HTMLElement,
  binding: {
    value: string | string[];
    arg?: string;
  }
) {
  const authStore = useAuthStore();
  const userRoles = authStore.userRoles || [];

  const requiredRoles = Array.isArray(binding.value)
    ? binding.value
    : [binding.value];

  let hasRole: boolean;

  if (binding.arg === "any") {
    // v-role:any - user needs ANY role
    hasRole = requiredRoles.some((role) => userRoles.includes(role));
  } else {
    // v-role - user needs ALL roles
    hasRole = requiredRoles.every((role) => userRoles.includes(role));
  }

  // Show/hide element
  if (hasRole) {
    el.style.removeProperty("display");
  } else {
    el.style.display = "none";
  }
}
