# @sottosviluppo/auth-backend

Complete authentication and authorization module for NestJS applications with TypeORM, dynamic permissions system, and GDPR-compliant password validation.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 User management with roles and permissions
- 🛡️ Role-based access control (RBAC)
- ✅ Dynamic permission system (configure resources per project)
- 🔑 Password recovery and invitation flows
- 📧 User invitation system (create users without password)
- 🔒 **GDPR-compliant password validation** (ENISA guidelines)
- 🚀 Auto-bootstrap: roles and permissions created on first startup
- 🎯 Initial setup endpoint for first super-admin user
- 📝 Input validation with class-validator
- 📖 Swagger/OpenAPI documentation support
- 🔄 API versioning ready
- 🌍 Internationalized error messages

## Installation

```bash
pnpm add @sottosviluppo/auth-backend @sottosviluppo/core
```

## Quick Start

### 1. Configure Database

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilcronetAuthModule } from "@sottosviluppo/auth-backend";

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
      synchronize: true, // ⚠️ Only in development!
    }),
    FilcronetAuthModule.forRoot({
      jwt: {
        secret:
          process.env.JWT_SECRET || "your-secret-key-change-in-production",
        expiresIn: "15m", // Access token (short-lived)
        refreshExpiresIn: "7d", // Refresh token (long-lived)
      },
      passwordReset: {
        expiresIn: "1h", // Password reset token
      },
      invitation: {
        expiresIn: "7d", // Invitation token
      },
      // 🎯 Define resources for YOUR project
      resources: [
        { name: "users", description: "User management" },
        { name: "roles", description: "Role management" },
        { name: "products", description: "Product catalog" },
        { name: "orders", description: "Order management" },
      ],
      defaultRoles: ["user"], // Default role for new registrations
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

  // Enable CORS
  app.enableCors();

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
    .setDescription("API with Filcronet Auth")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(3000);
  console.log("🚀 Server: http://localhost:3000");
  console.log("📚 Swagger: http://localhost:3000/api-docs");
}
bootstrap();
```

### 3. First Startup - Automatic Bootstrap

On first startup, the module automatically:

✅ **Creates all permissions** based on configured resources:

```
users:create, users:read, users:update, users:delete, users:list, users:manage
roles:create, roles:read, roles:update, roles:delete, roles:list, roles:manage
products:create, products:read, products:update, products:delete, products:list, products:manage
orders:create, orders:read, orders:update, orders:delete, orders:list, orders:manage
```

✅ **Creates default roles**:

- `super-admin` - All permissions
- `admin` - All permissions except `roles:manage`
- `user` - Basic permissions (read own data)

✅ **Logs bootstrap progress**:

```
[BootstrapService] Starting authentication module bootstrap...
[BootstrapService] Creating permissions for resource: users (6 actions)
[BootstrapService] Creating permissions for resource: roles (6 actions)
[BootstrapService] Total permissions in system: 24
[BootstrapService] Created role: super-admin
[BootstrapService] Created role: admin
[BootstrapService] Created role: user
[BootstrapService] Authentication module bootstrap completed successfully
```

### 4. Create First Super-Admin

**⚠️ This endpoint only works when database is empty (no users exist)**

```bash
POST http://localhost:3000/v1/setup/initial-admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SuperSecure123!",
  "firstName": "Super",
  "lastName": "Admin"
}
```

**Response:**

```json
{
  "message": "Super-admin user created successfully",
  "user": {
    "id": "uuid-here",
    "email": "admin@example.com",
    "firstName": "Super",
    "lastName": "Admin",
    "status": "active",
    "roles": [
      {
        "name": "super-admin",
        "permissions": [...]
      }
    ]
  }
}
```

### 5. Login and Get Tokens

```bash
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SuperSecure123!"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "roles": [...]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## API Endpoints

### Setup (Public)

| Method | Endpoint                  | Description              | Access                    |
| ------ | ------------------------- | ------------------------ | ------------------------- |
| `POST` | `/v1/setup/initial-admin` | Create first super-admin | Public (only if DB empty) |

### Authentication (Public)

| Method | Endpoint            | Description                              |
| ------ | ------------------- | ---------------------------------------- |
| `POST` | `/v1/auth/register` | Register new user (assigns default role) |
| `POST` | `/v1/auth/login`    | Login user                               |
| `POST` | `/v1/auth/refresh`  | Refresh access token                     |
| `GET`  | `/v1/auth/me`       | Get current user profile (protected)     |

