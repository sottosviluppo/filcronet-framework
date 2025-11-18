import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores";
import type { LoginCredentials, RegisterData } from "../types";

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
  const { user, isAuthenticated, isLoading, error, userName, userInitials } =
    storeToRefs(authStore);

  /**
   * Logs in user with credentials
   *
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<void>}
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    await authStore.login(credentials);
  }

  /**
   * Registers a new user
   *
   * @param {RegisterData} data - User registration data
   * @returns {Promise<void>}
   */
  async function register(data: RegisterData): Promise<void> {
    await authStore.register(data);
  }

  /**
   * Logs out current user
   *
   * @returns {Promise<void>}
   */
  async function logout(): Promise<void> {
    await authStore.logout();
  }

  /**
   * Fetches current user profile
   *
   * @returns {Promise<void>}
   */
  async function fetchCurrentUser(): Promise<void> {
    await authStore.fetchCurrentUser();
  }

  /**
   * Refreshes authentication token
   *
   * @returns {Promise<void>}
   */
  async function refreshToken(): Promise<void> {
    await authStore.refreshToken();
  }

  /**
   * Clears error state
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

    // Methods
    login,
    register,
    logout,
    fetchCurrentUser,
    refreshToken,
    clearError,
  };
}
