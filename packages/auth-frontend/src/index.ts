/**
 * Filcronet Auth Frontend Package
 * Authentication utilities, composables and stores for Vue 3
 *
 * This package provides a complete authentication solution including:
 * - Pinia stores for auth state management
 * - Vue composables for easy access to auth functionality
 * - Router guards for protected routes
 * - Vue directives for permission-based UI rendering
 * - Zod schema factories for i18n-ready form validation
 * - XSS-safe token storage
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // Installation in main.ts
 * import { createApp } from 'vue';
 * import { createPinia } from 'pinia';
 * import { createAuth } from '@sottosviluppo/auth-frontend';
 *
 * const app = createApp(App);
 * app.use(createPinia());
 * app.use(createAuth({
 *   apiBaseUrl: 'http://localhost:3000',
 *   apiVersion: 'v1',
 * }));
 * ```
 *
 * @example
 * ```typescript
 * // Usage in components
 * import { useAuth, usePermissions } from '@sottosviluppo/auth-frontend';
 *
 * const { user, isAuthenticated, login, logout } = useAuth();
 * const { can, canAny } = usePermissions();
 * ```
 */

// Plugin - Main entry point
export { createAuth } from "./plugin";

// API clients
export * from "./api";

// Pinia stores
export * from "./stores";

// Vue composables
export * from "./composables";

// Router guards
export * from "./router";

// Vue directives
export * from "./directives";

// Zod schema factories
export * from "./schemas";

// Utilities
export * from "./utils";

// Interfaces
export * from "./interfaces";

// Storage
export * from "./storage";

// Types
export * from "./types";
