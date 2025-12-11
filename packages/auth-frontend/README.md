# @sottosviluppo/auth-frontend

Complete authentication solution for Vue 3 applications in the Filcronet Framework.

Provides Pinia stores, composables, router guards, directives, and validation schemas for seamless authentication integration.

## Features

- 🔐 **Secure Token Storage**: XSS-safe in-memory storage for access tokens
- 🔄 **Automatic Token Refresh**: Seamless token refresh before expiry
- 🍪 **HttpOnly Cookies**: Refresh tokens stored securely in HttpOnly cookies
- 🛡️ **Permission System**: Role-based and permission-based access control
- 📝 **i18n-Ready Validation**: Zod schema factories with customizable messages
- 🧭 **Router Guards**: Pre-built navigation guards for protected routes
- 🎯 **Vue Directives**: `v-can` and `v-role` for conditional rendering

## Installation

```bash
# Using pnpm (recommended)
pnpm add @sottosviluppo/auth-frontend

# Using npm
npm install @sottosviluppo/auth-frontend

# Using yarn
yarn add @sottosviluppo/auth-frontend
```

### GitHub Packages Authentication

Configure your `.npmrc`:

```ini
@sottosviluppo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### Peer Dependencies

```bash
pnpm add vue@^3.5.0 pinia@^3.0.0 vue-router@^4.6.0
```

## Quick Start

### 1. Install the Plugin

```typescript
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createAuth } from "@sottosviluppo/auth-frontend";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

// Install Pinia first (required)
app.use(pinia);

// Install auth plugin
app.use(
  createAuth({
    apiBaseUrl: import.meta.env.VITE_API_URL, // e.g., 'http://localhost:3000' or 'http://localhost:3000/api/v1'
    apiVersion: "v1", //Optional
    apiPrefix: "api", //Optional
    redirectOnUnauth: "/login",
    redirectOnLogin: "/dashboard",
    redirectOnForbidden: "/forbidden",
    autoRefreshToken: true,
    refreshBeforeExpiry: 60000, // 1 minute before expiry
  })
);

app.mount("#app");
```

### 2. Restore Session on App Load

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "@sottosviluppo/auth-frontend";

const authStore = useAuthStore();
const isReady = ref(false);

onMounted(async () => {
  // Restore session from HttpOnly cookie
  await authStore.restoreSession();
  isReady.value = true;
});
</script>

<template>
  <div v-if="isReady">
    <router-view />
  </div>
  <div v-else>Loading...</div>
</template>
```

### 3. Use in Components

```vue
<script setup lang="ts">
import { useAuth, usePermissions } from "@sottosviluppo/auth-frontend";

const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
const { can, canAny } = usePermissions();

async function handleLogin() {
  try {
    await login({
      email: "user@example.com",
      password: "password123",
    });
    // Redirect happens automatically if configured
  } catch (err) {
    console.error("Login failed:", err.message);
  }
}
</script>

<template>
  <div v-if="isAuthenticated">
    <p>Welcome, {{ user?.email }}</p>

    <button v-if="can('users:create')" @click="createUser">Create User</button>

    <button @click="logout">Logout</button>
  </div>

  <div v-else>
    <button @click="handleLogin" :disabled="isLoading">
      {{ isLoading ? "Loading..." : "Login" }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

## Using the Authenticated HTTP Client

The package provides a pre-configured HTTP client with automatic token management and 401 handling. **Always use this client instead of creating your own Axios instance.**

### Why Use the Package's HTTP Client?

The `AuthHttpClient` provides:

- ✅ Automatic token injection in requests
- ✅ Automatic token refresh on 401 responses
- ✅ Request queuing during token refresh
- ✅ Proper error handling and logout on refresh failure

### Approach 1: Use httpClient Directly in Services

```typescript
// services/products.ts
import { useAuthStore } from "@sottosviluppo/auth-frontend";

