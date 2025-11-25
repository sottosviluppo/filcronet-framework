import { storeToRefs } from "pinia";
import { useAuthStore } from "../../stores";
import type { LoginCredentials, RegisterData } from "../../api";

/**
 * Authentication composable
 * Provides reactive access to authentication state and methods
 *
 * @export
 * @function useAuth
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAuth } from '@filcronet/auth-frontend';
 *
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * async function handleLogin() {
 *   await login({ email: 'user@example.com', password: 'password' });
 * }
 * </script>
 * ```
 */
export function useAuth() {
  const authStore = useAuthStore();

  // Extract reactive state
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    userName,
    userInitials,
    userPermissions,
    userRoles,
  } = storeToRefs(authStore);

  /**
   * Register a new user
   *
   * @param {RegisterData} data - Registration data
   * @returns {Promise<void>}
   */
  async function register(data: RegisterData): Promise<void> {
    await authStore.register(data);
  }

  /**
   * Login with credentials
   *
   * @param {LoginCredentials} credentials - Login credentials
   * @returns {Promise<void>}
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    await authStore.login(credentials);
  }

  /**
   * Logout current user
   *
   * @returns {Promise<void>}
   */
  async function logout(): Promise<void> {
    await authStore.logout();
  }

  /**
   * Fetch current user profile
   *
   * @returns {Promise<void>}
   */
  async function fetchCurrentUser(): Promise<void> {
    await authStore.fetchCurrentUser();
  }

  /**
   * Manually refresh access token
   *
   * @returns {Promise<void>}
   */
  async function refreshToken(): Promise<void> {
    await authStore.refreshToken();
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    authStore.clearError();
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    userName,
    userInitials,
    userPermissions,
    userRoles,

    // Methods
    register,
    login,
    logout,
    fetchCurrentUser,
    refreshToken,
    clearError,
  };
}