### Password Recovery (Public)

| Method | Endpoint                   | Description                      |
| ------ | -------------------------- | -------------------------------- |
| `POST` | `/v1/auth/forgot-password` | Request password reset email     |
| `POST` | `/v1/auth/reset-password`  | Reset password with token        |
| `POST` | `/v1/auth/set-password`    | Set password from invitation     |
| `GET`  | `/v1/auth/validate-token`  | Validate token without consuming |

### Users (Protected)

| Method   | Endpoint                          | Permission Required |
| -------- | --------------------------------- | ------------------- |
| `GET`    | `/v1/users`                       | `users:list`        |
| `POST`   | `/v1/users`                       | `users:create`      |
| `GET`    | `/v1/users/:id`                   | `users:read`        |
| `PATCH`  | `/v1/users/:id`                   | `users:update`      |
| `DELETE` | `/v1/users/:id`                   | `users:delete`      |
| `POST`   | `/v1/users/:id/resend-invitation` | `users:update`      |

### Roles (Protected)

| Method   | Endpoint        | Permission Required |
| -------- | --------------- | ------------------- |
| `GET`    | `/v1/roles`     | `roles:list`        |
| `POST`   | `/v1/roles`     | `roles:create`      |
| `GET`    | `/v1/roles/:id` | `roles:read`        |
| `PATCH`  | `/v1/roles/:id` | `roles:update`      |
| `DELETE` | `/v1/roles/:id` | `roles:delete`      |

### Permissions (Protected - Read Only)

| Method | Endpoint              | Permission Required |
| ------ | --------------------- | ------------------- |
| `GET`  | `/v1/permissions`     | `permissions:list`  |
| `GET`  | `/v1/permissions/:id` | `permissions:read`  |

**Note:** Permissions cannot be created/updated via API. They are auto-generated from your `resources` configuration.

## Dynamic Permission System

### How It Works

Permissions are generated **dynamically** based on resources you define in configuration:

```typescript
FilcronetAuthModule.forRoot({
  // ...
  resources: [
    {
      name: "products",
      description: "Product catalog",
      // Optional: limit actions (default: all actions)
      actions: ["create", "read", "update", "delete", "list"],
    },
    {
      name: "orders",
      description: "Order management",
      // Will generate all 6 actions: create, read, update, delete, list, manage
    },
  ],
});
```

### Permission Actions (Universal)

These actions are available for any resource:

- `create` - Create new items
- `read` - View single item
- `update` - Modify existing item
- `delete` - Remove item
- `list` - Browse multiple items
- `manage` - Full control (super-permission)

### Permission Format

Permissions follow the pattern: `resource:action`

Examples:

- `products:create`
- `products:read`
- `orders:list`
- `users:manage`

### Adding New Resources

To add a new resource to your application:

1. **Update configuration**:

```typescript
resources: [
  // ... existing resources
  { name: "blog-posts", description: "Blog management" },
];
```

2. **Restart application** - Bootstrap automatically creates:

```
blog-posts:create
blog-posts:read
blog-posts:update
blog-posts:delete
blog-posts:list
blog-posts:manage
```

3. **Assign permissions to roles**:

```bash
PATCH /v1/roles/:roleId
{
  "permissionIds": ["<blog-posts:create-uuid>", "<blog-posts:read-uuid>"]
}
```

### Why Dynamic Permissions?

✅ **Flexible**: Each project defines only needed resources  
✅ **Clean**: No giant enum with unused permissions  
✅ **Scalable**: Add resources without touching core package  
✅ **Type-safe**: Actions are still strongly typed  
✅ **Lightweight**: Only generate permissions you need

## User Invitation System

### Overview

Admins can create users **without passwords**. The system automatically generates an invitation token and URL that can be sent to the user via email.

### Workflow

#### 1. Admin Creates User Without Password

```bash
POST /v1/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "invitationUrl": "https://app.example.com/set-password",
  "roleIds": ["<editor-role-uuid>"]
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "status": "inactive",
    "roles": [...]
  },
  "invitationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "invitationUrl": "https://app.example.com/set-password?token=eyJhbGc...",
  "message": "User created successfully. Invitation token generated (send to user via email)."
}
```

**Key Points:**

- ✅ User created with `status: "inactive"`
- ✅ `invitationToken` can be stored or sent via custom email template
- ✅ `invitationUrl` is the complete URL ready to send
- ✅ Token expires after 7 days (configurable)

