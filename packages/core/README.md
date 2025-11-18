# @sottosviluppo/filcronet-core

Core package for Filcronet framework containing shared types, interfaces, enums and validators.

## Installation

```bash
pnpm add @sottosviluppo/filcronet-core
```

## What's Included

### 📋 Interfaces

Common data structures used across the framework:

#### User Management

- **`IUser`** - User entity structure with status, roles and timestamps
- **`ICreateUserDto`** - Data transfer object for user creation
- **`IUpdateUserDto`** - Data transfer object for user updates

#### RBAC (Role-Based Access Control)

- **`IRole`** - Role entity with permissions
- **`ICreateRoleDto`** - DTO for role creation
- **`IUpdateRoleDto`** - DTO for role updates
- **`IPermission`** - Permission entity (resource:action pattern)
- **`PermissionString`** - Type helper for permission strings (e.g., `'users:create'`)

#### API Responses

- **`IApiResponse<T>`** - Standardized API response wrapper
- **`IApiError`** - Detailed error information
- **`IApiMeta`** - Response metadata (timestamp, requestId)
- **`IPaginatedResponse<T>`** - Paginated response with metadata
- **`IPagination`** - Pagination information
- **`IPaginationParams`** - Query parameters for pagination and sorting
- **`ITokenPair`** - JWT access and refresh tokens

#### Validation (i18n Support)

- **`IValidationMessages`** - Validation message provider interface for i18n
- **`IPasswordErrorMessages`** - Password error messages map for i18n

### 🎯 Enums

Constant values for type safety:

- **`UserStatus`** - User account statuses

  - `ACTIVE` - User can access the system
  - `INACTIVE` - User account disabled
  - `SUSPENDED` - Temporary restriction
  - `PENDING_VERIFICATION` - Email not verified yet

- **`PermissionAction`** - Permission actions

  - `CREATE` - Create new resources
  - `READ` - View single resource
  - `UPDATE` - Modify existing resource
  - `DELETE` - Remove resource
  - `LIST` - Browse multiple resources
  - `MANAGE` - Full access (all actions)

- **`PermissionResource`** - Base system resources

  - `USERS` - User management
  - `ROLES` - Role management
  - `PERMISSIONS` - Permission management
  - `FILES` - File upload/management

- **`PasswordErrorKey`** - Password validation error keys for i18n
  - `TooShort` - Password too short
  - `NoUppercase` - Missing uppercase letter
  - `NoLowercase` - Missing lowercase letter
  - `NoNumber` - Missing number
  - `NoSpecialChar` - Missing special character
  - `ContainsPersonalData` - Contains user personal data
  - `CommonPassword` - Too common or predictable

### 🔧 Type Utilities

Essential TypeScript helper types:

- **`Nullable<T>`** - Makes type nullable (`T | null`)
- **`Optional<T>`** - Makes type optional (`T | undefined`)
- **`DeepPartial<T>`** - Makes all nested properties optional recursively

### 🔐 Validators

GDPR-compliant password validation:

- **`PasswordValidator`** - Static class with password strength validation methods
- **`PasswordValidationResult`** - Password validation result with error keys

## Usage Examples

### Backend (NestJS)

#### User Entity with Type Safety

```typescript
import { IUser, UserStatus, Nullable } from "@sottosviluppo/filcronet-core";

// Type-safe user entity
const user: IUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  status: UserStatus.ACTIVE,
  emailVerified: true,
  roles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Nullable return type for queries
class UserService {
  async findByEmail(email: string): Promise<Nullable<UserEntity>> {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

#### API Response Formatting

```typescript
import {
  IApiResponse,
  IPaginatedResponse,
} from "@sottosviluppo/filcronet-core";

// Standard response
const response: IApiResponse<IUser> = {
  success: true,
  data: user,
  message: "User retrieved successfully",
};

