# @sottosviluppo/auth-frontend

Authentication composables, stores and utilities for Vue 3 applications with full i18n support.

## Features

- 🎣 Vue 3 Composables for reactive authentication state
- 🗄️ Pinia store for state management
- 🔒 Secure token storage (localStorage/sessionStorage)
- 🔑 Automatic token injection in API requests
- ✅ Permission checking utilities
- 🌍 **Full i18n support for validation messages**
- 🔐 **GDPR-compliant password validation**
- 📊 **Real-time password strength meter**
- 📝 TypeScript support with full type safety
- 🚀 Easy integration with existing Vue 3 projects

## Installation

```bash
pnpm add @sottosviluppo/auth-frontend @sottosviluppo/core
```

## Quick Start

### 1. Setup Pinia (if not already done)

```typescript
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
```

### 2. Initialize Auth Store

```typescript
// main.ts or App.vue
import { useAuthStore } from "@sottosviluppo/auth-frontend";

const authStore = useAuthStore();
authStore.initialize({
  apiBaseUrl: "http://localhost:3000",
  apiVersion: "v1",
  storage: "localStorage",
  redirectOnUnauth: "/login",
  redirectOnLogin: "/dashboard",
});
```

### 3. Basic Usage (Without i18n)

```vue
<script setup lang="ts">
import { useAuth, loginSchema } from "@sottosviluppo/auth-frontend";

const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();

const credentials = ref({
  email: "",
  password: "",
});

async function handleLogin() {
  const result = loginSchema.safeParse(credentials.value);

  if (!result.success) {
    console.error(result.error.errors);
    return;
  }

  await login(credentials.value);
}
</script>

<template>
  <div v-if="!isAuthenticated">
    <form @submit.prevent="handleLogin">
      <input v-model="credentials.email" type="email" placeholder="Email" />
      <input
        v-model="credentials.password"
        type="password"
        placeholder="Password"
      />
      <button :disabled="isLoading" type="submit">
        {{ isLoading ? "Loading..." : "Login" }}
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

## Composables

### useAuth()

Main authentication composable.

```typescript
const {
  user, // Current user (reactive)
  isAuthenticated, // Boolean authentication state
  isLoading, // Loading state for async operations
  error, // Error message (if any)
  userName, // Computed user display name
  userInitials, // Computed user initials
  login, // Login function
  register, // Register function
  logout, // Logout function
  fetchCurrentUser, // Refresh user data
  refreshToken, // Refresh JWT token
  clearError, // Clear error state
} = useAuth();
```

### useUser()

User-specific utilities.

```typescript
const {
  user, // Current user
  fullName, // Full name (firstName + lastName)
  displayName, // Display name (firstName or username)
  email, // User email
  hasVerifiedEmail, // Email verification status
  status, // User status
  isActive, // Is account active
  isSuspended, // Is account suspended
  isPendingVerification, // Is pending verification
  roles, // User roles
  roleNames, // Array of role names
  hasRole, // Check if user has role
  hasAnyRole, // Check if user has any role
  hasAllRoles, // Check if user has all roles
} = useUser();
```

### usePermissions()

Permission checking utilities.

```typescript
const {
  permissions, // Array of all user permissions
  can, // Check single permission
  canAny, // Check if has any permission
  canAll, // Check if has all permissions
  canManage, // Check if can manage resource
} = usePermissions();
```

### usePasswordStrength()

Real-time password strength feedback with GDPR compliance.

```vue
<script setup lang="ts">
import { usePasswordStrength } from "@sottosviluppo/auth-frontend";
import { PasswordErrorKey } from "@sottosviluppo/core";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const password = ref("");

// With i18n support
const {
  strength,
  strengthLabel,
  strengthColor,
  errors,
  isValid,
  progressValue,
} = usePasswordStrength(password, undefined, {
  errorMessages: {
    [PasswordErrorKey.TooShort]: t("validation.password.tooShort"),
    [PasswordErrorKey.NoUppercase]: t("validation.password.noUppercase"),
    [PasswordErrorKey.NoLowercase]: t("validation.password.noLowercase"),
    [PasswordErrorKey.NoNumber]: t("validation.password.noNumber"),
    [PasswordErrorKey.NoSpecialChar]: t("validation.password.noSpecialChar"),
    [PasswordErrorKey.ContainsPersonalData]: t(
      "validation.password.containsPersonalData"
    ),
    [PasswordErrorKey.CommonPassword]: t("validation.password.commonPassword"),
  },
});
</script>

