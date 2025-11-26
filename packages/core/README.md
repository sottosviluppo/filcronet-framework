# @sottosviluppo/core

Core utilities, types, and interfaces for the Filcronet Framework.

This package provides shared TypeScript definitions used across both backend (`@sottosviluppo/auth-backend`) and frontend (`@sottosviluppo/auth-frontend`) packages.

## Installation

```bash
# Using pnpm (recommended)
pnpm add @sottosviluppo/core

# Using npm
npm install @sottosviluppo/core

# Using yarn
yarn add @sottosviluppo/core
```

### GitHub Packages Authentication

This package is hosted on GitHub Packages. Configure your `.npmrc`:

```ini
@sottosviluppo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Features

- **Interfaces**: Shared data structures for User, Role, Permission, API responses
- **Enums**: Type-safe constants for UserStatus, PermissionAction
- **Types**: TypeScript utilities (Nullable, Optional, DeepPartial)
- **Validators**: GDPR-compliant PasswordValidator

## Usage

### Interfaces

```typescript
import { IUser, IRole, IPermission, IApiResponse } from "@sottosviluppo/core";

// Type your API responses
async function fetchUser(id: string): Promise<IApiResponse<IUser>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Use in components
function UserCard({ user }: { user: IUser }) {
  return (
    <div>
      <h2>
        {user.firstName} {user.lastName}
      </h2>
      <p>{user.email}</p>
      <p>Status: {user.status}</p>
    </div>
  );
}
```

### Enums

```typescript
import { UserStatus, PermissionAction } from "@sottosviluppo/core";

// Check user status
if (user.status === UserStatus.ACTIVE) {
  // User can access the system
}

if (user.status === UserStatus.SUSPENDED) {
  // Show suspended message
}

// Build permission strings
const permission = `users:${PermissionAction.CREATE}`; // 'users:create'
```

#### UserStatus Values

| Value                  | Description                            |
| ---------------------- | -------------------------------------- |
| `ACTIVE`               | User account is active                 |
| `INACTIVE`             | User account is disabled               |
| `SUSPENDED`            | User account is temporarily suspended  |
| `PENDING_VERIFICATION` | User registered but email not verified |

#### PermissionAction Values

| Value    | Description                    |
| -------- | ------------------------------ |
| `CREATE` | Create new resources           |
| `READ`   | Read/view a single resource    |
| `UPDATE` | Update existing resources      |
| `DELETE` | Delete resources               |
| `LIST`   | List/browse multiple resources |
| `MANAGE` | Full access to resource        |

### Type Utilities

```typescript
import { Nullable, Optional, DeepPartial } from "@sottosviluppo/core";

// Nullable - value can be T or null
function findUser(id: string): Nullable<IUser> {
  return users.find((u) => u.id === id) || null;
}

// Optional - value can be T or undefined
function getConfig(key: string): Optional<string> {
  return config[key];
}

// DeepPartial - all nested properties optional
type UpdateUserDto = DeepPartial<IUser>;

const update: UpdateUserDto = {
  settings: {
    notifications: { email: true },
    // Other nested properties are optional
  },
};
```

### Password Validator

GDPR-compliant password validation following ENISA guidelines:

```typescript
import { PasswordValidator, PasswordErrorKey } from "@sottosviluppo/core";

// Simple validation
const isStrong = PasswordValidator.isStrongPassword("MySecureP@ss2024");

// Detailed validation with user context
const result = PasswordValidator.validatePassword("MySecureP@ss2024", {
  email: "user@example.com",
  username: "john_doe",
  firstName: "John",
  lastName: "Doe",
});

if (!result.isValid) {
  // Map error keys to your translations
  const messages = result.errorKeys.map((key) => {
    switch (key) {
      case PasswordErrorKey.TooShort:
        return "Password must be at least 12 characters";
      case PasswordErrorKey.NoUppercase:
        return "Password must contain uppercase letter";
      case PasswordErrorKey.ContainsPersonalData:
        return "Password cannot contain your name or email";
      // ... handle other keys
    }
  });
}

// Get password strength score (0-4)
const strength = PasswordValidator.getPasswordStrength("MySecureP@ss2024");
const label = PasswordValidator.getStrengthLabel(strength); // 'Strong'
```

#### Password Requirements

| Requirement      | Description                                               |
| ---------------- | --------------------------------------------------------- |
| Minimum length   | 12 characters                                             |
| Complexity       | At least 3 of: uppercase, lowercase, number, special char |
| No sequences     | No sequential characters (123, abc, qwerty)               |
| No repeats       | No repeated characters (aaa, 111)                         |
| No personal data | Cannot contain email, username, or name                   |

#### PasswordErrorKey Values

| Key                    | Description                          |
| ---------------------- | ------------------------------------ |
| `TooShort`             | Password is less than 12 characters  |
| `NoUppercase`          | Missing uppercase letter             |
| `NoLowercase`          | Missing lowercase letter             |
| `NoNumber`             | Missing number                       |
| `NoSpecialChar`        | Missing special character            |
| `ContainsPersonalData` | Contains user's personal information |
| `CommonPassword`       | Contains common patterns             |

### API Response Interfaces

```typescript
import {
  IApiResponse,
  IPaginatedApiResponse,
  IPaginationParams,
} from "@sottosviluppo/core";

// Standard API response
interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: IApiError[];
  meta?: IApiMeta;
}

// Paginated response
interface IPaginatedApiResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination params for requests
const params: IPaginationParams = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "DESC",
};
```

### Resource Definition

For defining custom resources in the permission system:

```typescript
import { ResourceDefinition, PermissionAction } from "@sottosviluppo/core";

const resources: ResourceDefinition[] = [
  {
    name: "products",
    description: "Product catalog management",
    // All actions will be generated
  },
  {
    name: "reports",
    description: "Analytics reports",
    actions: [PermissionAction.READ, PermissionAction.LIST], // Only these actions
  },
];
```

## API Reference

### Interfaces

| Interface                  | Description                         |
| -------------------------- | ----------------------------------- |
| `IUser`                    | User entity structure               |
| `IRole`                    | Role with permissions               |
| `IPermission`              | Single permission (resource:action) |
| `IApiResponse<T>`          | Standard API response wrapper       |
| `IPaginatedApiResponse<T>` | Paginated API response              |
| `IPaginationParams`        | Pagination query parameters         |
| `ICreateUserDto`           | User creation data                  |
| `IUpdateUserDto`           | User update data                    |
| `ICreateRoleDto`           | Role creation data                  |
| `IUpdateRoleDto`           | Role update data                    |
| `ResourceDefinition`       | Permission resource definition      |
| `IPasswordErrorMessages`   | Password error message map          |
| `IValidationMessages`      | Validation message interface        |

### Enums

| Enum               | Description                    |
| ------------------ | ------------------------------ |
| `UserStatus`       | User account status values     |
| `PermissionAction` | Permission action types        |
| `PasswordErrorKey` | Password validation error keys |

### Types

| Type               | Description                         |
| ------------------ | ----------------------------------- |
| `Nullable<T>`      | T or null                           |
| `Optional<T>`      | T or undefined                      |
| `DeepPartial<T>`   | All properties optional recursively |
| `PermissionString` | Format: `${resource}:${action}`     |

### Classes

| Class               | Description                        |
| ------------------- | ---------------------------------- |
| `PasswordValidator` | GDPR-compliant password validation |

## License

UNLICENSED - Private package for Filcronet projects.
