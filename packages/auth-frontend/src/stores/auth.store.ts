import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { AuthConfig } from "../types";
import {
  AuthApi,
  AuthHttpClient,
  type LoginCredentials,
  type RegisterData,
} from "../api";
import { IUser } from "@sottosviluppo/core";
import { ITokenStorage } from "../interfaces/token-storage.interface";
import { TokenRefreshScheduler } from "../utils";
import { MemoryTokenStorage } from "../storage/memory-token-storage";
import { IAuthHttpClient } from "../interfaces";

/**
 * Authentication store
 * Manages authentication state, token refresh, and user data
 *
 * @export
 * @function useAuthStore
 *
 * @example
 * ```typescript
 * const authStore = useAuthStore();
 *
 * // Initialize in main.ts or plugin
 * authStore.initialize(config);
 *
 * // Use in components
 * await authStore.login({ email, password });
 * await authStore.logout();
 * ```
 */
export const useAuthStore = defineStore("filcronet-auth", () => {
  // ===== STATE =====
  const user = ref<IUser | null>(null);
  const isAuthenticated = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const isInitialized = ref<boolean>(false);

  // ===== PRIVATE INSTANCES =====
  let httpClient: IAuthHttpClient;
  let storage: ITokenStorage;
  let authApi: AuthApi;
  let tokenScheduler: TokenRefreshScheduler | null = null;
  let config: AuthConfig;
  let initPromise: Promise<boolean> | null = null;

  // ===== COMPUTED =====

  /**
   * User's display name (firstName lastName or username or email)
   */
  const userName = computed(() => {
    if (!user.value) return null;

    const { firstName, lastName, username, email } = user.value;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    return username || email;
  });

  /**
   * User's initials for avatar
   */
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

  /**
   * User's permissions (flattened from roles)
   */
  const userPermissions = computed(() => {
    if (!user.value || !user.value.roles) return [];

    return user.value.roles
      .flatMap((role) => role.permissions || [])
      .map((permission) => `${permission.resource}:${permission.action}`);
  });

  /**
   * User's role names
   */
  const userRoles = computed(() => {
    if (!user.value || !user.value.roles) return [];
    return user.value.roles.map((role) => role.name);
  });

  // ===== ACTIONS =====

  /**
   * Get current auth configuration
   * @returns {AuthConfig | null}
   */
  function getConfig(): AuthConfig | null {
    return config || null;
  }

  /**
   * Initialize auth store with configuration
   * MUST be called before using the store (typically in plugin or main.ts)
   *
   * @param {AuthConfig} authConfig - Authentication configuration
   * @memberof useAuthStore
   */
  function initialize(authConfig: AuthConfig): void {
    config = authConfig;

    // Create HTTP client
    const baseURL = `${config.apiBaseUrl}/${config.apiVersion}`;
    httpClient = config.httpClient || new AuthHttpClient(baseURL);

    // Create storage
    storage = config.storage || new MemoryTokenStorage();

    // Create Auth API
    authApi = new AuthApi(httpClient, storage);

    // Setup auto-refresh on 401
    httpClient.setupAutoRefresh(async () => {
      const response = await authApi.refreshToken();

      // Update user data after refresh
      user.value = response.user;

      // Schedule next refresh
      if (config.autoRefreshToken !== false && tokenScheduler) {
        tokenScheduler.schedule(response.accessToken);
      }

      return response.accessToken;
    });

    // Setup unauthorized callback (when refresh fails)
    httpClient.onUnauthorized(() => {
      clearAuthState();

      if (config.redirectOnUnauth && typeof window !== "undefined") {
        window.location.href = config.redirectOnUnauth;
      }
    });

    // Restore session if token exists in memory (SPA navigation)
    const savedToken = storage.getToken();
    const savedUser = storage.getUser<IUser>();

    if (savedToken && savedUser) {
      user.value = savedUser;
      isAuthenticated.value = true;
      httpClient.setAuthToken(savedToken);

      // Setup token refresh scheduler if enabled
      if (config.autoRefreshToken !== false) {
        setupTokenRefresh(savedToken);
      }

      isInitialized.value = true;
    }
  }

  /**
   * Restore session from HttpOnly refresh token cookie
   * Call this on app startup to check if user has a valid session
   *
   * @returns {Promise<boolean>} True if session was restored
   * @memberof useAuthStore
   */
  async function restoreSession(): Promise<boolean> {
    // Already authenticated (from memory storage)
    if (isAuthenticated.value) {
      isInitialized.value = true;
      return true;
    }

    try {
      // Try to refresh token using HttpOnly cookie
      const response = await authApi.refreshToken();

      user.value = response.user;
      isAuthenticated.value = true;

      if (config.autoRefreshToken !== false) {
        setupTokenRefresh(response.accessToken);
      }

      isInitialized.value = true;
      return true;
    } catch {
      // No valid session - this is expected for non-authenticated users
      clearAuthState();
      isInitialized.value = true;
      return false;
    }
  }

  /**
   * Wait for initialization to complete
   * Ensures restoreSession is called only once even if called multiple times
   *
   * @returns {Promise<void>}
   * @memberof useAuthStore
   */
  async function waitForInit(): Promise<void> {
    if (isInitialized.value) return;

    // Prevent multiple concurrent restoreSession calls
    if (!initPromise) {
      initPromise = restoreSession();
    }

    await initPromise;
  }

  /**
   * Register a new user
   *
   * @param {RegisterData} data - Registration data
   * @returns {Promise<IUser>} Registered user
   * @memberof useAuthStore
   */
  async function register(data: RegisterData): Promise<IUser> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.register(data);

      user.value = response.user;
      isAuthenticated.value = true;

      // Setup token refresh scheduler if enabled
      if (config.autoRefreshToken !== false) {
        setupTokenRefresh(response.accessToken);
      }

      return response.user;
    } catch (err: any) {
      error.value = err.message || "Registration failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Login with credentials
   *
   * @param {LoginCredentials} credentials - Login credentials
   * @returns {Promise<IUser>} Authenticated user
   * @memberof useAuthStore
   */
  async function login(credentials: LoginCredentials): Promise<IUser> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(credentials);

      user.value = response.user;
      isAuthenticated.value = true;

      // Setup token refresh scheduler if enabled
      if (config.autoRefreshToken !== false) {
        setupTokenRefresh(response.accessToken);
      }

      return response.user;
    } catch (err: any) {
      error.value = err.message || "Login failed";
      clearAuthState();
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout current user
   * Clears tokens (including HttpOnly cookie) and local state
   *
   * @returns {Promise<void>}
   * @memberof useAuthStore
   */
  async function logout(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.logout();
    } catch (err: any) {
      error.value = err.message || "Logout failed";
      throw err;
    } finally {
      clearAuthState();
      isLoading.value = false;

      if (config?.redirectOnUnauth && typeof window !== "undefined") {
        window.location.href = config.redirectOnUnauth;
      }
    }
  }

  /**
   * Fetch current user profile from server
   * Updates local user state with fresh data
   *
   * @returns {Promise<IUser>}
   * @memberof useAuthStore
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
      error.value = err.message || "Failed to fetch user";

      // Clear auth state if token is invalid
      if (err.response?.status === 401) {
        clearAuthState();
      }

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Manually refresh access token
   * (Usually not needed, auto-refresh handles this)
   *
   * @returns {Promise<void>}
   * @memberof useAuthStore
   */
  async function refreshToken(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.refreshToken();

      user.value = response.user;

      // Schedule next refresh
      if (config.autoRefreshToken !== false && tokenScheduler) {
        tokenScheduler.schedule(response.accessToken);
      }
    } catch (err: any) {
      error.value = err.message || "Token refresh failed";
      clearAuthState();
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clear error state
   *
   * @memberof useAuthStore
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Get HTTP client instance for custom API calls
   *
   * @returns {IAuthHttpClient}
   * @memberof useAuthStore
   */
  function getHttpClient(): IAuthHttpClient {
    return httpClient;
  }

  /**
   * Get Auth API instance for direct access
   *
   * @returns {AuthApi}
   * @memberof useAuthStore
   */
  function getAuthApi(): AuthApi {
    return authApi;
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Setup token refresh scheduler
   *
   * @private
   * @param {string} accessToken - JWT access token
   */
  function setupTokenRefresh(accessToken: string): void {
    if (tokenScheduler) {
      tokenScheduler.cancel();
    }

    const refreshBeforeExpiry = config.refreshBeforeExpiry || 60000; // 1 minute default

    tokenScheduler = new TokenRefreshScheduler(async () => {
      try {
        const response = await authApi.refreshToken();
        user.value = response.user;
        return response.accessToken;
      } catch (error) {
        throw error;
      }
    }, refreshBeforeExpiry);

    tokenScheduler.schedule(accessToken);
  }

  /**
   * Clear authentication state
   *
   * @private
   */
  function clearAuthState(): void {
    user.value = null;
    isAuthenticated.value = false;
    storage.clear();
    httpClient.setAuthToken(null);

    if (tokenScheduler) {
      tokenScheduler.cancel();
      tokenScheduler = null;
    }
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,

    // Computed
    userName,
    userInitials,
    userPermissions,
    userRoles,

    // Actions
    getConfig,
    initialize,
    restoreSession,
    waitForInit,
    register,
    login,
    logout,
    fetchCurrentUser,
    refreshToken,
    clearError,
    getHttpClient,
    getAuthApi,
  };
});
