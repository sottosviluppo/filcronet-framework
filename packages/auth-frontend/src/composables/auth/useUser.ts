import { computed } from "vue";
import { useAuth } from "./useAuth";

/**
 * User composable
 * Provides computed properties and utilities for current user
 *
 * @export
 * @function useUser
 *
 * @example
 * ```vue
 * <script setup>
 * import { useUser } from '@filcronet/auth-frontend';
 *
 * const { user, isActive, hasVerifiedEmail, fullName } = useUser();
 * </script>
 *
 * <template>
 *   <div v-if="user">
 *     <h1>{{ fullName }}</h1>
 *     <p v-if="!hasVerifiedEmail">Please verify your email</p>
 *   </div>
 * </template>
 * ```
 */
export function useUser() {
  const { user } = useAuth();

  /**
   * User's full name (firstName + lastName)
   * Falls back to username or email if name not available
   */
  const fullName = computed(() => {
    if (!user.value) return null;

    const { firstName, lastName, username, email } = user.value;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) return firstName;
    if (lastName) return lastName;
    if (username) return username;

    return email;
  });

  /**
   * User's display name (short version)
   * First name if available, otherwise username or email
   */
  const displayName = computed(() => {
    if (!user.value) return null;

    const { firstName, username, email } = user.value;

    return firstName || username || email;
  });

  /**
   * User's email address
   */
  const email = computed(() => user.value?.email || null);

  /**
   * Whether user's email is verified
   */
  const hasVerifiedEmail = computed(() => user.value?.emailVerified || false);

  /**
   * User's current status
   */
  const status = computed(() => user.value?.status || null);

  /**
   * Whether user account is active
   */
  const isActive = computed(() => status.value === "active");

  /**
   * Whether user account is suspended
   */
  const isSuspended = computed(() => status.value === "suspended");

  /**
   * Whether user account is pending verification
   */
  const isPendingVerification = computed(
    () => status.value === "pending_verification"
  );

  /**
   * User's roles
   */
  const roles = computed(() => user.value?.roles || []);

  /**
   * User's role names
   */
  const roleNames = computed(() => roles.value.map((role) => role.name));

  /**
   * Check if user has a specific role
   *
   * @param {string} roleName - Role name to check
   * @returns {boolean}
   */
  function hasRole(roleName: string): boolean {
    return roleNames.value.includes(roleName);
  }

  /**
   * Check if user has any of the specified roles
   *
   * @param {string[]} roleNames - Array of role names
   * @returns {boolean}
   */
  function hasAnyRole(roles: string[]): boolean {
    return roles.some((roleName) => hasRole(roleName));
  }

  /**
   * Check if user has all specified roles
   *
   * @param {string[]} roleNames - Array of role names
   * @returns {boolean}
   */
  function hasAllRoles(roles: string[]): boolean {
    return roles.every((roleName) => hasRole(roleName));
  }

  return {
    // Computed
    user,
    fullName,
    displayName,
    email,
    hasVerifiedEmail,
    status,
    isActive,
    isSuspended,
    isPendingVerification,
    roles,
    roleNames,

    // Methods
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}
