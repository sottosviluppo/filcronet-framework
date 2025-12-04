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