export const productsService = {
  async getAll() {
    const authStore = useAuthStore();
    const httpClient = authStore.getHttpClient();
    return httpClient.get("/products");
  },

  async getById(id: string) {
    const authStore = useAuthStore();
    const httpClient = authStore.getHttpClient();
    return httpClient.get(`/products/${id}`);
  },

  async create(data: CreateProductDto) {
    const authStore = useAuthStore();
    const httpClient = authStore.getHttpClient();
    return httpClient.post("/products", data);
  },

  async update(id: string, data: UpdateProductDto) {
    const authStore = useAuthStore();
    const httpClient = authStore.getHttpClient();
    return httpClient.put(`/products/${id}`, data);
  },

  async delete(id: string) {
    const authStore = useAuthStore();
    const httpClient = authStore.getHttpClient();
    return httpClient.delete(`/products/${id}`);
  },
};
```

### Approach 2: Create a Wrapper Function

```typescript
// services/api.ts
import { useAuthStore } from "@sottosviluppo/auth-frontend";
import type { IAuthHttpClient } from "@sottosviluppo/auth-frontend";

/**
 * Get the authenticated HTTP client from the auth store.
 * Always use this instead of creating your own Axios instance.
 */
export function getApi(): IAuthHttpClient {
  const authStore = useAuthStore();
  return authStore.getHttpClient();
}

// Usage in services
// services/products.ts
import { getApi } from "./api";

export const productsService = {
  async getAll() {
    return getApi().get("/products");
  },

  async create(data: CreateProductDto) {
    return getApi().post("/products", data);
  },
};
```

### Approach 3: Composable for Reactive Access

```typescript
// composables/useApi.ts
import { useAuthStore } from '@sottosviluppo/auth-frontend';

export function useApi() {
  const authStore = useAuthStore();

  return {
    get: <T>(url: string) => authStore.getHttpClient().get<T>(url),
    post: <T>(url: string, data?: unknown) => authStore.getHttpClient().post<T>(url, data),
    put: <T>(url: string, data?: unknown) => authStore.getHttpClient().put<T>(url, data),
    patch: <T>(url: string, data?: unknown) => authStore.getHttpClient().patch<T>(url, data),
    delete: <T>(url: string) => authStore.getHttpClient().delete<T>(url),
  };
}

// Usage in components
<script setup lang="ts">
import { useApi } from '@/composables/useApi';

const api = useApi();

async function loadProducts() {
  const products = await api.get<Product[]>('/products');
}
</script>
```

## ⚠️ Common Pitfall: Duplicate 401 Interceptors

### What NOT to Do

**Do NOT create your own Axios instance with 401 handling:**

```typescript
// ❌ WRONG - This will cause infinite reloads!
// services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ❌ This interceptor conflicts with the auth package
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ❌ This causes a full page reload!
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Why This Is Dangerous

When you have two 401 handlers:

1. Your API call returns 401
2. **Your interceptor fires FIRST** and does `window.location.href = '/login'`
3. Page reloads completely
4. The auth package's refresh mechanism **never gets a chance to run**
5. User is logged out unnecessarily

### The Correct Approach

Let the auth package handle all 401 responses:

```typescript
// ✅ CORRECT - Use the package's HTTP client
import { useAuthStore } from "@sottosviluppo/auth-frontend";

export function getApi() {
  const authStore = useAuthStore();
  return authStore.getHttpClient();
}
```

If you absolutely need a custom Axios instance (e.g., for a third-party API), **do NOT add 401 handling**:

```typescript
// ✅ OK - Custom client WITHOUT 401 handling
import axios from "axios";

const externalApi = axios.create({
  baseURL: "https://external-api.com",
});

// Only add non-auth interceptors
externalApi.interceptors.request.use((config) => {
  config.headers["X-Custom-Header"] = "value";
  return config;
});

// ❌ Do NOT add response interceptor for 401
```

## Troubleshooting

### Problem: Page reloads when navigating to protected routes

**Symptoms:**

