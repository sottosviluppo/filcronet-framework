import type { App } from "vue";
import { useAuthStore } from "./stores";
import type { AuthConfig } from "./types";

/**
 * Creates and configures the Filcronet Authentication plugin
 *
 * @export
 * @param {AuthConfig} config - Authentication configuration (required)
 * @returns Vue plugin with install method
 *
 * @example
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue';
 * import { createPinia } from 'pinia';
 * import { createAuth } from '@sottosviluppo/auth-frontend';
 *
 * const app = createApp(App);
 * const pinia = createPinia();
 *
 * app.use(pinia);
 * app.use(createAuth({
 *   apiBaseUrl: 'http://localhost:3000',
 *   apiVersion: 'v1',
 * }));
 *
 * app.mount('#app');
 * ```
 */
export function createAuth(config: AuthConfig) {
  return {
    install(app: App) {
      // Validate required config
      if (!config.apiBaseUrl) {
        throw new Error(
          "[Filcronet Auth] apiBaseUrl is required in configuration"
        );
      }

      if (!config.apiVersion) {
        throw new Error(
          "[Filcronet Auth] apiVersion is required in configuration"
        );
      }

      // Apply defaults for optional fields
      const finalConfig: AuthConfig = {
        apiBaseUrl: config.apiBaseUrl,
        apiVersion: config.apiVersion,
        httpClient: config.httpClient,
        storage: config.storage,
        redirectOnUnauth: config.redirectOnUnauth ?? "/login",
        redirectOnLogin: config.redirectOnLogin ?? "/",
        autoRefreshToken: config.autoRefreshToken ?? true,
        refreshBeforeExpiry: config.refreshBeforeExpiry ?? 60000,
      };

      // Initialize auth store with configuration
      const authStore = useAuthStore();
      authStore.initialize(finalConfig);

      // Make store globally available (optional)
      app.provide("authStore", authStore);
    },
  };
}

/**
 * Default export for use with app.use()
 */
export default createAuth;
