# @sottosviluppo/auth-frontend

Authentication composables, stores and utilities for Vue 3 applications with full i18n support and HttpOnly cookie security.

## Features

- 🎣 **Vue 3 Composables** - Reactive authentication state
- 🗄️ **Pinia Store** - Centralized state management
- 🔒 **XSS-Safe Token Storage** - Access token in memory, refresh in HttpOnly cookie
- 🔄 **Automatic Token Refresh** - With retry logic and scheduling
- ✅ **Permission Checking** - Declarative API with directives
- 🌐 **Full i18n Support** - Customizable validation messages
- 🔑 **GDPR-Compliant Password** - Validation with strength meter
- 📊 **Real-time Password Feedback** - Customizable error messages
- 🛡️ **Router Guards** - Protect routes easily
- 📝 **TypeScript Support** - Full type safety

## Installation

```bash
pnpm add @sottosviluppo/auth-frontend @sottosviluppo/core @sottosviluppo/frontend-core
```

## Quick Start

### 1. Install Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createAuth } from '@sottosviluppo/auth-frontend';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(createAuth({
  apiBaseUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  redirectOnUnauth: '/login',
  redirectOnLogin: '/dashboard',
  autoRefreshToken: true,
  refreshBeforeExpiry: 60000, // 1 minute
}));

app.mount('#app');
```

### 2. Use in Components

```vue
<script setup lang="ts">
import { useAuth, usePermissions } from '@sottosviluppo/auth-frontend';

const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
const { can, hasRole } = usePermissions();

async function handleLogin() {
  try {
    await login({ email: 'user@example.com', password: 'password' });
  } catch (e) {
    console.error('Login failed');
  }
}
</script>

