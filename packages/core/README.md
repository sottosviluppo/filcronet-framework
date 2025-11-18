# @filcronet/core

Core package for Filcronet framework containing shared types, interfaces, enums and validators.

## Installation
```bash
pnpm add @filcronet/core
```

## What's included

### 📋 Interfaces

Common data structures used across the framework:

- **`IUser`** - User entity structure
- **`IRole`** - Role entity structure
- **`IPermission`** - Permission entity structure
- **`IApiResponse<T>`** - Standardized API response wrapper
- **`IPaginatedResponse<T>`** - Paginated API response
- **`IPaginationParams`** - Pagination query parameters
- **`IValidationMessages`** - Validation message provider interface (for i18n)
- **`IPasswordErrorMessages`** - Password error messages map (for i18n)

### 🎯 Enums

Constant values for type safety:

- **`UserStatus`** - User account statuses (`active`, `inactive`, `suspended`, `pending_verification`)
- **`PermissionAction`** - Permission actions (`create`, `read`, `update`, `delete`, `list`, `manage`)
- **`PermissionResource`** - Base resources (`users`, `roles`, `permissions`, `files`)
- **`PasswordErrorKey`** - Password validation error keys (for i18n support)

### 🔧 Type Utilities

Essential TypeScript helper types:

- **`Nullable<T>`** - Makes type nullable (`T | null`)
- **`Optional<T>`** - Makes type optional (`T | undefined`)
- **`DeepPartial<T>`** - Makes all nested properties optional

### 🔐 Validators

GDPR-compliant password validation:

- **`PasswordValidator`** - Static class with password strength validation methods
- **`PasswordValidationResult`** - Password validation result with error keys

## Usage Examples

### Backend (NestJS)
```typescript
import { IUser, UserStatus, Nullable } from "@filcronet/core";

// Type-safe user entity
const user: IUser = {
  id: "123",
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

### Frontend (Vue 3 with Zod)
```vue
<script setup lang="ts">
import { z } from "zod";
import { UserStatus, type IUser } from "@filcronet/core";

// Define validation schema with Zod
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

### Password Validation with i18n
```typescript
import { 
  PasswordValidator, 
  PasswordErrorKey, 
  type PasswordValidationResult 
} from "@filcronet/core";

// Validate password and get error keys (not hardcoded messages)
const result: PasswordValidationResult = PasswordValidator.validatePassword(
  "MyPassword123",
  {
    email: "john@example.com",
    firstName: "John"
  }
);

if (!result.isValid) {
  // Map error keys to your translations
  const translatedErrors = result.errorKeys.map(key => {
    switch(key) {
      case PasswordErrorKey.TooShort:
        return t('validation.password.tooShort');
      case PasswordErrorKey.NoUppercase:
        return t('validation.password.noUppercase');
      case PasswordErrorKey.ContainsPersonalData:
        return t('validation.password.containsPersonalData');
      // ... other cases
    }
  });
}

// Or use the deprecated method for backward compatibility
const errors: string[] = PasswordValidator.getPasswordErrors("weak");
// ['Minimum 12 characters required', ...]
```

### Password Strength Meter
```typescript
import { PasswordValidator } from "@filcronet/core";

const password = "MySecureP@ss2024";

const strength = PasswordValidator.getPasswordStrength(password); // 0-4
const label = PasswordValidator.getStrengthLabel(strength); // "Strong"
const isValid = PasswordValidator.isStrongPassword(password); // true
```

### Deep Partial for Updates
```typescript
import { DeepPartial, IUser } from "@filcronet/core";

// Update with nested optional fields
type UpdateUserDto = DeepPartial<IUser>;

const update: UpdateUserDto = {
  firstName: "John",
};

await userService.update(userId, update);
```

## Password Validator

### GDPR-Compliant Password Validation

The `PasswordValidator` class provides comprehensive password validation based on ENISA guidelines and NIST SP 800-63B:

**Requirements:**
- Minimum 12 characters
- At least 3 out of 4 character types (uppercase, lowercase, numbers, special characters)
- No sequential characters (e.g., "123", "abc")
- No repeated characters (e.g., "aaa", "111")
- No personal data (name, email, username)

**Available Methods:**
```typescript
// Check if password is strong (boolean)
PasswordValidator.isStrongPassword(password: string): boolean

// Get validation errors as keys (for i18n)
PasswordValidator.validatePassword(
  password: string, 
  userContext?: { email?, username?, firstName?, lastName? }
): PasswordValidationResult

// Get validation errors as English messages (deprecated, use validatePassword)
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
enum PasswordErrorKey {
  TooShort = 'tooShort',
  NoUppercase = 'noUppercase',
  NoLowercase = 'noLowercase',
  NoNumber = 'noNumber',
  NoSpecialChar = 'noSpecialChar',
  ContainsPersonalData = 'containsPersonalData',
  CommonPassword = 'commonPassword',
}
```

### Validation Message Interfaces

Implement `IValidationMessages` in your application for type-safe i18n:
```typescript
import { IValidationMessages, IPasswordErrorMessages } from "@filcronet/core";

const messages: IValidationMessages = {
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
};
```

## Validation

This package provides:
- **Password validation**: GDPR-compliant password validation with i18n support
- **Error key mapping**: `PasswordErrorKey` enum for internationalization

For other validation needs, use:
- **Backend**: [class-validator](https://github.com/typestack/class-validator) with NestJS
- **Frontend**: [Zod](https://github.com/colinhacks/zod) for schema validation

## Why Core Package?

The core package ensures:

1. **Single Source of Truth** - One definition of data structures used everywhere
2. **Type Safety** - TypeScript interfaces prevent type mismatches between frontend and backend
3. **Consistency** - Same enums and types across all packages
4. **i18n Ready** - Validation error keys support internationalization
5. **GDPR Compliance** - Password validation follows ENISA guidelines
6. **Easy Updates** - Update types once, reflects everywhere

## Dependencies

No runtime dependencies - this is a pure TypeScript package.

## License

UNLICENSED - Private package for Filcronet internal use