<template>
  <div>
    <input v-model="password" type="password" />

    <!-- Strength indicator -->
    <div class="strength-meter">
      <div
        class="strength-bar"
        :style="{ width: `${progressValue}%`, backgroundColor: strengthColor }"
      />
    </div>
    <p :style="{ color: strengthColor }">{{ strengthLabel }}</p>

    <!-- Error messages -->
    <ul v-if="errors.length">
      <li v-for="error in errors" :key="error">{{ error }}</li>
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
  forgotPassword, // Request password reset
  resetPassword, // Reset password with token
  setPassword, // Set password from invitation
  validateToken, // Validate token without consuming it
  clearMessages, // Clear error and success messages
} = usePasswordRecovery();
```

## Internationalization (i18n) Support

### useValidation() - i18n-Ready Validation

Create validation schemas with your own translations:

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useValidation } from "@sottosviluppo/auth-frontend";
import { PasswordErrorKey } from "@sottosviluppo/core";

const { t } = useI18n();

// Create schemas with translated messages
const { loginSchema, registerSchema } = useValidation(() => ({
  messages: {
    email: {
      invalid: t("validation.email.invalid"),
      required: t("validation.email.required"),
    },
    password: {
      required: t("validation.password.required"),
      minLength: t("validation.password.minLength"),
      notStrong: t("validation.password.notStrong"),
      containsPersonalData: t("validation.password.containsPersonalData"),
      mismatch: t("validation.password.mismatch"),
    },
    username: {
      invalid: t("validation.username.invalid"),
    },
    token: {
      required: t("validation.token.required"),
    },
  },
  passwordMessages: {
    [PasswordErrorKey.TooShort]: t("validation.password.tooShort"),
    [PasswordErrorKey.NoUppercase]: t("validation.password.noUppercase"),
    [PasswordErrorKey.NoLowercase]: t("validation.password.noLowercase"),
    [PasswordErrorKey.NoNumber]: t("validation.password.noNumber"),
    [PasswordErrorKey.NoSpecialChar]: t("validation.password.noSpecialChar"),
    [PasswordErrorKey.ContainsPersonalData]: t(
      "validation.password.containsPersonalData"
    ),
    [PasswordErrorKey.CommonPassword]: t("validation.password.commonPassword"),
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
      invalid: "Invalid email address",
      required: "Email is required",
    },
    password: {
      required: "Password is required",
      minLength: "Password must be at least 12 characters",
      notStrong: "Password does not meet security requirements",
      mismatch: "Passwords don't match",
      tooShort: "Password must be at least 12 characters",
      noUppercase: "Must contain at least one uppercase letter",
      noLowercase: "Must contain at least one lowercase letter",
      noNumber: "Must contain at least one number",
      noSpecialChar: "Must contain at least one special character",
      containsPersonalData: "Password cannot contain your personal information",
      commonPassword: "This password is too common",
    },
    username: {
      invalid:
        "Username can only contain letters, numbers, dashes and underscores",
    },
    token: {
      required: "Token is required",
    },
  },
};

// locales/it.ts
export default {
  validation: {
    email: {
      invalid: "Indirizzo email non valido",
      required: "Email obbligatoria",
    },
    password: {
      required: "Password obbligatoria",
      minLength: "La password deve contenere almeno 12 caratteri",
      notStrong: "La password non soddisfa i requisiti di sicurezza",
      mismatch: "Le password non corrispondono",
      tooShort: "La password deve contenere almeno 12 caratteri",
      noUppercase: "Deve contenere almeno una lettera maiuscola",
      noLowercase: "Deve contenere almeno una lettera minuscola",
      noNumber: "Deve contenere almeno un numero",
      noSpecialChar: "Deve contenere almeno un carattere speciale",
      containsPersonalData:
        "La password non può contenere i tuoi dati personali",
      commonPassword: "Questa password è troppo comune",
    },
    // ...
  },
};
```

## Usage Examples

### Registration with i18n Validation

```vue
<script setup lang="ts">
import { useAuth, useValidation } from "@sottosviluppo/auth-frontend";
import { useI18n } from "vue-i18n";
import { PasswordErrorKey } from "@sottosviluppo/core";

const { t } = useI18n();
const { register, isLoading } = useAuth();

const { registerSchema } = useValidation(() => ({
  messages: {
    email: {
      invalid: t("validation.email.invalid"),
      required: t("validation.email.required"),
    },
    password: {
      required: t("validation.password.required"),
      minLength: t("validation.password.minLength"),
      notStrong: t("validation.password.notStrong"),
      containsPersonalData: t("validation.password.containsPersonalData"),
      mismatch: t("validation.password.mismatch"),
    },
    username: {
      invalid: t("validation.username.invalid"),
    },
    token: {
      required: t("validation.token.required"),
    },
  },
  passwordMessages: {
    [PasswordErrorKey.TooShort]: t("validation.password.tooShort"),
    [PasswordErrorKey.NoUppercase]: t("validation.password.noUppercase"),
    [PasswordErrorKey.NoLowercase]: t("validation.password.noLowercase"),
    [PasswordErrorKey.NoNumber]: t("validation.password.noNumber"),
    [PasswordErrorKey.NoSpecialChar]: t("validation.password.noSpecialChar"),
    [PasswordErrorKey.ContainsPersonalData]: t(
      "validation.password.containsPersonalData"
    ),
    [PasswordErrorKey.CommonPassword]: t("validation.password.commonPassword"),
  },
}));

const formData = ref({
  email: "",
  password: "",
  confirmPassword: "",
});

const errors = ref<Record<string, string>>({});

async function handleRegister() {
  const result = registerSchema.value.safeParse(formData.value);

  if (!result.success) {
    errors.value = {};
    result.error.errors.forEach((error) => {
      const path = error.path.join(".");
      errors.value[path] = error.message;
    });
    return;
  }

  await register(result.data);
}
</script>
```

