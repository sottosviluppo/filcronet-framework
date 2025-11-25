import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../stores";
import type { PermissionString } from "../composables/permissions/usePermissions";

/**
 * Navigation guard that requires authentication
 * Redirects to login if user is not authenticated
 *
 * @export
 * @param {RouteLocationNormalized} to - Target route
 * @param {RouteLocationNormalized} from - Current route
 * @param {NavigationGuardNext} next - Navigation function
 *
 * @example
 * ```typescript
 * // In router config
 * {
 *   path: '/dashboard',
 *   component: Dashboard,
 *   beforeEnter: requireAuth
 * }
 * ```
 */
export function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
}

/**
 * Navigation guard that requires specific permissions
 * User must have ALL specified permissions to access the route
 *
 * @export
 * @param {PermissionString[]} requiredPermissions - Required permissions
 * @returns {Function} Navigation guard function
 *
 * @example
 * ```typescript
 * {
 *   path: '/users',
 *   component: UsersList,
 *   beforeEnter: requirePermissions(['users:read'])
 * }
 *
 * {
 *   path: '/users/create',
 *   component: UserCreate,
 *   beforeEnter: requirePermissions(['users:create', 'users:read'])
 * }
 * ```
 */
export function requirePermissions(requiredPermissions: PermissionString[]) {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      next({
        name: "login",
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userPermissions = authStore.userPermissions || [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      next({ name: "forbidden" });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard that requires ANY of the specified permissions
 * User needs at least ONE permission to access the route
 *
 * @export
 * @param {PermissionString[]} permissions - Required permissions (any)
 * @returns {Function} Navigation guard function
 *
 * @example
 * ```typescript
 * {
 *   path: '/content',
 *   component: ContentPage,
 *   beforeEnter: requireAnyPermission(['posts:read', 'pages:read'])
 * }
 * ```
 */
export function requireAnyPermission(permissions: PermissionString[]) {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      next({
        name: "login",
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userPermissions = authStore.userPermissions || [];

    const hasAnyPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      next({ name: "forbidden" });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard that requires specific role
 *
 * @export
 * @param {string[]} roleNames - Required role names
 * @returns {Function} Navigation guard function
 *
 * @example
 * ```typescript
 * {
 *   path: '/admin',
 *   component: AdminPanel,
 *   beforeEnter: requireRole(['admin', 'super-admin'])
 * }
 * ```
 */
export function requireRole(roleNames: string[]) {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      next({
        name: "login",
        query: { redirect: to.fullPath },
      });
      return;
    }

    const userRoles = authStore.userRoles || [];
    const hasRole = roleNames.some((role) => userRoles.includes(role));

    if (!hasRole) {
      next({ name: "forbidden" });
    } else {
      next();
    }
  };
}

/**
 * Navigation guard for guest-only routes (login, register)
 * Redirects to home if already authenticated
 *
 * @export
 * @param {RouteLocationNormalized} to - Target route
 * @param {RouteLocationNormalized} from - Current route
 * @param {NavigationGuardNext} next - Navigation function
 *
 * @example
 * ```typescript
 * {
 *   path: '/login',
 *   component: Login,
 *   beforeEnter: guestOnly
 * }
 * ```
 */
export function guestOnly(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    next({ name: "home" });
  } else {
    next();
  }
}