#### 2. User Sets Password

User receives email and clicks on invitation link:

```bash
POST /v1/auth/set-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "MyNewP@ss2024"
}
```

**Response:**

```json
{
  "message": "Password set successfully"
}
```

**What happens:**

- ✅ Password is set and hashed
- ✅ User status changes: `inactive` → `active`
- ✅ User can now login

#### 3. Resend Invitation (if token expires)

```bash
POST /v1/users/:userId/resend-invitation
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "invitationUrl": "https://app.example.com/set-password"
}
```

**Response:**

```json
{
  "invitationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "invitationUrl": "https://app.example.com/set-password?token=eyJhbGc...",
  "message": "Invitation token generated successfully"
}
```

### Create User WITH Password

Admins can also create users with passwords directly:

```bash
POST /v1/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "roleIds": ["<user-role-uuid>"]
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "status": "pending_verification",
    "roles": [...]
  },
  "message": "User created successfully"
}
```

**Key Differences:**

- ✅ User created with `status: "pending_verification"`
- ✅ No invitation token/URL in response
- ✅ User can login immediately

### Invitation vs Password Reset

| Feature         | Invitation                  | Password Reset                  |
| --------------- | --------------------------- | ------------------------------- |
| **Use Case**    | New user (no password yet)  | Existing user (forgot password) |
| **Token Type**  | `invitation`                | `password_reset`                |
| **Expiration**  | 7 days (default)            | 1 hour (default)                |
| **Endpoint**    | `/auth/set-password`        | `/auth/reset-password`          |
| **User Status** | `inactive` → `active`       | Remains `active`                |
| **Validation**  | Checks user has NO password | Checks user HAS password        |

## Usage Examples

### Protect Routes with Permissions

```typescript
import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  JwtPayload,
} from "@sottosviluppo/auth-backend";

@Controller("products")
@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply globally to controller
export class ProductsController {
  @Get()
  @RequirePermissions("products:list")
  findAll(@CurrentUser() user: JwtPayload) {
    // User must have "products:list" permission
    return `User ${user.email} is listing products`;
  }

  @Post()
  @RequirePermissions("products:create")
  create(@Body() createDto: any, @CurrentUser() user: JwtPayload) {
    // User must have "products:create" permission
    return `Creating product...`;
  }

  @Get(":id")
  @RequirePermissions("products:read")
  findOne(@Param("id") id: string) {
    return `Viewing product ${id}`;
  }
}
```

### Multiple Permissions (AND logic)

```typescript
@Post("bulk-import")
@RequirePermissions("products:create", "products:update")
bulkImport(@Body() data: any) {
  // User must have BOTH permissions
  return "Importing products...";
}
```

### Public Routes (No Authentication)

```typescript
import { Controller, Get } from "@nestjs/common";
import { Public } from "@sottosviluppo/auth-backend";

@Controller("health")
export class HealthController {
  @Public() // Bypass authentication
  @Get()
  check() {
    return { status: "ok", timestamp: new Date() };
  }
}
```

### Get Current User Data

```typescript
import { CurrentUser, JwtPayload } from "@sottosviluppo/auth-backend";

@Get("profile")
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: JwtPayload) {
  // Access user data from JWT
  return {
    userId: user.sub,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
  };
}

// Get specific field
@Get("email")
getEmail(@CurrentUser("email") email: string) {
  return { email };
}
```

## Password Validation

### GDPR-Compliant Requirements

Passwords are validated according to **ENISA guidelines** and **NIST SP 800-63B**:

- ✅ **Minimum 12 characters**
- ✅ **At least 3 out of 4 character types**:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&\*...)
- ✅ **No sequential characters** (123, abc, qwerty)
- ✅ **No repeated characters** (aaa, 111)
- ✅ **Cannot contain personal data** (email, username, name)
- ✅ **Not a common password** (password123, admin, etc.)

### Examples

```typescript
// ✅ Valid passwords
"MySecureP@ss2024";
"Tr0ub4dor&3";
"C0mpl3x!Pass";

// ❌ Invalid passwords
"short"; // Too short
"alllowercase123"; // Only 2 character types
"Password123"; // Contains "password"
"abc12345"; // Sequential characters
"aaaBBB111"; // Repeated characters
"john@doe.com"; // Contains email
```

### Custom Validation

