# @sottosviluppo/core

Core package for Filcronet framework containing shared types, interfaces, enums, and validators.

## Features

- 📋 **Type-safe interfaces** for User, Role, Permission, API responses
- 🎯 **Universal enums** (UserStatus, PermissionAction)
- 🔧 **TypeScript utilities** (Nullable, Optional, DeepPartial)
- 🔒 **GDPR-compliant password validator** with i18n support
- 🌍 **Internationalization ready** (error keys for translations)
- 🚀 **Zero runtime dependencies** (pure TypeScript)

## Installation
```bash
pnpm add @sottosviluppo/core
```

## What's Included

### 📋 Interfaces

#### User Management
- **`IUser`** - User entity with status, roles, timestamps
- **`ICreateUserDto`** - DTO for user creation
- **`IUpdateUserDto`** - DTO for user updates

#### RBAC (Role-Based Access Control)
- **`IRole`** - Role entity with permissions
- **`ICreateRoleDto`** - DTO for role creation
- **`IUpdateRoleDto`** - DTO for role updates
- **`IPermission`** - Permission entity (resource:action pattern)
- **`PermissionString`** - Type for permission strings (e.g., `"users:create"`)

#### API Responses
- **`IApiResponse<T>`** - Standardized API response
- **`IApiError`** - Detailed error information
- **`IApiMeta`** - Response metadata
- **`IPaginatedResponse<T>`** - Paginated response
- **`IPagination`** - Pagination info
- **`IPaginationParams`** - Query params for pagination
- **`ITokenPair`** - JWT access + refresh tokens

#### Validation (i18n Support)
- **`IValidationMessages`** - Validation message provider for i18n
- **`IPasswordErrorMessages`** - Password error messages map

### 🎯 Enums

#### UserStatus
- `ACTIVE` - User can access system
- `INACTIVE` - Account disabled
- `SUSPENDED` - Temporary restriction
- `PENDING_VERIFICATION` - Email not verified

#### PermissionAction
- `CREATE` - Create resources
- `READ` - View single resource
- `UPDATE` - Modify resource
- `DELETE` - Remove resource
- `LIST` - Browse multiple resources
- `MANAGE` - Full access (super-permission)

#### PasswordErrorKey (i18n)
- `TooShort` - Password too short
- `NoUppercase` - Missing uppercase
- `NoLowercase` - Missing lowercase
- `NoNumber` - Missing number
- `NoSpecialChar` - Missing special character
- `ContainsPersonalData` - Contains user data
- `CommonPassword` - Too common/predictable

### 🔧 Type Utilities
```typescript
Nullable<T> = T | null
Optional<T> = T | undefined
DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> }
```

### 🔒 Password Validator

GDPR-compliant password validation following **ENISA guidelines** and **NIST SP 800-63B**.

## Usage Examples

### Backend (NestJS)

#### Type-Safe Entities
```typescript
import { IUser, UserStatus, Nullable } from "@sottosviluppo/core";

const user: IUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  status: UserStatus.ACTIVE,
  emailVerified: true,
  roles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Nullable return types
class UserService {
  async findByEmail(email: string): Promise<Nullable<IUser>> {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

#### API Response Formatting
```typescript
import { IApiResponse, IPaginatedResponse } from "@sottosviluppo/core";

// Standard response
const response: IApiResponse<IUser> = {
  success: true,
  data: user,
  message: "User retrieved successfully",
};

// Paginated response
const paginated: IPaginatedResponse<IUser> = {
  success: true,
  data: users,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
  },
};
```

#### Permission Checking
```typescript
import { PermissionString, PermissionAction } from "@sottosviluppo/core";

// Type-safe permission strings
const permission: PermissionString = "users:create";

function hasPermission(user: IUser, required: PermissionString): boolean {
  return user.roles
    .flatMap(role => role.permissions)
    .some(p => `${p.resource}:${p.action}` === required);
}

