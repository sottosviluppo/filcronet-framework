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
import { TokenStorage } from "../storage";
import { IAuthHttpClient } from "../interfaces";

/**
 * Authentication store
 * Manages authentication state, token refresh, and user data
 *
 * Core responsibilities:
 * - User authentication state (login, logout, register)
 * - Token management with automatic refresh
 * - Session restoration from HttpOnly cookies
 * - User profile and permissions access
 *
 * @export
 * @function useAuthStore
 *
 * @example
 * ```typescript
 * // In main.ts - Initialize with plugin
 * import { createAuth } from '@sottosviluppo/auth-frontend';
 *
 * app.use(createAuth({
 *   apiBaseUrl: 'http://localhost:3000',
 *   apiVersion: 'v1',
 * }));
 *
 * // In components - Use the store
 * import { useAuthStore } from '@sottosviluppo/auth-frontend';
 *
 * const authStore = useAuthStore();
 *
 * // Login
 * await authStore.login({ email: 'user@example.com', password: 'password' });
 *
 * // Check authentication
 * if (authStore.isAuthenticated) {
 *   console.log(`Welcome ${authStore.userName}`);
 * }
 *
 * // Logout
 * await authStore.logout();
 * ```
 */
export const useAuthStore = defineStore("filcronet-auth", () => {
  // ===== STATE =====

  /** Current authenticated user or null */
  const user = ref<IUser | null>(null);

  /** Whether user is currently authenticated */
  const isAuthenticated = ref<boolean>(false);

  /** Loading state for async operations */
  const isLoading = ref<boolean>(false);

  /** Error message from last failed operation */
  const error = ref<string | null>(null);

  /** Whether the store has been initialized */
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
   *
   * @returns {string | null} Display name or null if not authenticated
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
   * User's initials for avatar display
   *
   * @returns {string | null} Two-character initials or null if not authenticated
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
   * User's permissions flattened from all roles
   *
   * @returns {string[]} Array of permission strings in 'resource:action' format
   */
  const userPermissions = computed(() => {
    if (!user.value || !user.value.roles) return [];

    return user.value.roles
      .flatMap((role) => role.permissions || [])
      .map((permission) => `${permission.resource}:${permission.action}`);
  });

  /**
   * User's role names
   *
   * @returns {string[]} Array of role names
   */
  const userRoles = computed(() => {
    if (!user.value || !user.value.roles) return [];
    return user.value.roles.map((role) => role.name);
  });

  // ===== ACTIONS =====

  /**
   * Gets current auth configuration
   *
   * @returns {AuthConfig | null} Current configuration or null if not initialized
   * @memberof useAuthStore
   */
  function getConfig(): AuthConfig | null {
    return config || null;
  }

  /**
   * Initializes auth store with configuration
   *
   * Must be called before using the store. Typically called by the createAuth plugin.
   * Sets up HTTP client, storage, and token refresh mechanisms.
   *
   * @param {AuthConfig} authConfig - Authentication configuration
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * // Usually called automatically by plugin, but can be called manually:
   * const authStore = useAuthStore();
   * authStore.initialize({
   *   apiBaseUrl: 'http://localhost:3000',
   *   apiVersion: 'v1',
   *   autoRefreshToken: true,
   * });
   * ```
   */
  function initialize(authConfig: AuthConfig): void {
    config = authConfig;

    // Create HTTP client
    const baseURL = `${config.apiBaseUrl}/${config.apiVersion}`;
    httpClient = config.httpClient || new AuthHttpClient(baseURL);

    // Create storage
    storage = config.storage || new TokenStorage();

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

      if (
        isInitialized.value &&
        config.redirectOnUnauth &&
        typeof window !== "undefined"
      ) {
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
   * Restores session from HttpOnly refresh token cookie
   *
   * Call this on app startup to check if user has a valid session.
   * The refresh token is stored in an HttpOnly cookie by the backend,
   * so this will work even after page refresh.
   *
   * @returns {Promise<boolean>} True if session was successfully restored
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * // In App.vue or router guard
   * const authStore = useAuthStore();
   *
   * onMounted(async () => {
   *   const wasRestored = await authStore.restoreSession();
   *   if (!wasRestored) {
   *     router.push('/login');
   *   }
   * });
   * ```
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
   * Waits for initialization to complete
   *
   * Ensures restoreSession is called only once even if called multiple times.
   * Useful in router guards to wait for auth state to be determined.
   *
   * @returns {Promise<void>}
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * // In router guard
   * router.beforeEach(async (to, from, next) => {
   *   const authStore = useAuthStore();
   *   await authStore.waitForInit();
   *
   *   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
   *     next('/login');
   *   } else {
   *     next();
   *   }
   * });
   * ```
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
   * Registers a new user
   *
   * @param {RegisterData} data - Registration data
   * @returns {Promise<IUser>} Registered and authenticated user
   * @throws {Error} If registration fails
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authStore.register({
   *     email: 'newuser@example.com',
   *     password: 'SecureP@ss123!',
   *     firstName: 'John',
   *     lastName: 'Doe',
   *   });
   *   console.log(`Welcome ${user.email}!`);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   * ```
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
   * Authenticates user with credentials
   *
   * @param {LoginCredentials} credentials - Email and password
   * @returns {Promise<IUser>} Authenticated user
   * @throws {Error} If login fails (invalid credentials, account suspended, etc.)
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authStore.login({
   *     email: 'user@example.com',
   *     password: 'password123',
   *   });
   *   router.push('/dashboard');
   * } catch (error) {
   *   toast.error(error.message);
   * }
   * ```
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
   * Logs out the current user
   *
   * Clears all authentication data including the HttpOnly refresh token cookie.
   * Redirects to login page if configured.
   *
   * @returns {Promise<void>}
   * @throws {Error} If logout API call fails (local state is still cleared)
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * async function handleLogout() {
   *   try {
   *     await authStore.logout();
   *     // Redirect happens automatically if configured
   *   } catch (error) {
   *     // Error during API call, but user is still logged out locally
   *     console.error('Logout error:', error);
   *   }
   * }
   * ```
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
   * Fetches current user profile from server
   *
   * Updates local user state with fresh data from the server.
   * Useful after profile updates or to verify authentication.
   *
   * @returns {Promise<IUser>} Updated user data
   * @throws {Error} If fetch fails or user is not authenticated
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * // After updating profile elsewhere
   * await authStore.fetchCurrentUser();
   * console.log('Updated user:', authStore.user);
   * ```
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
   * Manually refreshes access token
   *
   * Usually not needed as auto-refresh handles this automatically.
   * Use when you need to force a token refresh.
   *
   * @returns {Promise<void>}
   * @throws {Error} If refresh fails
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
   * Clears error state
   *
   * @memberof useAuthStore
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Gets HTTP client instance for custom API calls
   *
   * Returns the configured HTTP client with authentication already set up.
   * Useful for making authenticated requests to custom endpoints.
   *
   * @returns {IAuthHttpClient} Configured HTTP client
   * @memberof useAuthStore
   *
   * @example
   * ```typescript
   * const httpClient = authStore.getHttpClient();
   *
   * // Make authenticated request to custom endpoint
   * const data = await httpClient.get('/api/custom-endpoint');
   * ```
   */
  function getHttpClient(): IAuthHttpClient {
    return httpClient;
  }

  /**
   * Gets Auth API instance for direct access
   *
   * Returns the AuthApi instance for direct access to auth endpoints.
   *
   * @returns {AuthApi} Auth API instance
   * @memberof useAuthStore
   */
  function getAuthApi(): AuthApi {
    return authApi;
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Sets up token refresh scheduler
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
   * Clears all authentication state
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