- Clicking a link causes a full page reload
- Browser shows `[vite] connecting...` in console
- User ends up on login page briefly, then redirects back

**Cause:** You have a custom Axios interceptor that does `window.location.href = '/login'` on 401 errors.

**Solution:** Remove the custom 401 interceptor and use the package's HTTP client:

```typescript
// Before (wrong)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login"; // ❌ Remove this
    }
    return Promise.reject(error);
  }
);

// After (correct)
// Just use authStore.getHttpClient() instead of custom axios instance
```

### Problem: Token refresh not working

**Symptoms:**

- User gets logged out when access token expires
- No call to `/auth/refresh` in Network tab

**Possible causes:**

1. **Not using the package's HTTP client**

```typescript
   // ❌ Wrong
   import axios from 'axios';
   const api = axios.create({ ... });

   // ✅ Correct
   const api = authStore.getHttpClient();
```

2. **Backend routes not protected**

```typescript
// ❌ Wrong - Only Swagger decoration, not actual protection
@ApiBearerAuth()
@Controller("products")
export class ProductsController {}

// ✅ Correct - Actually protected
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {}
```

3. **Missing cookie credentials**

```typescript
// Ensure withCredentials is true (package handles this automatically)
// If using custom client, add:
axios.create({
  withCredentials: true, // Required for HttpOnly cookies
});
```

### Problem: `isAuthenticated` is false after login

**Symptoms:**

- Login succeeds but `authStore.isAuthenticated` is `false`
- Guards redirect to login page immediately

**Cause:** You may have a duplicate auth store or not using the package's store.

**Solution:** Always import from the package:

```typescript
// ❌ Wrong - Using local store
import { useAuthStore } from "@/stores/auth";

// ✅ Correct - Using package store
import { useAuthStore } from "@sottosviluppo/auth-frontend";
```

### Problem: Guards cause infinite redirect loop

**Symptoms:**

- Page keeps redirecting between routes
- Console shows multiple guard executions

**Solution:** Ensure you're not mixing local auth state with package auth state:

```typescript
// ❌ Wrong - Mixing stores
import { useAuthStore } from "@/stores/auth"; // Local
import { requireAuth } from "@sottosviluppo/auth-frontend"; // Package guard uses package store

// ✅ Correct - Use only package store
import { useAuthStore, requireAuth } from "@sottosviluppo/auth-frontend";
```

### Problem: CORS errors on refresh endpoint

**Symptoms:**

- `/auth/refresh` fails with CORS error
- Cookies not being sent

**Solution:** Configure backend CORS properly:

```typescript
// main.ts (NestJS)
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // ← Required for cookies
});
```

And ensure cookie path matches your API:

```typescript
// auth.controller.ts
response.cookie("refreshToken", token, {
  // ... other options
  path: "/v1/auth", // Must match your API prefix
});
```

## Configuration Options

| Option                | Type              | Default          | Description                               |
| --------------------- | ----------------- | ---------------- | ----------------------------------------- |
| `apiBaseUrl`          | `string`          | **required**     | Backend API base URL                      |
| `apiVersion`          | `string`          | **required**     | API version prefix (e.g., 'v1')           |
| `redirectOnUnauth`    | `string`          | `'/login'`       | Redirect path when not authenticated      |
| `redirectOnLogin`     | `string`          | `'/'`            | Redirect path after login                 |
| `redirectOnForbidden` | `string`          | `'/forbidden'`   | Redirect path when lacking permissions    |
| `autoRefreshToken`    | `boolean`         | `true`           | Automatically refresh token before expiry |
| `refreshBeforeExpiry` | `number`          | `60000`          | Refresh token X ms before expiry          |
| `httpClient`          | `IAuthHttpClient` | `AuthHttpClient` | Custom HTTP client                        |
| `storage`             | `ITokenStorage`   | `TokenStorage`   | Custom token storage                      |

## Composables

### useAuth

Main authentication composable:

