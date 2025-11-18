import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { IUser } from "@filcronet/core";
import type { LoginCredentials, RegisterData, AuthConfig } from "../types";
import { AuthApi } from "../api";
import { TokenStorage } from "../utils";

/**
 * Authentication store
 * Manages authentication state using Pinia
 *
 * @export
 * @function useAuthStore
 */
export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<IUser | null>(null);
  const isAuthenticated = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Private variables
  let authApi: AuthApi;
  let tokenStorage: TokenStorage;

  /**
   * Initializes the auth store with configuration
   * Must be called before using the store
   *
   * @param {AuthConfig} config - Authentication configuration
   */
  function initialize(config: AuthConfig): void {
    authApi = new AuthApi(config);
    tokenStorage = new TokenStorage(config.storage);

    // Check if user is already logged in
    const savedUser = tokenStorage.getUser();
    const savedToken = tokenStorage.getToken();

    if (savedUser && savedToken) {
      user.value = savedUser;
      isAuthenticated.value = true;
    }
  }

  /**
   * Logs in user with credentials
   *
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<IUser>} Authenticated user
   * @throws {Error} If login fails
   */
  async function login(credentials: LoginCredentials): Promise<IUser> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(credentials);

      user.value = response.user;
      isAuthenticated.value = true;

      return response.user;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Registers a new user
   *
   * @param {RegisterData} data - User registration data
   * @returns {Promise<IUser>} Registered user
   * @throws {Error} If registration fails
   */
  async function register(data: RegisterData): Promise<IUser> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.register(data);

      user.value = response.user;
      isAuthenticated.value = true;

      return response.user;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Registration failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logs out current user
   * Clears authentication state and tokens
   *
   * @returns {Promise<void>}
   */
  async function logout(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.logout();

      user.value = null;
      isAuthenticated.value = false;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Logout failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetches current user profile from server
   * Updates local user state with fresh data
   *
   * @returns {Promise<IUser>} Current user
   * @throws {Error} If fetch fails
   */
  async function fetchCurrentUser(): Promise<IUser> {
    isLoading.value = true;
    error.value = null;

    try {
      const fetchedUser = await authApi.getCurrentUser();

      user.value = fetchedUser;
      isAuthenticated.value = true;

      return fetchedUser;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Failed to fetch user";

      // Clear auth state if token is invalid
      if (err.response?.status === 401) {
        user.value = null;
        isAuthenticated.value = false;
      }

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Refreshes authentication token
   *
   * @returns {Promise<void>}
   */
  async function refreshToken(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.refreshToken();
    } catch (err: any) {
      error.value = err.response?.data?.message || "Token refresh failed";

      // Clear auth state if refresh fails
      user.value = null;
      isAuthenticated.value = false;

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clears error state
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Gets the API client instance for custom requests
   *
   * @returns {import('axios').AxiosInstance}
   */
  function getApiClient() {
    return authApi.getClient();
  }

  // Computed properties
  const userName = computed(() => {
    if (!user.value) return null;

    const { firstName, lastName, username, email } = user.value;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    return username || email;
  });

  const userInitials = computed(() => {
    if (!user.value) return null;

    const { firstName, lastName, username, email } = user.value;

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (username) {
      return username.substring(0, 2).toUpperCase();
    }

    return email.substring(0, 2).toUpperCase();
  });

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Computed
    userName,
    userInitials,

    // Actions
    initialize,
    login,
    register,
    logout,
    fetchCurrentUser,
    refreshToken,
    clearError,
    getApiClient,
  };
});
