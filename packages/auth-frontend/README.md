# @sottosviluppo/auth-frontend

Authentication composables, stores and utilities for Vue 3 applications with full i18n support and HttpOnly cookie security.

## Features

- 🎣 **Vue 3 Composables** for reactive authentication state
- 🗄️ **Pinia Store** for centralized state management
- 🔒 **XSS-Safe Token Storage** (access token in memory, refresh in HttpOnly cookie)
- 🔄 **Automatic Token Refresh** with retry logic and scheduling
- ✅ **Permission Checking** utilities with declarative API
- 🌍 **Full i18n Support** for validation messages
- 🔐 **GDPR-Compliant Password** validation with strength meter
- 📊 **Real-time Password Feedback** with customizable error messages
- 📝 **TypeScript Support** with full type safety
- 🚀 **Easy Integration** with existing Vue 3 projects

## Installation
```bash
pnpm add @sottosviluppo/auth-frontend @sottosviluppo/core @sottosviluppo/frontend-core
```

## 🔒 Security Architecture

### Token Storage Strategy

This package implements a **defense-in-depth** security approach:

| Token Type | Storage | Accessible by JS | Lifetime | Purpose |
|-----------|---------|------------------|----------|---------|
| **Access Token** | Memory (frontend) | ✅ Yes | 15 minutes | API authentication |
| **Refresh Token** | HttpOnly Cookie | ❌ No | 7 days | Renew access token |

### Why This Approach?

**Traditional approach (localStorage):**
```typescript
// ❌ VULNERABLE TO XSS
localStorage.setItem('token', accessToken); // Attacker can steal via XSS
```

**Our approach:**
```typescript
// ✅ XSS-SAFE
// Access token in memory - lost on refresh, but immediately restored
// Refresh token in HttpOnly cookie - JavaScript cannot access
const accessToken = ref<string | null>(null); // Memory only
// Cookie: { httpOnly: true, secure: true, sameSite: 'strict' }
```

### Security Flow
```
┌─────────────────────────────────────────────────────┐
│ 1. Login → Backend sets refresh token in HttpOnly  │
│            Frontend stores access token in memory   │
├─────────────────────────────────────────────────────┤
│ 2. API Call → Access token from memory in header   │
│              If 401, automatic refresh using cookie │
├─────────────────────────────────────────────────────┤
│ 3. Page Refresh → Access token lost (memory)       │
│                 → Auto-refresh using cookie         │
│                 → New access token retrieved        │
├─────────────────────────────────────────────────────┤
│ 4. Logout → Backend clears HttpOnly cookie         │
│           → Frontend clears memory                  │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Setup Pinia
```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

### 2. Initialize Auth Plugin
```typescript
// main.ts
import { createAuth } from '@sottosviluppo/auth-frontend';

app.use(createAuth({
  apiBaseUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  // Optional: custom HTTP client (default: AxiosHttpClient)
  // httpClient: myCustomHttpClient,
  // Optional: custom storage (default: MemoryTokenStorage - recommended)
  // storage: myCustomStorage,
  redirectOnUnauth: '/login',
  redirectOnLogin: '/dashboard',
  autoRefreshToken: true,       // Automatic token refresh
  refreshBeforeExpiry: 60000,   // Refresh 1 min before expiry
}));
```

### 3. Basic Usage
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@sottosviluppo/auth-frontend';

const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();

const credentials = ref({
  email: '',
  password: '',
});

async function handleLogin() {
  await login(credentials.value);
}
</script>

