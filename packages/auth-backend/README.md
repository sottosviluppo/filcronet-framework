# @filcronet/auth-backend

Complete authentication and authorization module for NestJS applications with TypeORM and GDPR-compliant password validation.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 User management with roles and permissions
- 🛡️ Role-based access control (RBAC)
- ✅ Permission-based authorization
- 🔑 Password recovery and invitation flows
- 🔒 **GDPR-compliant password validation** (ENISA guidelines)
- 📝 Input validation with class-validator
- 📖 Swagger/OpenAPI documentation support
- 📄 API versioning ready
- 🌍 Internationalized error messages

## Installation

```bash
pnpm add @filcronet/auth-backend @filcronet/core
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport @nestjs/typeorm @nestjs/swagger
pnpm add typeorm passport passport-jwt class-validator class-transformer rxjs reflect-metadata
```

## Quick Start

### 1. Import Module

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilcronetAuthModule } from "@filcronet/auth-backend";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "password",
      database: "mydb",
      autoLoadEntities: true,
      synchronize: true, // Only in development!
    }),
    FilcronetAuthModule.forRoot({
      jwt: {
        secret: process.env.JWT_SECRET || "your-secret-key",
        expiresIn: "15m", // Access token
        refreshExpiresIn: "7d", // Refresh token
      },
      passwordReset: {
        expiresIn: "15m", // Password reset token
      },
      invitation: {
        expiresIn: "7d", // Invitation token
      },
      defaultRoles: ["user", "admin"],
    }),
  ],
})
export class AppModule {}
```

### 2. Enable Swagger and API Versioning

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("API documentation with Filcronet Auth")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(3000);
  console.log("🚀 Server: http://localhost:3000");
  console.log("📚 Docs: http://localhost:3000/api-docs");
}
bootstrap();
```

## API Endpoints

### Authentication

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login user
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user profile (protected)

### Password Recovery

- `POST /v1/auth/forgot-password` - Request password reset
- `POST /v1/auth/reset-password` - Reset password with token
- `POST /v1/auth/set-password` - Set password from invitation
- `GET /v1/auth/validate-token` - Validate token without consuming it

### Users

- `GET /v1/users` - List users (requires `users:list`)
- `POST /v1/users` - Create user (requires `users:create`)
- `GET /v1/users/:id` - Get user by ID (requires `users:read`)
- `PATCH /v1/users/:id` - Update user (requires `users:update`)
- `DELETE /v1/users/:id` - Delete user (requires `users:delete`)

### Roles

- `GET /v1/roles` - List roles (requires `roles:list`)
- `POST /v1/roles` - Create role (requires `roles:create`)
- `GET /v1/roles/:id` - Get role by ID (requires `roles:read`)
- `PATCH /v1/roles/:id` - Update role (requires `roles:update`)
- `DELETE /v1/roles/:id` - Delete role (requires `roles:delete`)

## Usage Examples

### Protect Routes

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  RequirePermissions,
  CurrentUser,
  JwtPayload,
} from "@filcronet/auth-backend";

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get()
  @RequirePermissions("products:list")
  findAll(@CurrentUser() user: JwtPayload) {
    return `User ${user.email} is listing products`;
  }
}
```

### Public Routes

```typescript
import { Controller, Get } from "@nestjs/common";
import { Public } from "@filcronet/auth-backend";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok" };
  }
}
```

### Custom Validation with PasswordValidator

```typescript
import { PasswordValidator } from "@filcronet/core";
import { BadRequestException } from "@nestjs/common";