// Check for specific action
function canManageUsers(user: IUser): boolean {
  return hasPermission(user, `users:${PermissionAction.MANAGE}`);
}
```

### Frontend (Vue 3 with Zod)

#### Form Validation
```vue
<script setup lang="ts">
import { z } from "zod";
import { UserStatus, type IUser } from "@sottosviluppo/core";

// Zod schema for form validation
const userSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

// API response typing
const user = ref<IUser | null>(null);

async function fetchUser(id: string) {
  const response = await api.get<IApiResponse<IUser>>(`/users/${id}`);
  if (response.data.success) {
    user.value = response.data.data;
  }
}
</script>
```

#### API Client with Types
```typescript
import { IApiResponse, IApiError } from "@sottosviluppo/core";
import axios from "axios";

async function createUser(userData: any) {
  try {
    const { data } = await axios.post<IApiResponse<IUser>>(
      "/users",
      userData
    );

    if (data.success) {
      console.log("User created:", data.data);
    } else {
      data.errors?.forEach((err: IApiError) => {
        console.error(`${err.field}: ${err.message}`);
      });
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}
```

### Password Validation with i18n

#### Using Error Keys (Recommended)
```typescript
import {
  PasswordValidator,
  PasswordErrorKey,
  type PasswordValidationResult,
} from "@sottosviluppo/core";

const result: PasswordValidationResult = PasswordValidator.validatePassword(
  "MyPassword123",
  {
    email: "john@example.com",
    firstName: "John",
  }
);

if (!result.isValid) {
  // Map error keys to translations
  const errors = result.errorKeys.map((key) => {
    switch (key) {
      case PasswordErrorKey.TooShort:
        return t("validation.password.tooShort");
      case PasswordErrorKey.NoUppercase:
        return t("validation.password.noUppercase");
      case PasswordErrorKey.NoLowercase:
        return t("validation.password.noLowercase");
      case PasswordErrorKey.NoNumber:
        return t("validation.password.noNumber");
      case PasswordErrorKey.NoSpecialChar:
        return t("validation.password.noSpecialChar");
      case PasswordErrorKey.ContainsPersonalData:
        return t("validation.password.containsPersonalData");
      case PasswordErrorKey.CommonPassword:
        return t("validation.password.commonPassword");
      default:
        return "Unknown error";
    }
  });

  console.log("Errors:", errors);
}
```

#### Using Deprecated Method (Backward Compatibility)
```typescript
import { PasswordValidator } from "@sottosviluppo/core";

// Returns English error messages
const errors: string[] = PasswordValidator.getPasswordErrors("weak", {
  email: "user@example.com",
});
// ['Minimum 12 characters required', 'Must contain at least 3 of: uppercase...']
```

### Password Strength Meter
```typescript
import { PasswordValidator } from "@sottosviluppo/core";

const password = "MySecureP@ss2024";

// Get strength score (0-4)
const strength = PasswordValidator.getPasswordStrength(password); // 4

// Get label
const label = PasswordValidator.getStrengthLabel(strength); // "Strong"

// Quick check
const isStrong = PasswordValidator.isStrongPassword(password); // true

// Generate strong password (for testing)
const generated = PasswordValidator.generateStrongPassword();
// "Xy9#mK2$pQ7@"
```

### Deep Partial for Updates
```typescript
import { DeepPartial, IUser } from "@sottosviluppo/core";

type UpdateUserDto = DeepPartial<IUser>;

const update: UpdateUserDto = {
  firstName: "John",
  // All other fields optional
};

await userService.update(userId, update);
```

## Password Validator

### GDPR-Compliant Requirements

Based on **ENISA guidelines** and **NIST SP 800-63B**:

- ✅ Minimum **12 characters**
- ✅ At least **3 out of 4** character types:
  - Uppercase (A-Z)
  - Lowercase (a-z)
  - Numbers (0-9)
  - Special (!@#$%^&*...)
- ✅ No sequential characters (123, abc, qwerty)
- ✅ No repeated characters (aaa, 111)
- ✅ Cannot contain personal data

### Available Methods
```typescript
// Validate and get error keys (i18n-friendly) ⭐ Recommended
PasswordValidator.validatePassword(
  password: string,
  context?: { email?, username?, firstName?, lastName? }
): PasswordValidationResult

// Quick boolean check
PasswordValidator.isStrongPassword(password: string): boolean

// Get errors as English strings (deprecated)
PasswordValidator.getPasswordErrors(
  password: string,
  context?: object
): string[]

// Calculate strength (0-4)
PasswordValidator.getPasswordStrength(password: string): number

// Get strength label
PasswordValidator.getStrengthLabel(score: number): string

// Generate strong password (testing)
PasswordValidator.generateStrongPassword(): string
```

### Examples
```typescript
// ✅ Valid
"MySecureP@ss2024"
"Tr0ub4dor&3"
"C0mpl3x!Pass"

// ❌ Invalid
"short" // Too short
"alllowercase123" // Only 2 types
"Password123" // Contains "password"
"abc12345" // Sequential
"aaaBBB111" // Repeated
"john@doe.com" // Contains email
```

## Internationalization (i18n)

### Error Key Mapping
```typescript
import { PasswordErrorKey, IPasswordErrorMessages } from "@sottosviluppo/core";

const messages: IPasswordErrorMessages = {
  [PasswordErrorKey.TooShort]: t("password.tooShort"),
  [PasswordErrorKey.NoUppercase]: t("password.noUppercase"),
  [PasswordErrorKey.NoLowercase]: t("password.noLowercase"),
  [PasswordErrorKey.NoNumber]: t("password.noNumber"),
  [PasswordErrorKey.NoSpecialChar]: t("password.noSpecialChar"),
  [PasswordErrorKey.ContainsPersonalData]: t("password.containsPersonalData"),
  [PasswordErrorKey.CommonPassword]: t("password.commonPassword"),
};
```

### Validation Messages Interface
```typescript
import { IValidationMessages } from "@sottosviluppo/core";

const validationMessages: IValidationMessages = {
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
};
```

## Related Packages

- **[@sottosviluppo/auth-backend](../auth-backend)** - NestJS authentication module
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Vue 3 auth composables (coming soon)

## Validation Strategy

This package provides:
- ✅ **Password validation** (GDPR-compliant with i18n)
- ✅ **Error key mapping** for translations
- ✅ **Type definitions** for validation messages

For other validation:
- **Backend**: Use [class-validator](https://github.com/typestack/class-validator)
- **Frontend**: Use [Zod](https://github.com/colinhacks/zod)

## Why Core Package?

1. **Single Source of Truth** - One definition everywhere
2. **Type Safety** - Prevents type mismatches
3. **Consistency** - Same enums across all packages
4. **i18n Ready** - Error keys for translations
5. **GDPR Compliant** - Password validation follows standards
6. **Easy Updates** - Update once, reflects everywhere
7. **Zero Dependencies** - Pure TypeScript

## TypeScript Config

- `strict: true` - Maximum type safety
- `declaration: true` - Generates `.d.ts`
- `target: ES2020` - Modern JS
- `module: ESNext` - ESM modules

## Package Structure
```
@sottosviluppo/core/
├── dist/              # Compiled output
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── src/
│   ├── enums/        # Enumerations
│   ├── interfaces/   # Type definitions
│   ├── types/        # Utility types
│   ├── utils/        # Validators
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Version

Current version: **0.1.0** (Pre-release)

⚠️ **Pre-1.0.0 Status**: API may change. Not for production until 1.0.0.

## Examples

See [examples/auth](../../examples/auth) for usage with:
- NestJS backend
- Vue 3 frontend
- Password validation
- API response formatting

## License

UNLICENSED - Private package for Filcronet internal use