```typescript
import { useAuth } from "@sottosviluppo/auth-frontend";

const {
  // State (reactive)
  user, // Current user or null
  isAuthenticated, // Boolean
  isLoading, // Loading state
  error, // Error message or null
  userName, // Display name
  userInitials, // For avatars
  userPermissions, // Array of 'resource:action'
  userRoles, // Array of role names

  // Methods
  login, // (credentials) => Promise<IUser>
  logout, // () => Promise<void>
  register, // (data) => Promise<IUser>
  fetchCurrentUser, // () => Promise<IUser>
  refreshToken, // () => Promise<void>
  clearError, // () => void
} = useAuth();
```

### useUser

User-specific utilities:

```typescript
import { useUser } from "@sottosviluppo/auth-frontend";

const {
  user,
  fullName, // 'John Doe'
  displayName, // 'John' or username or email
  email,
  hasVerifiedEmail,
  status,
  isActive,
  isSuspended,
  isPendingVerification,
  roles,
  roleNames,

  // Methods
  hasRole, // (roleName) => boolean
  hasAnyRole, // (roleNames[]) => boolean
  hasAllRoles, // (roleNames[]) => boolean
} = useUser();
```

### usePermissions

Permission checking:

```typescript
import { usePermissions } from "@sottosviluppo/auth-frontend";

const {
  permissions, // All user permissions

  // Methods
  can, // (permission) => boolean
  canAny, // (permissions[]) => boolean
  canAll, // (permissions[]) => boolean
  canManage, // (resource) => boolean
} = usePermissions();

// Examples
if (can("users:create")) {
  // User can create users
}

if (canAny(["users:update", "users:delete"])) {
  // User can update OR delete users
}

if (canAll(["products:create", "products:update"])) {
  // User can create AND update products
}

if (canManage("orders")) {
  // User has 'orders:manage' permission
}
```

### usePasswordRecovery

Password reset flows:

```typescript
import { usePasswordRecovery } from "@sottosviluppo/auth-frontend";

const {
  isLoading,
  error,
  successMessage,

  forgotPassword, // (email, resetUrl) => Promise<void>
  resetPassword, // (token, newPassword) => Promise<void>
  setPassword, // (token, password) => Promise<void>
  validateToken, // (token, type) => Promise<{ valid, email? }>
  clearMessages,
} = usePasswordRecovery();

// Request password reset
await forgotPassword("user@example.com", "https://app.com/reset-password");

// Reset password with token
await resetPassword(tokenFromUrl, newPassword);

// Set password (invitation flow)
await setPassword(invitationToken, password);
```

### usePasswordStrength

Real-time password strength feedback:

```typescript
import { usePasswordStrength } from "@sottosviluppo/auth-frontend";
import { PasswordErrorKey } from "@sottosviluppo/core";

const password = ref("");

const {
  strength, // 0-4
  strengthLabel, // 'Weak', 'Fair', 'Good', 'Strong'
  strengthColor, // CSS color
  errors, // Array of error messages
  isValid, // boolean
  progressValue, // 0-100 for progress bars
} = usePasswordStrength(
  password,
  { email, username, firstName, lastName }, // Optional user context
  {
    errorMessages: {
      [PasswordErrorKey.TooShort]: "Password must be at least 12 characters",
      [PasswordErrorKey.NoUppercase]: "Add an uppercase letter",
      // ... other messages
    },
  }
);
```

### useUserManagement

Admin user CRUD:

```typescript
import { useUserManagement } from "@sottosviluppo/auth-frontend";

const {
  users,
  isLoading,
  error,
  pagination,

  fetchUsers, // (params?) => Promise<void>
  getUser, // (userId) => Promise<IUser>
  createUser, // (data) => Promise<CreateUserResponse>
  updateUser, // (userId, data) => Promise<IUser>
  deleteUser, // (userId) => Promise<void>
  clearError,
} = useUserManagement();

// Initialize with HTTP client
const authStore = useAuthStore();
const userManagement = useUserManagementStore();
userManagement.initialize(authStore.getHttpClient());
```