<template>
  <div v-if="!isAuthenticated">
    <form @submit.prevent="handleLogin">
      <input 
        v-model="credentials.email" 
        type="email" 
        placeholder="Email"
      />
      <input 
        v-model="credentials.password" 
        type="password" 
        placeholder="Password"
      />
      <button :disabled="isLoading" type="submit">
        {{ isLoading ? 'Loading...' : 'Login' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
  
  <div v-else>
    <p>Welcome, {{ user?.email }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>
```

## 🔄 Token Refresh Behavior

### Automatic Refresh on Page Load
```typescript
// When app starts
if (hasRefreshTokenCookie()) {
  // Automatically refresh access token
  await authStore.refreshToken();
  // Access token now in memory, user logged in
}
```

### Automatic Refresh Before Expiry
```typescript
// Plugin automatically schedules refresh
// Default: 60 seconds before token expires
createAuth({
  autoRefreshToken: true,
  refreshBeforeExpiry: 60000, // 1 minute
});

// Token expires in 15 minutes
// → Refresh scheduled for 14 minutes
// → New token obtained seamlessly
// → User never experiences interruption
```

### Automatic Refresh on 401
```typescript
// API interceptor handles 401 automatically
try {
  await api.get('/protected-resource');
} catch (error) {
  // 401 detected → try refresh
  // If refresh succeeds → retry original request
  // If refresh fails → redirect to login
}
```

### Manual Refresh (Rarely Needed)
```typescript
const { refreshToken } = useAuth();
await refreshToken(); // Force refresh now
```

## Composables

### useAuth()

Main authentication composable providing reactive state and methods.
```typescript
const {
  // Reactive State
  user,              // Current user (IUser | null)
  isAuthenticated,   // Boolean authentication state
  isLoading,         // Loading state for async operations
  error,             // Error message (if any)
  userName,          // Computed: "First Last" or username or email
  userInitials,      // Computed: "FL" for avatar
  userPermissions,   // Array of permission strings
  userRoles,         // Array of role names
  
  // Methods
  login,             // Login with credentials
  register,          // Register new user
  logout,            // Logout and clear state
  fetchCurrentUser,  // Refresh user data from API
  refreshToken,      // Manually refresh access token
  clearError,        // Clear error state
} = useAuth();
```

**Example - Login Form:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@sottosviluppo/auth-frontend';

const { login, isLoading, error, clearError } = useAuth();

const form = ref({
  email: '',
  password: '',
});

async function handleSubmit() {
  clearError();
  
  try {
    await login(form.value);
    // Redirect handled by plugin configuration
  } catch (err) {
    // Error already in error ref
    console.error('Login failed:', err);
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" type="email" required />
    <input v-model="form.password" type="password" required />
    <button :disabled="isLoading">
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>
    <div v-if="error" class="error">{{ error }}</div>
  </form>
</template>
```

### useUser()

User-specific utilities and computed properties.
```typescript
const {
  // Computed Properties
  user,                  // Current user
  fullName,              // "John Doe"
  displayName,           // "John" or username or email
  email,                 // User email
  hasVerifiedEmail,      // Email verification status
  status,                // UserStatus enum
  isActive,              // status === 'active'
  isSuspended,           // status === 'suspended'
  isPendingVerification, // status === 'pending_verification'
  roles,                 // Array of IRole
  roleNames,             // Array of role names
  
  // Methods
  hasRole,               // Check single role
  hasAnyRole,            // Check any of multiple roles
  hasAllRoles,           // Check all roles
} = useUser();
```

**Example - Profile Display:**
```vue
<script setup lang="ts">
import { useUser } from '@sottosviluppo/auth-frontend';

const { 
  fullName, 
  email, 
  hasVerifiedEmail, 
  isActive 
} = useUser();
</script>

<template>
  <div class="profile">
    <h2>{{ fullName }}</h2>
    <p>{{ email }}</p>
    
    <div v-if="!hasVerifiedEmail" class="warning">
      Please verify your email address
    </div>
    
    <div v-if="!isActive" class="error">
      Your account is not active
    </div>
  </div>
</template>
```

### usePermissions()

Permission checking utilities for authorization.
```typescript
const {
  permissions,  // Array of all user permissions
  can,          // Check single permission
  canAny,       // Check any permission
  canAll,       // Check all permissions
  canManage,    // Check manage permission
} = usePermissions();
```

**Example - Conditional UI:**
```vue
<script setup lang="ts">
import { usePermissions } from '@sottosviluppo/auth-frontend';

const { can, canAny, canAll } = usePermissions();
</script>

<template>
  <div>
    <!-- Single permission -->
    <button v-if="can('users:create')" @click="createUser">
      Create User
    </button>
    
    <!-- Any permission (OR logic) -->
    <div v-if="canAny(['users:update', 'users:delete'])">
      <button>Edit</button>
      <button>Delete</button>
    </div>
    
    <!-- All permissions (AND logic) -->
    <button v-if="canAll(['products:create', 'products:update'])">
      Bulk Import Products
    </button>
  </div>
</template>
```

### usePasswordStrength()

Real-time password strength feedback with GDPR compliance.
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePasswordStrength } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const password = ref('');

const {
  strength,       // 0-4 score
  strengthLabel,  // "Weak", "Fair", "Good", "Strong"
  strengthColor,  // Hex color for indicator
  errors,         // Array of error messages
  isValid,        // Boolean validity
  progressValue,  // 0-100 for progress bar
} = usePasswordStrength(
  password,
  undefined, // Optional user context
  {
    errorMessages: {
      [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
      [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
      [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
      [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
      [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
      [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
      [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
    },
  }
);
</script>

<template>
  <div>
    <input v-model="password" type="password" />
    
    <!-- Strength indicator -->
    <div class="strength-meter">
      <div 
        class="strength-bar" 
        :style="{ 
          width: `${progressValue}%`, 
          backgroundColor: strengthColor 
        }"
      />
    </div>
    
    <p :style="{ color: strengthColor }">
      Strength: {{ strengthLabel }}
    </p>
    
    <!-- Error messages -->
    <ul v-if="errors.length > 0" class="errors">
      <li v-for="error in errors" :key="error">
        {{ error }}
      </li>
    </ul>
  </div>
</template>
```

### usePasswordRecovery()

Password recovery and reset flows.
```typescript
const {
  isLoading,
  error,
  successMessage,
  forgotPassword,   // Request password reset
  resetPassword,    // Reset with token
  setPassword,      // Set password from invitation
  validateToken,    // Validate token without consuming
  clearMessages,    // Clear error/success messages
} = usePasswordRecovery();
```

**Example - Forgot Password:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePasswordRecovery } from '@sottosviluppo/auth-frontend';

const { 
  forgotPassword, 
  isLoading, 
  error, 
  successMessage 
} = usePasswordRecovery();

const email = ref('');

async function handleSubmit() {
  await forgotPassword(
    email.value,
    'https://app.com/reset-password'
  );
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="email" type="email" required />
    <button :disabled="isLoading">
      {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
    </button>
    
    <div v-if="successMessage" class="success">
      {{ successMessage }}
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </form>
</template>
```

## 🌍 Internationalization (i18n)

### useAuthValidation() - i18n-Ready Validation

Create validation schemas with your own translations:
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';

const { t } = useI18n();

// Create schemas with translated messages
const { loginSchema, registerSchema } = useAuthValidation(() => ({
  messages: {
    email: {
      invalid: t('validation.email.invalid'),
      required: t('validation.email.required'),
    },
    password: {
      required: t('validation.password.required'),
      minLength: t('validation.password.minLength'),
      notStrong: t('validation.password.notStrong'),
      containsPersonalData: t('validation.password.containsPersonalData'),
      mismatch: t('validation.password.mismatch'),
    },
    username: {
      invalid: t('validation.username.invalid'),
    },
    token: {
      required: t('validation.token.required'),
    },
  },
  passwordMessages: {
    [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
    [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
    [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
    [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
    [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
    [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
    [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
  },
}));

// Schemas update automatically when locale changes!
const result = loginSchema.value.safeParse(formData.value);
</script>
```

### Example i18n Translations
```typescript
// locales/en.ts
export default {
  validation: {
    email: {
      invalid: 'Invalid email address',
      required: 'Email is required',
    },
    password: {
      required: 'Password is required',
      minLength: 'Password must be at least 12 characters',
      notStrong: 'Password does not meet security requirements',
      mismatch: "Passwords don't match",
      tooShort: 'Password must be at least 12 characters',
      noUppercase: 'Must contain at least one uppercase letter',
      noLowercase: 'Must contain at least one lowercase letter',
      noNumber: 'Must contain at least one number',
      noSpecialChar: 'Must contain at least one special character',
      containsPersonalData: 'Password cannot contain your personal information',
      commonPassword: 'This password is too common',
    },
    username: {
      invalid: 'Username can only contain letters, numbers, dashes and underscores',
    },
    token: {
      required: 'Token is required',
    },
  },
};

// locales/it.ts
export default {
  validation: {
    email: {
      invalid: 'Indirizzo email non valido',
      required: 'Email obbligatoria',
    },
    password: {
      required: 'Password obbligatoria',
      minLength: 'La password deve contenere almeno 12 caratteri',
      notStrong: 'La password non soddisfa i requisiti di sicurezza',
      mismatch: 'Le password non corrispondono',
      tooShort: 'La password deve contenere almeno 12 caratteri',
      noUppercase: 'Deve contenere almeno una lettera maiuscola',
      noLowercase: 'Deve contenere almeno una lettera minuscola',
      noNumber: 'Deve contenere almeno un numero',
      noSpecialChar: 'Deve contenere almeno un carattere speciale',
      containsPersonalData: 'La password non può contenere i tuoi dati personali',
      commonPassword: 'Questa password è troppo comune',
    },
    // ...
  },
};
```

### Helper Composable (Recommended)

Create a helper in your app to avoid repetition:
```typescript
// src/composables/useAppValidation.ts
import { useI18n } from 'vue-i18n';
import { useAuthValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';

export function useAppValidation() {
  const { t } = useI18n();
  
  return useAuthValidation(() => ({
    messages: {
      email: {
        invalid: t('validation.email.invalid'),
        required: t('validation.email.required'),
      },
      password: {
        required: t('validation.password.required'),
        minLength: t('validation.password.minLength'),
        notStrong: t('validation.password.notStrong'),
        containsPersonalData: t('validation.password.containsPersonalData'),
        mismatch: t('validation.password.mismatch'),
      },
      username: {
        invalid: t('validation.username.invalid'),
      },
      token: {
        required: t('validation.token.required'),
      },
    },
    passwordMessages: {
      [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
      [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
      [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
      [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
      [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
      [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
      [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
    },
  }));
}
```

Then use it:
```vue
<script setup>
import { useAppValidation } from '@/composables/useAppValidation';

const { loginSchema, registerSchema } = useAppValidation();
// Schemas are already translated and reactive!
</script>
```

## 🛡️ Router Integration

### Navigation Guards
```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import {
  requireAuth,
  requirePermissions,
  requireAnyPermission,
  requireRole,
  guestOnly,
} from '@sottosviluppo/auth-frontend';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: Login,
      beforeEnter: guestOnly, // Redirect if already logged in
    },
    {
      path: '/dashboard',
      component: Dashboard,
      beforeEnter: requireAuth, // Require authentication
    },
    {
      path: '/users',
      component: UserList,
      beforeEnter: requirePermissions(['users:list']),
    },
    {
      path: '/users/create',
      component: UserCreate,
      beforeEnter: requirePermissions(['users:create', 'users:read']),
    },
    {
      path: '/admin',
      component: AdminPanel,
      beforeEnter: requireRole(['admin', 'super-admin']),
    },
    {
      path: '/content',
      component: ContentPage,
      beforeEnter: requireAnyPermission(['posts:read', 'pages:read']),
    },
  ],
});
```

### Directives
```vue
<script setup>
import { vCan, vRole } from '@sottosviluppo/auth-frontend';
</script>

<template>
  <!-- Permission-based rendering -->
  <button v-can="'users:create'">Create User</button>
  
  <!-- Multiple permissions (AND) -->
  <button v-can="['users:update', 'users:delete']">
    Edit & Delete
  </button>
  
  <!-- Multiple permissions (OR) -->
  <button v-can:any="['users:update', 'users:delete']">
    Edit or Delete
  </button>
  
  <!-- Role-based rendering -->
  <div v-role="'admin'">Admin Panel</div>
  
  <!-- Multiple roles (AND) -->
  <div v-role="['admin', 'editor']">Admin + Editor</div>
  
  <!-- Multiple roles (OR) -->
  <div v-role:any="['admin', 'editor']">Admin or Editor</div>
</template>
```

## 🎨 Components

### PasswordStrengthMeter

Headless component for password strength visualization:
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { 
  PasswordStrengthMeter 
} from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const password = ref('');

const errorMessages = {
  [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
  [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
  [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
  [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
  [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
  [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
  [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
};
</script>

<template>
  <div>
    <input v-model="password" type="password" />
    
    <PasswordStrengthMeter
      v-model="password"
      :error-messages="errorMessages"
      :show-errors="true"
      :show-label="true"
    />
  </div>
</template>
```

## ⚙️ Configuration Options
```typescript
interface AuthConfig {
  // Required
  apiBaseUrl: string;              // API base URL
  apiVersion: string;              // API version (e.g., 'v1')
  
  // Optional
  httpClient?: IHttpClient;        // Custom HTTP client
  storage?: ITokenStorage;         // Custom storage (default: MemoryTokenStorage)
  redirectOnUnauth?: string;       // Redirect path on 401 (default: '/login')
  redirectOnLogin?: string;        // Redirect path after login (default: '/')
  autoRefreshToken?: boolean;      // Auto-refresh before expiry (default: true)
  refreshBeforeExpiry?: number;    // Refresh X ms before expiry (default: 60000)
}
```

## 📦 Exports

### Composables
- `useAuth()` - Main authentication
- `useUser()` - User utilities
- `usePermissions()` - Permission checking
- `usePasswordStrength()` - Password strength meter
- `usePasswordRecovery()` - Password recovery flows
- `useAuthValidation()` - i18n validation schemas
- `useUserManagement()` - Admin user CRUD
- `useRoleManagement()` - Admin role CRUD

### Stores
- `useAuthStore()` - Pinia authentication store
- `useUserManagementStore()` - User management store
- `useRoleManagementStore()` - Role management store

### Components
- `PasswordStrengthMeter` - Password strength component

### Router Guards
- `requireAuth` - Require authentication
- `requirePermissions` - Require specific permissions
- `requireAnyPermission` - Require any permission
- `requireRole` - Require specific role
- `guestOnly` - Guest-only routes

### Directives
- `vCan` - Permission-based rendering
- `vRole` - Role-based rendering

### Validation Schemas (Default - English)
- `loginSchema`
- `registerSchema`
- `resetPasswordSchema`
- `setPasswordSchema`
- `forgotPasswordSchema`
- `passwordSchema`

### Factory Functions (i18n)
- `createValidationSchemas()` - Create schemas with custom messages

### Types
- `AuthConfig`
- `LoginCredentials`
- `RegisterData`
- `AuthResponse`
- `SchemaFactoryConfig`
- `UsePasswordStrengthOptions`

### Re-exports from @sottosviluppo/core
- `PasswordErrorKey`
- `IValidationMessages`
- `IPasswordErrorMessages`

## 🔄 Migration from Previous Version

If upgrading from localStorage-based auth:

**Before (localStorage):**
```typescript
// ❌ Vulnerable approach
const authStore = useAuthStore();
authStore.initialize({
  apiBaseUrl: 'http://localhost:3000',
  storage: 'localStorage', // Tokens in localStorage
});
```

**After (HttpOnly cookies):**
```typescript
// ✅ Secure approach
app.use(createAuth({
  apiBaseUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  // No storage config needed!
  // Access token: memory (default)
  // Refresh token: HttpOnly cookie (backend)
}));
```

No manual token management needed - it's all handled automatically!

## 🔍 Troubleshooting

### Token Not Persisting Across Refreshes
This is **expected behavior** with MemoryTokenStorage:
- Access token in memory → lost on refresh
- Refresh token in cookie → persists
- Auto-refresh restores access token immediately

### 401 Errors After Refresh
Check if:
1. Backend is setting refresh token cookie correctly
2. Cookie has correct `httpOnly`, `secure`, `sameSite` flags
3. Frontend `withCredentials: true` in axios config
4. API calls include credentials

### Auto-Refresh Not Working
Verify:
1. `autoRefreshToken: true` in config
2. Refresh token cookie exists
3. Backend `/auth/refresh` endpoint working
4. Token not expired beyond refresh window

### CORS Issues
Ensure backend allows:
```typescript
// Backend CORS config
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true, // Allow cookies
});
```

### TypeScript Errors
Clear cache and rebuild:
```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

## 🔗 Related Packages

- **[@sottosviluppo/core](../core)** - Shared types, validators, enums
- **[@sottosviluppo/auth-backend](../auth-backend)** - NestJS authentication module
- **[@sottosviluppo/frontend-core](../frontend-core)** - Frontend utilities

## 📄 License

UNLICENSED - Private package for internal use

---

**Quick Start Checklist:**

1. ✅ Install package and dependencies
2. ✅ Setup Pinia store
3. ✅ Initialize auth plugin with config
4. ✅ Setup i18n translations (optional)
5. ✅ Add router guards (optional)
6. ✅ Build your auth forms! 🚀

**Security First. Developer Experience Second. Always.**