// Paginated response
const paginatedResponse: IPaginatedResponse<IUser> = {
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
import { PermissionString } from "@sottosviluppo/filcronet-core";

// Type-safe permission strings
const permission: PermissionString = "users:create";

function hasPermission(user: IUser, permission: PermissionString): boolean {
  return user.roles
    .flatMap((role) => role.permissions)
    .some((p) => `${p.resource}:${p.action}` === permission);
}
```

### Frontend (Vue 3 with Zod)

#### Form Validation

```vue
<script setup lang="ts">
import { z } from "zod";
import { UserStatus, type IUser } from "@sottosviluppo/filcronet-core";

// Define validation schema
const userSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Use IUser type for API responses
const user = ref<IUser | null>(null);

async function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  user.value = response.data as IUser;
}
</script>
```

#### API Response Handling

```typescript
import { IApiResponse, IApiError } from "@sottosviluppo/filcronet-core";

async function createUser(userData: any) {
  try {
    const response = await api.post<IApiResponse<IUser>>("/users", userData);

    if (response.data.success) {
      console.log("User created:", response.data.data);
    } else {
      console.error("Errors:", response.data.errors);
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
} from "@sottosviluppo/filcronet-core";

// Validate password and get error keys
const result: PasswordValidationResult = PasswordValidator.validatePassword(
  "MyPassword123",
  {
    email: "john@example.com",
    firstName: "John",
  }
);

if (!result.isValid) {
  // Map error keys to your translations
  const translatedErrors = result.errorKeys.map((key) => {
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

  console.log("Password errors:", translatedErrors);
}
```

#### Using Deprecated Method (Backward Compatibility)

```typescript
import { PasswordValidator } from "@sottosviluppo/filcronet-core";

// Returns English error messages
const errors: string[] = PasswordValidator.getPasswordErrors("weak", {
  email: "user@example.com",
});
// ['Minimum 12 characters required', 'Must contain at least 3 of: uppercase...']
```

### Password Strength Meter

```typescript
import { PasswordValidator } from "@sottosviluppo/filcronet-core";

const password = "MySecureP@ss2024";

// Get strength score (0-4)
const strength = PasswordValidator.getPasswordStrength(password); // 4

// Get user-friendly label
const label = PasswordValidator.getStrengthLabel(strength); // "Strong"

// Check if password is strong enough
const isValid = PasswordValidator.isStrongPassword(password); // true

// Generate a random strong password (for testing)
const generated = PasswordValidator.generateStrongPassword();
```

### Deep Partial for Updates

```typescript
import { DeepPartial, IUser } from "@sottosviluppo/filcronet-core";

// Update with nested optional fields
type UpdateUserDto = DeepPartial<IUser>;

const update: UpdateUserDto = {
  firstName: "John",
  // All other fields are optional
};

await userService.update(userId, update);
```

### Nullable Types for Database Queries

```typescript
import { Nullable } from "@sottosviluppo/filcronet-core";

class UserRepository {
  async findByUsername(username: string): Promise<Nullable<User>> {
    const user = await this.db.findOne({ where: { username } });
    return user || null; // Explicitly nullable
  }
}
```

## Password Validator

### GDPR-Compliant Password Validation

The `PasswordValidator` class provides comprehensive password validation based on **ENISA guidelines** and **NIST SP 800-63B**:

**Requirements:**

- ✅ Minimum 12 characters
- ✅ At least 3 out of 4 character types:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&\*...)
- ✅ No sequential characters (e.g., "123", "abc", "qwerty")
- ✅ No repeated characters (e.g., "aaa", "111")
- ✅ Cannot contain personal data (name, email, username)

### Available Methods

```typescript
// Check if password is strong (boolean)
PasswordValidator.isStrongPassword(password: string): boolean

// Get validation errors as keys (for i18n) ⭐ Recommended
PasswordValidator.validatePassword(
  password: string,
  userContext?: { email?, username?, firstName?, lastName? }
): PasswordValidationResult

// Get validation errors as English messages (deprecated)
PasswordValidator.getPasswordErrors(
  password: string,
  userContext?: { email?, username?, firstName?, lastName? }
): string[]

// Calculate strength score (0-4)
PasswordValidator.getPasswordStrength(password: string): number

// Get strength label ("Very Weak" to "Strong")
PasswordValidator.getStrengthLabel(score: number): string

// Generate a strong password (for testing)
PasswordValidator.generateStrongPassword(): string
```

## Internationalization (i18n) Support

### Password Error Keys

Use `PasswordErrorKey` enum to map validation errors to your translations:

```typescript
import {
  PasswordErrorKey,
  IPasswordErrorMessages,
} from "@sottosviluppo/filcronet-core";

const passwordMessages: IPasswordErrorMessages = {
  [PasswordErrorKey.TooShort]: t("validation.password.tooShort"),
  [PasswordErrorKey.NoUppercase]: t("validation.password.noUppercase"),
  [PasswordErrorKey.NoLowercase]: t("validation.password.noLowercase"),
  [PasswordErrorKey.NoNumber]: t("validation.password.noNumber"),
  [PasswordErrorKey.NoSpecialChar]: t("validation.password.noSpecialChar"),
  [PasswordErrorKey.ContainsPersonalData]: t(
    "validation.password.containsPersonalData"
  ),
  [PasswordErrorKey.CommonPassword]: t("validation.password.commonPassword"),
};
```

### Validation Message Interfaces

Implement `IValidationMessages` in your application for type-safe i18n:

```typescript
import { IValidationMessages } from "@sottosviluppo/filcronet-core";

const messages: IValidationMessages = {
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

This package is used by:

- **[@sottosviluppo/filcronet-auth-backend](../auth-backend)** - NestJS authentication module
- **[@sottosviluppo/filcronet-auth-frontend](../auth-frontend)** - Vue 3 authentication composables

## Validation Strategy

This package provides:

- ✅ **Password validation**: GDPR-compliant with i18n support
- ✅ **Error key mapping**: `PasswordErrorKey` enum for translations
- ✅ **Type definitions**: Interfaces for validation messages

For other validation needs:

- **Backend**: Use [class-validator](https://github.com/typestack/class-validator) with NestJS
- **Frontend**: Use [Zod](https://github.com/colinhacks/zod) for schema validation

## Why Core Package?

The core package ensures:

1. **Single Source of Truth** - One definition of data structures everywhere
2. **Type Safety** - Prevents type mismatches between frontend and backend
3. **Consistency** - Same enums and types across all packages
4. **i18n Ready** - Validation error keys support internationalization
5. **GDPR Compliance** - Password validation follows ENISA guidelines
6. **Easy Updates** - Update types once, reflects everywhere
7. **Zero Runtime Dependencies** - Pure TypeScript, no bloat

## TypeScript Configuration

This package is compiled with:

- `strict: true` - Maximum type safety
- `declaration: true` - Generates `.d.ts` files
- `target: ES2020` - Modern JavaScript
- `module: ESNext` - ESM modules

## Dependencies

**Runtime**: None - This is a pure TypeScript package

**Development**:

- `typescript: ^5.9.3`

## Package Structure

```
@sottosviluppo/filcronet-core/
├── dist/                  # Compiled JavaScript + .d.ts
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── src/
│   ├── enums/            # Enumerations
│   ├── interfaces/       # Type definitions
│   ├── types/            # Utility types
│   ├── utils/            # Validators
│   └── index.ts          # Main export
├── package.json
├── tsconfig.json
└── README.md
```

## Migration to @filcronet (Future)

When the `filcronet` organization becomes available:

- Package will be republished as `@filcronet/core`
- Old `@sottosviluppo/filcronet-core` will be deprecated with migration notice
- No breaking changes - just scope rename

## Changelog

### v0.1.0 (Initial Release)

- ✨ Core interfaces (User, Role, Permission)
- ✨ API response types with pagination
- ✨ GDPR-compliant password validator
- ✨ i18n support for validation errors
- ✨ TypeScript utility types
- 📚 Comprehensive documentation

## License

UNLICENSED - Private package for Filcronet internal use

## Support

For issues or questions:

- Check the [main framework documentation](../../README.md)
- Contact the Filcronet development team
- Review individual package READMEs for integration examples