<template>
  <div v-if="!isAuthenticated">
    <button @click="handleLogin" :disabled="isLoading">
      {{ isLoading ? 'Loading...' : 'Login' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
  
  <div v-else>
    <p>Welcome, {{ user?.email }}</p>
    <button v-if="can('users:create')" @click="createUser">Create User</button>
    <button @click="logout">Logout</button>
  </div>
</template>
```

## 🔒 Security Architecture

### Token Storage Strategy

| Token Type | Storage | Accessible by JS | Lifetime | Purpose |
|-----------|---------|------------------|----------|---------|
| **Access Token** | Memory | ✅ Yes | 15 min | API authentication |
| **Refresh Token** | HttpOnly Cookie | ❌ No | 7 days | Renew access token |

### Why This Approach?

```typescript
// ❌ VULNERABLE TO XSS
localStorage.setItem('token', accessToken);

// ✅ XSS-SAFE (our approach)
// Access token: memory only (lost on refresh, restored automatically)
// Refresh token: HttpOnly cookie (JavaScript cannot access)
```

### Security Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Login → Backend sets refresh token in HttpOnly       │
│            Frontend stores access token in memory       │
├─────────────────────────────────────────────────────────┤
│ 2. API Call → Access token from memory in header        │
│               If 401, automatic refresh using cookie    │
├─────────────────────────────────────────────────────────┤
│ 3. Page Refresh → Access token lost (expected!)         │
│                   Auto-refresh restores it immediately  │
└─────────────────────────────────────────────────────────┘
```

## Configuration

```typescript
interface AuthConfig {
  apiBaseUrl: string;           // API base URL (required)
  apiVersion: string;           // API version, e.g., 'v1' (required)
  httpClient?: IAuthHttpClient; // Custom HTTP client
  storage?: ITokenStorage;      // Custom storage (default: MemoryTokenStorage)
  redirectOnUnauth?: string;    // Redirect on 401 (default: '/login')
  redirectOnLogin?: string;     // Redirect after login (default: '/')
  autoRefreshToken?: boolean;   // Auto-refresh before expiry (default: true)
  refreshBeforeExpiry?: number; // Refresh X ms before expiry (default: 60000)
}
```

## Composables

### useAuth()

Main authentication composable.

```typescript
const {
  // State
  user,              // Ref<IUser | null>
  isAuthenticated,   // Ref<boolean>
  isLoading,         // Ref<boolean>
  error,             // Ref<string | null>
  
  // Computed
  userName,          // Computed<string | null>
  userInitials,      // Computed<string | null>
  
  // Actions
  login,             // (credentials: LoginCredentials) => Promise<IUser>
  register,          // (data: RegisterData) => Promise<IUser>
  logout,            // () => Promise<void>
  refreshToken,      // () => Promise<void>
  clearError,        // () => void
} = useAuth();
```

### usePermissions()

Permission checking utilities.

```typescript
const {
  permissions,       // Computed<string[]>
  roles,             // Computed<string[]>
  can,               // (permission: string) => boolean
  canAll,            // (permissions: string[]) => boolean
  canAny,            // (permissions: string[]) => boolean
  hasRole,           // (role: string) => boolean
  hasAnyRole,        // (roles: string[]) => boolean
} = usePermissions();

// Usage
if (can('users:create')) {
  // User can create users
}

if (canAny(['users:update', 'users:delete'])) {
  // User can update OR delete
}
```

### useUser()

User utilities.

```typescript
const {
  user,
  userName,
  userInitials,
  isAuthenticated,
  fetchCurrentUser,
} = useUser();
```

### usePasswordStrength()

Password strength validation.

```typescript
import { usePasswordStrength } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';

const password = ref('');
const { strength, errors, isValid } = usePasswordStrength(password, {
  minLength: 12,
  personalData: ['john', 'doe', 'john@example.com'],
});

// Custom error messages (i18n)
const errorMessages = {
  [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
  [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
  // ...
};
```

### usePasswordRecovery()

Password recovery flow.

```typescript
const {
  requestPasswordReset,  // (email: string) => Promise<void>
  resetPassword,         // (token: string, newPassword: string) => Promise<void>
  isLoading,
  error,
} = usePasswordRecovery();
```

### useAuthValidation()

i18n-ready validation schemas.

```typescript
const { schemas } = useAuthValidation({
  messages: {
    email: {
      required: t('validation.email.required'),
      invalid: t('validation.email.invalid'),
    },
    password: {
      required: t('validation.password.required'),
      tooShort: t('validation.password.tooShort'),
    },
  },
});

// Use with VeeValidate or Zod
const { errors } = useForm({
  validationSchema: toTypedSchema(schemas.login),
});
```

## Router Guards

```typescript
import { createRouter } from 'vue-router';
import {
  requireAuth,
  requirePermissions,
  requireAnyPermission,
  requireRole,
  guestOnly,
} from '@sottosviluppo/auth-frontend';

const router = createRouter({
  routes: [
    {
      path: '/login',
      component: LoginPage,
      beforeEnter: guestOnly('/dashboard'),
    },
    {
      path: '/dashboard',
      component: Dashboard,
      beforeEnter: requireAuth(),
    },
    {
      path: '/admin/users',
      component: UserManagement,
      beforeEnter: requirePermissions(['users:list', 'users:read']),
    },
    {
      path: '/editor',
      component: Editor,
      beforeEnter: requireAnyPermission(['posts:create', 'pages:create']),
    },
    {
      path: '/admin',
      component: AdminPanel,
      beforeEnter: requireRole('admin'),
    },
  ],
});
```

## Directives

### v-can

Permission-based rendering.

```vue
<template>
  <!-- Single permission -->
  <button v-can="'users:create'">Create User</button>
  
  <!-- Multiple permissions (AND) -->
  <button v-can="['users:update', 'users:delete']">Edit & Delete</button>
  
  <!-- Multiple permissions (OR) -->
  <button v-can:any="['users:update', 'users:delete']">Edit or Delete</button>
</template>
```

### v-role

Role-based rendering.

```vue
<template>
  <!-- Single role -->
  <div v-role="'admin'">Admin Panel</div>
  
  <!-- Multiple roles (AND) -->
  <div v-role="['admin', 'editor']">Admin + Editor</div>
  
  <!-- Multiple roles (OR) -->
  <div v-role:any="['admin', 'editor']">Admin or Editor</div>
</template>
```

## Components

### PasswordStrengthMeter

```vue
<script setup>
import { ref } from 'vue';
import { PasswordStrengthMeter } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';

const password = ref('');

const errorMessages = {
  [PasswordErrorKey.TooShort]: 'Password must be at least 12 characters',
  [PasswordErrorKey.NoUppercase]: 'Add an uppercase letter',
  [PasswordErrorKey.NoLowercase]: 'Add a lowercase letter',
  [PasswordErrorKey.NoNumber]: 'Add a number',
  [PasswordErrorKey.NoSpecialChar]: 'Add a special character',
  [PasswordErrorKey.ContainsPersonalData]: 'Cannot contain personal info',
  [PasswordErrorKey.CommonPassword]: 'Password is too common',
};
</script>

<template>
  <input v-model="password" type="password" />
  
  <PasswordStrengthMeter
    v-model="password"
    :error-messages="errorMessages"
    :show-errors="true"
    :show-label="true"
  />
</template>
```

## Admin Composables

### useUserManagement()

```typescript
const {
  users,
  isLoading,
  error,
  pagination,
  fetchUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = useUserManagement();

// Fetch paginated users
await fetchUsers({ page: 1, limit: 20 });

// Create user
await createUser({
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe',
  roleIds: ['role-uuid'],
});
```

### useRoleManagement()

```typescript
const {
  roles,
  isLoading,
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
} = useRoleManagement();
```

## Exports

### Interfaces
- `ITokenStorage` - Token storage interface
- `IAuthHttpClient` - Auth HTTP client interface

### Classes
- `MemoryTokenStorage` - In-memory token storage
- `AuthHttpClient` - Axios client with auto-refresh
- `TokenRefreshScheduler` - Token refresh scheduler

### Composables
- `useAuth()` - Main authentication
- `useUser()` - User utilities
- `usePermissions()` - Permission checking
- `usePasswordStrength()` - Password strength
- `usePasswordRecovery()` - Password recovery
- `useAuthValidation()` - i18n validation
- `useUserManagement()` - Admin user CRUD
- `useRoleManagement()` - Admin role CRUD

### Stores
- `useAuthStore()` - Pinia auth store
- `useUserManagementStore()` - User management store
- `useRoleManagementStore()` - Role management store

### Router Guards
- `requireAuth` - Require authentication
- `requirePermissions` - Require specific permissions
- `requireAnyPermission` - Require any permission
- `requireRole` - Require specific role
- `guestOnly` - Guest-only routes

### Directives
- `vCan` - Permission-based rendering
- `vRole` - Role-based rendering

### Components
- `PasswordStrengthMeter` - Password strength component

### Utilities
- `decodeJwt()` - Decode JWT token
- `isTokenExpired()` - Check if token expired
- `getTokenExpiryTime()` - Get time until expiry
- `getTokenExpiryDate()` - Get expiry date
- `isTokenExpiringSoon()` - Check if expiring soon

### Re-exports from @sottosviluppo/core
- `PasswordErrorKey`
- `IValidationMessages`
- `IPasswordErrorMessages`

## Troubleshooting

### Token Not Persisting Across Refreshes

This is **expected behavior**:
- Access token in memory → lost on refresh
- Refresh token in cookie → persists
- Auto-refresh restores access token immediately

### 401 Errors After Refresh

Check:
1. Backend CORS allows credentials
2. `withCredentials: true` in HTTP client
3. Cookie domain/path settings
4. Backend refresh endpoint works

### Auto-Refresh Not Working

```typescript
// Ensure autoRefreshToken is enabled
createAuth({
  autoRefreshToken: true,
  refreshBeforeExpiry: 60000,
});
```

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types and interfaces
- **[@sottosviluppo/frontend-core](../frontend-core)** - Base HTTP client and storage
- **[@sottosviluppo/auth-backend](../auth-backend)** - NestJS auth module

## License

UNLICENSED - Private package for Filcronet projects.

---

**Security First. Developer Experience Second.**