### useRoleManagement

Admin role CRUD:

```typescript
import { useRoleManagement } from "@sottosviluppo/auth-frontend";

const {
  roles,
  systemRoles, // Cannot be deleted
  customRoles, // Can be modified/deleted
  isLoading,
  error,

  fetchRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  clearError,
} = useRoleManagement();
```

## Router Guards

### Basic Auth Guard

```typescript
import { createRouter, createWebHistory } from "vue-router";
import { requireAuth, guestOnly } from "@sottosviluppo/auth-frontend";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      component: LoginPage,
      beforeEnter: guestOnly, // Redirect to home if authenticated
    },
    {
      path: "/dashboard",
      component: Dashboard,
      beforeEnter: requireAuth, // Redirect to login if not authenticated
    },
  ],
});
```

### Permission Guards

```typescript
import {
  requirePermissions,
  requireAnyPermission,
  requireRole,
} from "@sottosviluppo/auth-frontend";

const routes = [
  {
    path: "/admin/users",
    component: UserManagement,
    beforeEnter: requirePermissions(["users:list", "users:read"]),
  },
  {
    path: "/content",
    component: ContentEditor,
    beforeEnter: requireAnyPermission(["posts:create", "posts:update"]),
  },
  {
    path: "/admin",
    component: AdminPanel,
    beforeEnter: requireRole(["admin", "super-admin"]),
  },
];
```

## Vue Directives

### v-can

Show/hide elements based on permissions:

```vue
<template>
  <!-- Single permission -->
  <button v-can="'users:create'">Create User</button>

  <!-- ALL permissions required -->
  <button v-can="['users:update', 'users:delete']">Edit & Delete</button>

  <!-- ANY permission (with modifier) -->
  <button v-can:any="['users:update', 'users:delete']">Edit or Delete</button>
</template>
```

### v-role

Show/hide elements based on roles:

```vue
<template>
  <!-- Single role -->
  <div v-role="'admin'">Admin Panel</div>

  <!-- ALL roles required -->
  <div v-role="['admin', 'editor']">Admin + Editor Content</div>

  <!-- ANY role (with modifier) -->
  <div v-role:any="['admin', 'editor']">Admin or Editor Content</div>
</template>
```

## Validation Schemas

i18n-ready Zod schema factories:

### Login Schema

```typescript
import { useLoginValidation } from "@sottosviluppo/auth-frontend";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const loginSchema = useLoginValidation({
  email: {
    invalid: t("validation.email.invalid"),
    required: t("validation.email.required"),
  },
  password: {
    required: t("validation.password.required"),
  },
});

// Use with vee-validate
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(loginSchema),
});
```

### Register Schema

```typescript
import { useRegisterValidation } from "@sottosviluppo/auth-frontend";
import { PasswordErrorKey } from "@sottosviluppo/core";

const registerSchema = useRegisterValidation(
  {
    email: { invalid: t("validation.email.invalid") },
    password: {
      minLength: t("validation.password.minLength"),
      notStrong: t("validation.password.notStrong"),
      mismatch: t("validation.password.mismatch"),
    },
    username: { invalid: t("validation.username.invalid") },
  },
  {
    [PasswordErrorKey.TooShort]: t("password.tooShort"),
    [PasswordErrorKey.NoUppercase]: t("password.noUppercase"),
    [PasswordErrorKey.NoLowercase]: t("password.noLowercase"),
    [PasswordErrorKey.NoNumber]: t("password.noNumber"),
    [PasswordErrorKey.NoSpecialChar]: t("password.noSpecialChar"),
    [PasswordErrorKey.ContainsPersonalData]: t("password.containsPersonalData"),
    [PasswordErrorKey.CommonPassword]: t("password.commonPassword"),
  }
);
```

### Other Schemas