### Permission-based UI

```vue
<script setup>
import { usePermissions } from "@sottosviluppo/auth-frontend";

const { can, canAny } = usePermissions();
</script>

<template>
  <div>
    <button v-if="can('users:create')" @click="createUser">Create User</button>

    <div v-if="canAny(['users:update', 'users:delete'])">
      <button>Edit</button>
      <button>Delete</button>
    </div>
  </div>
</template>
```

### Helper Composable (Recommended for i18n)

Create a helper in your app to avoid repetition:

```typescript
// src/composables/useAppValidation.ts
import { useI18n } from "vue-i18n";
import { useValidation } from "@sottosviluppo/auth-frontend";
import { PasswordErrorKey } from "@sottosviluppo/core";

export function useAppValidation() {
  const { t } = useI18n();

  return useValidation(() => ({
    messages: {
      email: {
        invalid: t("validation.email.invalid"),
        required: t("validation.email.required"),
      },
      password: {
        required: t("validation.password.required"),
        minLength: t("validation.password.minLength"),
        notStrong: t("validation.password.notStrong"),
        containsPersonalData: t("validation.password.containsPersonalData"),
        mismatch: t("validation.password.mismatch"),
      },
      username: {
        invalid: t("validation.username.invalid"),
      },
      token: {
        required: t("validation.token.required"),
      },
    },
    passwordMessages: {
      [PasswordErrorKey.TooShort]: t("validation.password.tooShort"),
      [PasswordErrorKey.NoUppercase]: t("validation.password.noUppercase"),
      [PasswordErrorKey.NoLowercase]: t("validation.password.noLowercase"),
      [PasswordErrorKey.NoNumber]: t("validation.password.noNumber"),
      [PasswordErrorKey.NoSpecialChar]: t("validation.password.noSpecialChar"),
      [PasswordErrorKey.ContainsPersonalData]: t(
        "validation.password.containsPersonalData"
      ),
      [PasswordErrorKey.CommonPassword]: t(
        "validation.password.commonPassword"
      ),
    },
  }));
}
```

Then use it:

```vue
<script setup>
import { useAppValidation } from "@/composables/useAppValidation";

const { loginSchema, registerSchema } = useAppValidation();
// Schemas are already translated and reactive!
</script>
```

## Default Validation Schemas (English Only)

If you don't need i18n, use the default schemas:

```typescript
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  setPasswordSchema,
  forgotPasswordSchema,
} from "@sottosviluppo/auth-frontend";

// These have hardcoded English messages
const result = loginSchema.safeParse(credentials);
```

## API Configuration

```typescript
interface AuthConfig {
  apiBaseUrl: string; // Required: API base URL
  apiVersion?: string; // Optional: API version (e.g., 'v1')
  storage?: "localStorage" | "sessionStorage"; // Default: 'localStorage'
  redirectOnUnauth?: string; // Default: '/login'
  redirectOnLogin?: string; // Default: '/'
  autoRefreshToken?: boolean; // Default: false
  refreshInterval?: number; // Default: 300000 (5 min)
}
```

## Exports

### Composables

- `useAuth()` - Main authentication composable
- `useUser()` - User utilities
- `usePermissions()` - Permission checking
- `usePasswordStrength()` - Password strength meter with i18n
- `usePasswordRecovery()` - Password recovery flows
- `useValidation()` - i18n-ready validation schemas

### Stores

- `useAuthStore()` - Pinia authentication store

### Validation Schemas (Default - English)

- `loginSchema`
- `registerSchema`
- `resetPasswordSchema`
- `setPasswordSchema`
- `forgotPasswordSchema`
- `passwordSchema`
- `createRegisterSchema()`

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

## Migration from Hardcoded Messages

If you have existing code using the default schemas:

```typescript
// Before (still works!)
import { loginSchema } from "@sottosviluppo/auth-frontend";

// After (with i18n)
import { useValidation } from "@sottosviluppo/auth-frontend";
const { loginSchema } = useValidation(() => ({
  /* your messages */
}));
```

Both approaches are fully supported!

## License

UNLICENSED - Private package for Filcronet internal use