```typescript
import { PasswordValidator } from "@sottosviluppo/core";
import { BadRequestException } from "@nestjs/common";

class CustomAuthService {
  async validatePassword(password: string, userContext: any) {
    const result = PasswordValidator.validatePassword(password, {
      email: userContext.email,
      username: userContext.username,
      firstName: userContext.firstName,
      lastName: userContext.lastName,
    });

    if (!result.isValid) {
      // Map error keys to localized messages
      const errors = result.errorKeys.map((key) =>
        this.translateError(key, userContext.locale)
      );
      throw new BadRequestException(errors);
    }
  }
}
```

## Workflow Examples

### 1. Initial Setup (Empty Database)

```bash
# 1. Start application
pnpm start:dev

# Logs show:
# [BootstrapService] Created permissions: 24
# [BootstrapService] Created role: super-admin
# [BootstrapService] Created role: admin
# [BootstrapService] Created role: user

# 2. Create first super-admin
POST /v1/setup/initial-admin
{
  "email": "admin@example.com",
  "password": "SuperSecure123!",
  "firstName": "Admin"
}

# 3. Login
POST /v1/auth/login
{
  "email": "admin@example.com",
  "password": "SuperSecure123!"
}
# Returns: { user, accessToken, refreshToken }
```

### 2. Create Custom Role

```bash
# As super-admin, create "Content Editor" role
POST /v1/roles
Authorization: Bearer <access-token>

{
  "name": "content-editor",
  "description": "Can manage products",
  "permissionIds": [
    "<products:create-uuid>",
    "<products:read-uuid>",
    "<products:update-uuid>",
    "<products:list-uuid>"
  ]
}
```

### 3. Create User with Invitation

```bash
# Create user without password
POST /v1/users
Authorization: Bearer <admin-token>

{
  "email": "editor@example.com",
  "firstName": "Jane",
  "lastName": "Editor",
  "invitationUrl": "https://app.example.com/set-password",
  "roleIds": ["<content-editor-role-uuid>"]
}

# Response includes invitation token and URL
# Send invitationUrl to user via email

# User sets password
POST /v1/auth/set-password
{
  "token": "<invitation-token>",
  "password": "MyNewP@ss2024"
}

# User can now login
POST /v1/auth/login
{
  "email": "editor@example.com",
  "password": "MyNewP@ss2024"
}
```

### 4. Password Recovery (Existing User)

```bash
# User forgets password
POST /v1/auth/forgot-password
{
  "email": "user@example.com"
}
# Email sent with reset link (if account exists)

# User clicks link and resets password
POST /v1/auth/reset-password
{
  "token": "<reset-token>",
  "newPassword": "NewSecureP@ss123"
}
```

### 5. Token Refresh

```bash
# Access token expires after 15 minutes
# Use refresh token to get new access token
POST /v1/auth/refresh
{
  "refreshToken": "<refresh-token>"
}
# Returns: { accessToken, refreshToken }
```

## Configuration Options

```typescript
interface AuthModuleOptions {
  /**
   * JWT configuration
   */
  jwt: {
    secret: string; // JWT secret key (use env var in production)
    expiresIn?: string | number; // Access token expiration (default: '15m')
    refreshExpiresIn?: string | number; // Refresh token expiration (default: '7d')
  };

  /**
   * Resources for permission system
   * Define which resources your application has
   */
  resources: ResourceDefinition[];

  /**
   * Password reset token configuration
   */
  passwordReset?: {
    expiresIn?: string | number; // Reset token expiration (default: '1h')
  };

  /**
   * Invitation token configuration
   */
  invitation?: {
    expiresIn?: string | number; // Invitation token expiration (default: '7d')
  };

  /**
   * Bcrypt hashing rounds
   */
  bcryptRounds?: number; // Default: 10

  /**
   * Default roles to create on bootstrap
   * Note: "super-admin", "admin", "user" are always created
   */
  defaultRoles?: string[];

  /**
   * Optional email service for password recovery
   */
  email?: {
    service?: IEmailService;
  };
}

interface ResourceDefinition {
  name: string; // Resource name (e.g., "products", "orders")
  description?: string; // Human-readable description
  actions?: PermissionAction[]; // Optional: limit actions (default: all)
}
```

## Email Service Integration

To enable password recovery emails, implement `IEmailService`:

```typescript
import { Injectable } from "@nestjs/common";
import { IEmailService } from "@sottosviluppo/auth-backend";

@Injectable()
export class EmailService implements IEmailService {
  async sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl: string
  ): Promise<void> {
    // Send email with resetUrl
    // Example: https://app.com/reset-password?token=abc123
    await this.mailer.send({
      to: email,
      subject: "Reset your password",
      html: `Click here to reset: <a href="${resetUrl}">${resetUrl}</a>`,
    });
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    invitationUrl: string
  ): Promise<void> {
    // Send invitation email
    await this.mailer.send({
      to: email,
      subject: "You've been invited!",
      html: `Set your password: <a href="${invitationUrl}">${invitationUrl}</a>`,
    });
  }
}

// Register in AppModule
@Module({
  providers: [
    EmailService,
    {
      provide: "EMAIL_SERVICE",
      useClass: EmailService,
    },
  ],
})
export class AppModule {}
```

## Token Types

```typescript
enum TokenType {
  ACCESS = "access", // Short-lived (15m default)
  REFRESH = "refresh", // Long-lived (7d default)
  PASSWORD_RESET = "password_reset", // Password reset (1h default)
  INVITATION = "invitation", // User invitation (7d default)
}
```

## Exports

The module exports services, guards, decorators, and more:

### Services

- `AuthService` - Authentication logic
- `UserService` - User CRUD operations
- `RoleService` - Role management
- `PermissionService` - Permission queries
- `PasswordRecoveryService` - Password reset/invitation
- `BootstrapService` - Auto-initialization

### Guards

- `JwtAuthGuard` - Validates JWT tokens
- `PermissionsGuard` - Checks user permissions

### Decorators

- `@Public()` - Mark route as public
- `@RequirePermissions(...permissions)` - Require specific permissions
- `@CurrentUser()` - Get current user from JWT

### Strategies

- `JwtStrategy` - Passport JWT strategy

### Controllers

- `AuthController` - Authentication endpoints
- `UserController` - User management
- `RoleController` - Role management
- `PermissionController` - Permission listing (read-only)
- `SetupController` - Initial setup

### Validators

- `IsStrongPasswordConstraint` - GDPR-compliant password validation

## Security Best Practices

✅ **Password Security**

- Bcrypt hashing with 10+ rounds
- GDPR-compliant validation
- Personal data detection
- Common password blocking

✅ **Token Security**

- Short-lived access tokens (15m)
- Long-lived refresh tokens (7d)
- Token type validation
- Secure token expiration

✅ **API Security**

- JWT authentication required by default
- Permission-based authorization
- Input validation on all endpoints
- Security by obscurity (password reset)

✅ **Database Security**

- Passwords never returned in responses
- Unique constraints on email/username
- System roles cannot be deleted

## Troubleshooting

### Bootstrap Failed

```
[BootstrapService] Bootstrap failed: Connection error
```

**Solution**: Check database connection in TypeORM config

### No Default Role

```
BadRequestException: Invalid role configuration
```

**Solution**: Ensure `resources` array includes `"users"` and `"roles"` for bootstrap to create default roles

### Permission Denied

```
403 Forbidden: Insufficient permissions
```

**Solution**:

1. Check user has required role
2. Verify role has required permissions
3. Use `GET /v1/auth/me` to see current user's permissions

### Initial Admin Already Exists

```
409 Conflict: Cannot create initial admin: users already exist
```

**Solution**: This is expected. The endpoint only works with empty database. Login with existing admin or create users via `/v1/users`

### User Already Has Password (Invitation)

```
400 BadRequest: User already has password. Use password reset instead.
```

**Solution**: Use `/v1/users/:id/resend-invitation` only for users created without password. For existing users, use password reset flow.

### Invitation Token Expired

```
401 Unauthorized: Invalid or expired token
```

**Solution**: Use `/v1/users/:id/resend-invitation` to generate new invitation token

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types and validators
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Vue 3 composables (coming soon)

## Examples

See [examples/auth](../../examples/auth) for complete working examples with:

- NestJS backend setup
- Vue 3 frontend integration
- Docker Compose for database
- Postman/Thunder Client collections

## License

UNLICENSED - Private package for Filcronet internal use

---

**Next Steps:**

1. ✅ Set up database
2. ✅ Configure `resources` for your project
3. ✅ Run application (bootstrap auto-runs)
4. ✅ Create first super-admin via `/setup/initial-admin`
5. ✅ Login and start building!