class CustomUserService {
  async validatePassword(password: string, userContext: any) {
    const result = PasswordValidator.validatePassword(password, {
      email: userContext.email,
      username: userContext.username,
      firstName: userContext.firstName,
      lastName: userContext.lastName,
    });

    if (!result.isValid) {
      // Map error keys to your localized messages
      const errorMessages = result.errorKeys.map((key) =>
        this.translatePasswordError(key, userContext.locale)
      );
      throw new BadRequestException(errorMessages);
    }
  }
}
```

## Password Validation

### GDPR-Compliant Password Requirements

Passwords are validated according to ENISA guidelines and NIST SP 800-63B:

- ✅ Minimum 12 characters
- ✅ At least 3 out of 4 character types:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&\*...)
- ✅ No sequential characters (123, abc, qwerty)
- ✅ No repeated characters (aaa, 111)
- ✅ Cannot contain personal data (name, email, username)

### Custom Validator

The package includes `IsStrongPasswordConstraint` for use in DTOs:

```typescript
import { IsStrongPasswordConstraint } from "@filcronet/auth-backend";
import { Validate } from "class-validator";

export class RegisterDto {
  @Validate(IsStrongPasswordConstraint)
  password: string;

  // Validator automatically checks against email, username, firstName, lastName
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
```

## Password Recovery Flow

### 1. Forgot Password

```typescript
POST /v1/auth/forgot-password
{
  "email": "user@example.com"
}
```

Sends email with reset token (if account exists). Returns success even if account doesn't exist (security by obscurity).

### 2. Reset Password

```typescript
POST /v1/auth/reset-password
{
  "token": "eyJhbGc...",
  "newPassword": "NewSecureP@ss123"
}
```

### 3. Set Password (Invitation)

```typescript
POST /v1/auth/set-password
{
  "token": "eyJhbGc...",
  "password": "SecureP@ss123"
}
```

Used when an admin invites a user without setting their password.

### 4. Validate Token

```typescript
GET /v1/auth/validate-token?token=eyJhbGc...&type=password_reset
```

Check if a token is valid before showing the reset form.

## Token Types

```typescript
enum TokenType {
  ACCESS = "access", // Short-lived (15m default)
  REFRESH = "refresh", // Long-lived (7d default)
  PASSWORD_RESET = "password_reset", // Password reset (15m default)
  INVITATION = "invitation", // User invitation (7d default)
}
```

## Configuration Options

```typescript
interface AuthModuleOptions {
  jwt: {
    secret: string; // JWT secret key
    expiresIn?: string | number; // Access token expiration (default: '15m')
    refreshExpiresIn?: string | number; // Refresh token expiration (default: '7d')
  };
  passwordReset?: {
    expiresIn?: string | number; // Reset token expiration (default: '15m')
  };
  invitation?: {
    expiresIn?: string | number; // Invitation token expiration (default: '7d')
  };
  bcryptRounds?: number; // Password hashing rounds (default: 10)
  defaultRoles?: string[]; // Roles to create on bootstrap
}
```

## Email Service Integration

Implement `IEmailService` to send password reset and invitation emails:

```typescript
import { IEmailService } from "@filcronet/auth-backend";

@Injectable()
export class MyEmailService implements IEmailService {
  async sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl: string
  ): Promise<void> {
    // Send email with resetUrl
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    invitationUrl: string
  ): Promise<void> {
    // Send invitation email
  }
}

// Register in module
@Module({
  providers: [
    {
      provide: 'EMAIL_SERVICE',
      useClass: MyEmailService,
    },
  ],
})
```

## Exports

The module exports:

- **Services**: `AuthService`, `UserService`, `RoleService`, `PermissionService`, `PasswordRecoveryService`
- **Guards**: `JwtAuthGuard`, `PermissionsGuard`
- **Decorators**: `@Public()`, `@RequirePermissions()`, `@CurrentUser()`
- **Strategies**: `JwtStrategy`
- **Validators**: `IsStrongPasswordConstraint`

## Security Features

- ✅ Bcrypt password hashing (10+ rounds)
- ✅ JWT tokens with expiration
- ✅ Refresh token rotation
- ✅ GDPR-compliant password validation
- ✅ Personal data detection in passwords
- ✅ Rate limiting support (implement in your app)
- ✅ Token-based password reset
- ✅ Secure token validation
- ✅ Security by obscurity (password reset)

## License

UNLICENSED - Private package for Filcronet internal use
