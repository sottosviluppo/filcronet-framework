import type { App } from "vue";
import { useAuthStore } from "./stores";
import type { AuthConfig } from "./types";

/**
 * Creates and configures the Filcronet Authentication plugin for Vue 3
 *
 * This plugin initializes the authentication system with the provided configuration.
 * It must be installed after Pinia in your Vue application.
 *
 * Features enabled by this plugin:
 * - Authentication store with reactive state
 * - Automatic token refresh before expiry
 * - Session restoration from HttpOnly cookies
 * - Configurable redirects for auth flows
 *
 * @export
 * @param {AuthConfig} config - Authentication configuration (required)
 * @returns {Object} Vue plugin with install method
 *
 * @example
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue';
 * import { createPinia } from 'pinia';
 * import { createAuth } from '@sottosviluppo/auth-frontend';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 * const pinia = createPinia();
 *
 * // Install Pinia first (required)
 * app.use(pinia);
 *
 * // Install auth plugin with configuration
 * app.use(createAuth({
 *   apiBaseUrl: import.meta.env.VITE_API_URL,
 *   apiVersion: 'v1',
 *   redirectOnUnauth: '/login',
 *   redirectOnLogin: '/dashboard',
 *   redirectOnForbidden: '/forbidden',
 *   autoRefreshToken: true,
 *   refreshBeforeExpiry: 60000, // 1 minute before expiry
 * }));
 *
 * app.mount('#app');
 * ```
 *
 * @example
 * ```typescript
 * // With custom HTTP client and storage
 * import { createAuth } from '@sottosviluppo/auth-frontend';
 * import { CustomHttpClient } from './custom-http-client';
 * import { CustomStorage } from './custom-storage';
 *
 * app.use(createAuth({
 *   apiBaseUrl: 'https://api.example.com',
 *   apiVersion: 'v1',
 *   httpClient: new CustomHttpClient(),
 *   storage: new CustomStorage(),
 * }));
 * ```
 */
export function createAuth(config: AuthConfig) {
  return {
    /**
     * Vue plugin install method
     *
     * @param {App} app - Vue application instance
     */
    install(app: App) {
      // Validate required config
      if (!config.apiBaseUrl) {
        throw new Error(
          "[Filcronet Auth] apiBaseUrl is required in configuration"
        );
      }

      // Apply defaults for optional fields
      const finalConfig: AuthConfig = {
        apiBaseUrl: config.apiBaseUrl,
        apiVersion: config.apiVersion ?? "",
        apiPrefix: config.apiPrefix ?? "",
        httpClient: config.httpClient,
        storage: config.storage,
        redirectOnUnauth: config.redirectOnUnauth ?? "/login",
        redirectOnLogin: config.redirectOnLogin ?? "/",
        redirectOnForbidden: config.redirectOnForbidden ?? "/forbidden",
        autoRefreshToken: config.autoRefreshToken ?? true,
        refreshBeforeExpiry: config.refreshBeforeExpiry ?? 60000,
      };

      // Initialize auth store with configuration
      const authStore = useAuthStore();
      authStore.initialize(finalConfig);

      // Make store globally available via provide/inject
      app.provide("authStore", authStore);
    },
  };
}

/**
 * Default export for use with app.use()
 *
 * @example
 * ```typescript
 * import createAuth from '@sottosviluppo/auth-frontend';
 *
 * app.use(createAuth({ ... }));
 * ```
 */
export default createAuth;