```typescript
import {
  useForgotPasswordValidation,
  useResetPasswordValidation,
  useSetPasswordValidation,
} from "@sottosviluppo/auth-frontend";

// Forgot password (email only)
const forgotSchema = useForgotPasswordValidation({
  email: {
    required: t("validation.email.required"),
    invalid: t("validation.email.invalid"),
  },
});

// Reset password (with token)
const resetSchema = useResetPasswordValidation(
  {
    token: { required: t("validation.token.required") },
    password: {
      /* ... */
    },
  },
  passwordErrorMessages
);

// Set password (invitation flow)
const setPasswordSchema = useSetPasswordValidation(
  {
    token: { required: t("validation.token.required") },
    password: {
      /* ... */
    },
  },
  passwordErrorMessages
);
```

## Security Architecture

### Token Storage

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Memory Storage │    │     HttpOnly Cookie             │ │
│  │  (JavaScript)   │    │     (Not accessible via JS)     │ │
│  │                 │    │                                 │ │
│  │  Access Token   │    │  Refresh Token                  │ │
│  │  (short-lived)  │    │  (long-lived)                   │ │
│  │                 │    │                                 │ │
│  │  ✅ XSS Safe    │    │  ✅ XSS Safe                    │ │
│  │  ❌ Lost on     │    │  ✅ Persists across             │ │
│  │     refresh     │    │     page refreshes              │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   API    │     │  Client  │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │  Request with  │                │
     │  expired token │                │
     │───────────────>│                │
     │                │                │
     │  401 Unauthorized               │
     │<───────────────│                │
     │                │                │
     │  POST /auth/refresh             │
     │  (HttpOnly cookie)              │
     │───────────────>│                │
     │                │                │
     │  New access token               │
     │<───────────────│                │
     │                │                │
     │  Retry original request         │
     │───────────────>│                │
     │                │                │
     │  Success       │                │
     │<───────────────│                │
```

## API Reference

### Stores

| Store                    | Description                           |
| ------------------------ | ------------------------------------- |
| `useAuthStore`           | Main authentication state and methods |
| `useUserManagementStore` | Admin user CRUD operations            |
| `useRoleManagementStore` | Admin role CRUD operations            |

### Composables

| Composable                    | Description                      |
| ----------------------------- | -------------------------------- |
| `useAuth`                     | Authentication state and methods |
| `useUser`                     | Current user utilities           |
| `usePermissions`              | Permission checking              |
| `usePasswordRecovery`         | Password reset flows             |
| `usePasswordStrength`         | Password strength feedback       |
| `useUserManagement`           | Admin user operations            |
| `useRoleManagement`           | Admin role operations            |
| `useLoginValidation`          | Login form schema                |
| `useRegisterValidation`       | Registration form schema         |
| `useForgotPasswordValidation` | Forgot password schema           |
| `useResetPasswordValidation`  | Reset password schema            |
| `useSetPasswordValidation`    | Set password schema              |

### Router Guards

| Guard                  | Description                        |
| ---------------------- | ---------------------------------- |
| `requireAuth`          | Requires authentication            |
| `requirePermissions`   | Requires ALL specified permissions |
| `requireAnyPermission` | Requires ANY specified permission  |
| `requireRole`          | Requires ANY specified role        |
| `guestOnly`            | Only for non-authenticated users   |

### Directives

| Directive | Description             |
| --------- | ----------------------- |
| `v-can`   | Show/hide by permission |
| `v-role`  | Show/hide by role       |

### Classes

| Class            | Description                   |
| ---------------- | ----------------------------- |
| `AuthHttpClient` | HTTP client with auto-refresh |
| `TokenStorage`   | XSS-safe token storage        |
| `AuthApi`        | Authentication API client     |
| `UserApi`        | User management API client    |
| `RoleApi`        | Role management API client    |
| `PermissionApi`  | Permission API client         |

## License

UNLICENSED - Private package for Filcronet projects.
