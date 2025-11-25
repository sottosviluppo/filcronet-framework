import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../stores";
import type { PermissionString } from "../composables/permissions/usePermissions";

/**
 * Helper to ensure auth store is initialized
 */
async function ensureInitialized(): Promise<void> {
  const authStore = useAuthStore();
  await authStore.waitForInit();
}

/**
 * Get redirect path from config or use default
 */
function getLoginRedirect(): string {
  const authStore = useAuthStore();
  const config = authStore.getConfig();
  return config?.redirectOnUnauth || "/login";
}

/**
 * Get forbidden redirect path from config or use default
 */
function getForbiddenRedirect(): string {
  const authStore = useAuthStore();
  const config = authStore.getConfig();
  return config?.redirectOnForbidden || "/forbidden";
}

/**
 * Navigation guard that requires authentication
 */
export async function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  await ensureInitialized();

  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    const loginPath = getLoginRedirect();
    next({
      path: loginPath,
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
}

/**
 * Navigation guard that requires specific permissions
 */
export function requirePermissions(requiredPermissions: PermissionString[]) {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    await ensureInitialized();

    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      const loginPath = getLoginRedirect();
      next({
        path: loginPath,
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userPermissions = authStore.userPermissions || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      next({ path: getForbiddenRedirect() });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard that requires ANY of the specified permissions
 */
export function requireAnyPermission(permissions: PermissionString[]) {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    await ensureInitialized();

    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      const loginPath = getLoginRedirect();
      next({
        path: loginPath,
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userPermissions = authStore.userPermissions || [];
    const hasAnyPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      next({ path: getForbiddenRedirect() });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard that requires specific role
 */
export function requireRole(roleNames: string[]) {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    await ensureInitialized();

    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      const loginPath = getLoginRedirect();
      next({
        path: loginPath,
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userRoles = authStore.userRoles || [];
    const hasRole = roleNames.some((role) => userRoles.includes(role));

    if (!hasRole) {
      next({ path: getForbiddenRedirect() });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard for guest-only routes
 */
export async function guestOnly(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  await ensureInitialized();

  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    const config = authStore.getConfig();
    const homePath = config?.redirectOnLogin || "/";
    next({ path: homePath });
  } else {
    next();
  }
}
