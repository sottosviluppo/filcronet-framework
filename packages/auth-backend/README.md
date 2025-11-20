# @sottosviluppo/auth-backend

Complete authentication and authorization module for NestJS applications with TypeORM, dynamic permissions system, GDPR-compliant password validation, and token invalidation security.

## Features

- 🔐 **JWT-based authentication** with refresh tokens
- 👥 **User management** with roles and permissions
- 🛡️ **Role-based access control (RBAC)**
- ✅ **Dynamic permission system** (configure resources per project)
- 🔑 **Password recovery** with one-time tokens
- 📧 **User invitation system** (create users without password)
- 🔒 **GDPR-compliant password validation** (ENISA guidelines)
- 🚫 **Token invalidation** (password reset/invitation tokens expire after use)
- 🚀 **Auto-bootstrap**: roles and permissions created on first startup
- 🎯 **Initial setup endpoint** for first super-admin user
- 📝 **Input validation** with class-validator
- 📖 **Swagger/OpenAPI documentation** support
- 📄 **API versioning** ready
- 🌍 **Internationalized error messages**

## Installation

```bash
pnpm add @sottosviluppo/auth-backend @sottosviluppo/core
```

### Peer Dependencies

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport @nestjs/typeorm
pnpm add passport passport-jwt bcrypt typeorm class-validator class-transformer
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
        expiresIn: "15m", // Password reset token (one-time use)
      },
      invitation: {
        expiresIn: "7d", // Invitation token (one-time use)
      },
      defaultUserRole: "user", // Role assigned to new registrations
      // 🎯 Define resources for YOUR project
      resources: [
        // Default resources (users, roles, permissions) are auto-included
        { name: "products", description: "Product catalog management" },
        { name: "orders", description: "Order processing and tracking" },
        { name: "blog-posts", description: "Blog content management" },
      ],
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

On first startup, the module automatically creates permissions and roles:

#### ✅ **Permissions Generated**

For each resource, **6 actions** are created:

- `create` - Create new items
- `read` - View single item details
- `update` - Modify existing item
- `delete` - Remove item permanently
- `list` - Browse/search multiple items
- `manage` - Full control (super-permission)

**Example** for `products` resource:

```
products:create
products:read
products:update
products:delete
products:list
products:manage
```

#### ✅ **Default System Roles**

Three system roles are automatically created:

| Role            | Description              | Permissions                                                       | Locked                      |
| --------------- | ------------------------ | ----------------------------------------------------------------- | --------------------------- |
| **super-admin** | Full system access       | **ALL permissions on ALL resources**                              | ✅ Yes (cannot be modified) |
| **admin**       | User and role management | Full access to `users`, `roles`, `permissions` resources only     | ❌ No (can be modified)     |
| **user**        | Read-only access         | Only `read` and `list` actions on `users`, `roles`, `permissions` | ❌ No (can be modified)     |

**Detailed Permissions:**

- **super-admin**:

```
  users:*, roles:*, permissions:*, products:*, orders:*, ...
  (ALL actions on ALL resources)
```

- **admin**:

```
  users:create, users:read, users:update, users:delete, users:list, users:manage
  roles:create, roles:read, roles:update, roles:delete, roles:list, roles:manage
  permissions:create, permissions:read, permissions:update, permissions:delete, permissions:list, permissions:manage
```

- **user**:

```
  users:read, users:list
  roles:read, roles:list
  permissions:read, permissions:list
```

#### ✅ **Bootstrap Logs**

```
[BootstrapService] Permissions bootstrap completed: 18 created, 0 already existed
[BootstrapService] System roles bootstrap completed: 3 created, 0 updated, 0 skipped
[BootstrapService] Authentication system bootstrap completed successfully
```

### 4. Create First Super-Admin

**⚠️ This endpoint only works when database is empty (no users exist)**

```bash
POST http://localhost:3000/v1/setup/initial-admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SuperSecure!Pass123",
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
  "password": "SuperSecure!Pass123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "status": "active",
    "roles": [
      {
        "name": "super-admin",
        "permissions": [...]
      }
    ]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Email Service Integration (Optional)

The email service is **optional**. If not configured:

- ✅ Password reset and invitation tokens are still generated
- ✅ Tokens are returned in API responses
- ❌ No automatic emails are sent
- 💡 You can manually send emails using the returned tokens

### When to Configure Email Service

Configure email service if you want:

- Automatic password reset emails
- Automatic user invitation emails
- Seamless user experience without manual token distribution

### Implementation

#### 1. Create Email Service

```typescript
// email.service.ts
import { Injectable } from "@nestjs/common";
import { IEmailService } from "@sottosviluppo/auth-backend";
import { MailerService } from "@nestjs-modules/mailer"; // or your email library

@Injectable()
export class EmailService implements IEmailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send password reset email
   * Token is already included in resetUrl
   */
  async sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl: string
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: "Reset Your Password",
      template: "password-reset", // Path to your email template
      context: {
        resetUrl, // https://app.com/reset-password?token=abc123
        token, // Raw token (if needed for custom templates)
      },
    });
  }

  /**
   * Send invitation email for new users
   * Token is already included in invitationUrl
   */
  async sendInvitationEmail(
    email: string,
    token: string,
    invitationUrl: string
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: "You've Been Invited!",
      template: "invitation", // Path to your email template
      context: {
        invitationUrl, // https://app.com/set-password?token=xyz789
        token, // Raw token (if needed for custom templates)
      },
    });
  }
}
```

#### 2. Register Email Service

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { FilcronetAuthModule } from "@sottosviluppo/auth-backend";
import { EmailService } from "./email.service";

@Module({
  imports: [
    // Configure your email provider (example with nodemailer)
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: '"App Name" <noreply@example.com>',
      },
    }),
    FilcronetAuthModule.forRoot({
      // ... auth config
    }),
  ],
  providers: [
    EmailService,
    {
      provide: "EMAIL_SERVICE", // 🔑 This token is required
      useClass: EmailService,
    },
  ],
})
export class AppModule {}
```

#### 3. Email Templates (Optional)

Create email templates in `src/templates/`:

**password-reset.hbs:**

```handlebars
<html>
  <head>
    <title>Reset Your Password</title>
  </head>
  <body>
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password. Click the link below:</p>
    <a href="{{resetUrl}}">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </body>
</html>
```

**invitation.hbs:**

```handlebars
<html>
  <head>
    <title>Welcome!</title>
  </head>
  <body>
    <h1>You've Been Invited!</h1>
    <p>An administrator has created an account for you.</p>
    <p>Click the link below to set your password:</p>
    <a href="{{invitationUrl}}">Set Password</a>
    <p>This link expires in 7 days.</p>
  </body>
</html>
```

### Without Email Service

If you don't configure email service, tokens are returned in API responses:

```json
// POST /v1/auth/forgot-password
{
  "message": "If an account with that email exists, a password reset link has been sent"
  // ⚠️ Token not returned for security (prevents email enumeration)
}

// POST /v1/users (without password)
{
  "user": {...},
  "invitationToken": "eyJhbGc...",
  "invitationUrl": "https://app.com/set-password?token=eyJhbGc...",
  "message": "User created successfully. Invitation token generated (send to user via email)."
}
```

You can then:

1. Store `invitationToken` in your database
2. Send custom email using your own email service
3. Or provide the `invitationUrl` to the user via other channels

## Password Validation (GDPR-Compliant)

Passwords are validated according to **ENISA guidelines** and **NIST SP 800-63B**.

### Requirements

- ✅ **Minimum 12 characters**
- ✅ **At least 3 out of 4 character types**:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&\*()\_+-=[]{}|;:,.<>?)
- ✅ **No sequential characters** (123, abc, qwerty)
- ✅ **No repeated characters** (aaa, 111)
- ✅ **Cannot contain personal data** (email, username, first name, last name)

### Password Error Messages

When validation fails, detailed error messages are returned:

| Error Key              | Message                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `TooShort`             | Password must be at least 12 characters long                                |
| `NoUppercase`          | Password must contain at least one uppercase letter                         |
| `NoLowercase`          | Password must contain at least one lowercase letter                         |
| `NoNumber`             | Password must contain at least one number                                   |
| `NoSpecialChar`        | Password must contain at least one special character                        |
| `CommonPassword`       | Password contains common patterns (avoid sequential or repeated characters) |
| `ContainsPersonalData` | Password should not contain personal information (name, email, username)    |

### Examples

**✅ Valid Passwords:**

```
MySecureP@ss2024
Tr0ub4dor&3
C0mpl3x!Pass
Zx9#mK2pQ8vL
```

**❌ Invalid Passwords:**

```
short           → Too short (< 12 chars)
alllowercase123 → Only 2 character types
Password123     → Contains "password" (common)
abc12345        → Sequential characters
aaaBBB111       → Repeated characters
john.doe@email  → Contains personal data
```

### Context-Aware Validation

Passwords are validated against user context to prevent personal data:

```typescript
// Example: User tries to set password "john2024"
{
  "email": "john@example.com",
  "username": "john_doe",
  "firstName": "John",
  "password": "john2024"  // ❌ Rejected: contains "john"
}
```

The validator checks if password contains (case-insensitive):

- Email local part (before @)
- Username
- First name (if ≥ 3 chars)
- Last name (if ≥ 3 chars)

## Token Security & Invalidation

### Token Types

| Token Type         | Purpose                   | Lifetime      | Invalidation       |
| ------------------ | ------------------------- | ------------- | ------------------ |
| **ACCESS**         | API authentication        | 15m (default) | Natural expiration |
| **REFRESH**        | Renew access token        | 7d (default)  | Natural expiration |
| **PASSWORD_RESET** | Reset forgotten password  | 15m (default) | **One-time use**   |
| **INVITATION**     | Set password (first time) | 7d (default)  | **One-time use**   |

### One-Time Token Invalidation

Password reset and invitation tokens are **automatically invalidated after first use** using a `passwordVersion` counter:

#### How It Works

1. **Token Generation**: Token includes current `passwordVersion`

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "type": "password_reset",
  "version": 0, // Current passwordVersion
  "exp": 1234567890
}
```

2. **Token Usage**: When user sets/resets password:

   - Password is updated
   - `passwordVersion` is incremented: `0 → 1`
   - Token becomes invalid immediately

3. **Token Validation**: When token is used again:

```typescript
// Token has version: 0
// User has version: 1
// Result: ❌ "Token has been invalidated (password already changed or set)"
```

#### Security Benefits

- ✅ **Prevents replay attacks**: Old tokens cannot be reused
- ✅ **Immediate invalidation**: No need to wait for token expiration
- ✅ **Multiple tokens**: All previous tokens are invalidated when password changes
- ✅ **Stateless**: No need to store token blacklist in database

#### Example Flow

**Scenario**: User requests password reset twice

```bash
# 1. First password reset request
POST /v1/auth/forgot-password
{ "email": "user@example.com" }
# Token generated with version: 0

# 2. User clicks first link and resets password
POST /v1/auth/reset-password
{ "token": "...", "newPassword": "NewPass123!" }
# ✅ Success: Password changed, version: 0 → 1

# 3. User requests another reset (forgot they just reset)
POST /v1/auth/forgot-password
{ "email": "user@example.com" }
# New token generated with version: 1

# 4. User tries to use FIRST token again
POST /v1/auth/reset-password
{ "token": "...(first token)...", "newPassword": "AnotherPass!" }
# ❌ Error: "Token has been invalidated (password already changed or set)"

# 5. User uses SECOND token
POST /v1/auth/reset-password
{ "token": "...(second token)...", "newPassword": "AnotherPass!" }
# ✅ Success: Password changed, version: 1 → 2
```

### Token Validation Endpoint

Check if a token is valid without consuming it:

```bash
GET /v1/auth/validate-token?token=abc123&type=password_reset
```

**Responses:**

```json
// ✅ Valid token
{
  "valid": true,
  "email": "user@example.com"
}

// ❌ Invalid/expired/used token
{
  "valid": false
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

| Method | Endpoint                   | Description                                 | Token Type       |
| ------ | -------------------------- | ------------------------------------------- | ---------------- |
| `POST` | `/v1/auth/forgot-password` | Request password reset email                | `password_reset` |
| `POST` | `/v1/auth/reset-password`  | Reset password with token (one-time use)    | `password_reset` |
| `POST` | `/v1/auth/set-password`    | Set password from invitation (one-time use) | `invitation`     |
| `GET`  | `/v1/auth/validate-token`  | Validate token without consuming            | Any              |

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

**Note:** Permissions cannot be created/updated/deleted via API. They are auto-generated from your `resources` configuration.

## User Status States

| Status                 | Description                         | Can Login | Actions               |
| ---------------------- | ----------------------------------- | --------- | --------------------- |
| `active`               | Normal active account               | ✅ Yes    | All actions available |
| `inactive`             | Disabled account (by admin)         | ❌ No     | Login rejected        |
| `suspended`            | Temporarily restricted              | ❌ No     | Login rejected        |
| `pending_verification` | Just registered, email not verified | ✅ Yes\*  | Limited actions       |

\*Note: Users with `pending_verification` can login but may have restricted permissions based on their role.

### Status Transitions

```
Registration (with password) → pending_verification
  ↓
Email verification → active

Invitation (no password) → inactive
  ↓
Set password → active

Admin action → suspended
  ↓
Admin reactivation → active
```

## Dynamic Permission System

### How It Works

Permissions are generated **dynamically** based on resources you define:

```typescript
FilcronetAuthModule.forRoot({
  resources: [
    {
      name: "products",
      description: "Product catalog",
      // Optional: limit actions (default: all 6 actions)
      actions: ["create", "read", "update", "delete", "list"],
    },
    {
      name: "orders",
      description: "Order management",
      // Will generate all 6 actions
    },
  ],
});
```

### Permission Actions (Universal)

| Action   | Description           | Use Case              |
| -------- | --------------------- | --------------------- |
| `create` | Create new items      | POST /resources       |
| `read`   | View single item      | GET /resources/:id    |
| `update` | Modify existing item  | PATCH /resources/:id  |
| `delete` | Remove item           | DELETE /resources/:id |
| `list`   | Browse multiple items | GET /resources        |
| `manage` | Full control          | Super-permission      |

### Permission Format

Permissions follow: `resource:action`

Examples:

- `products:create`
- `orders:read`
- `users:manage`
- `blog-posts:update`

### Adding New Resources

**1. Update configuration:**

```typescript
resources: [
  // ... existing
  { name: "blog-posts", description: "Blog management" },
];
```

**2. Restart application** - Bootstrap creates:

```
blog-posts:create
blog-posts:read
blog-posts:update
blog-posts:delete
blog-posts:list
blog-posts:manage
```

**3. Assign permissions to roles:**

```bash
PATCH /v1/roles/:roleId
{
  "permissionIds": ["<blog-posts:create-uuid>", "<blog-posts:read-uuid>"]
}
```

### Default Resources

Three resources are **always included**:

- `users` - User management
- `roles` - Role management
- `permissions` - Permission viewing

You can override default resources:

```typescript
resources: [
  {
    name: "users",
    description: "Custom user management description",
    actions: ["create", "read", "list"], // Only these 3 actions
  },
  // ... your resources
];
```

## User Invitation System

### Overview

Admins can create users **without passwords**. System generates invitation token that user uses to set their password on first login.

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
  // ⚠️ No password field
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

**What happens:**

- ✅ User created with `status: "inactive"`
- ✅ `invitationToken` generated (expires in 7 days)
- ✅ Email sent automatically (if email service configured)
- ✅ Token includes `passwordVersion: 0`

#### 2. User Sets Password (First Time)

User clicks email link:

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

- ✅ Password validated and hashed
- ✅ User status: `inactive` → `active`
- ✅ `emailVerified` set to `true`
- ✅ `passwordVersion` incremented: `0 → 1`
- ✅ **Token invalidated** (cannot be used again)
- ✅ User can now login

#### 3. Token Reuse Attempt (Security)

```bash
# User tries to use same token again
POST /v1/auth/set-password
{
  "token": "eyJhbGc...(same token)...",
  "password": "AnotherPass!"
}
```

**Response:**

```json
{
  "statusCode": 401,
  "message": "Token has been invalidated (password already changed or set)"
}
```

#### 4. Resend Invitation (if token expires)

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
  "invitationToken": "eyJhbGc...(new token)...",
  "invitationUrl": "https://app.example.com/set-password?token=eyJhbGc...",
  "message": "Invitation token generated successfully"
}
```

**What happens:**

- ✅ New token generated with current `passwordVersion`
- ✅ Old tokens remain invalid
- ✅ Email sent automatically (if configured)

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

**Key differences:**

- ✅ Status: `pending_verification` (not `inactive`)
- ✅ No invitation token/URL
- ✅ User can login immediately

### Invitation vs Password Reset

| Feature         | Invitation                       | Password Reset                   |
| --------------- | -------------------------------- | -------------------------------- |
| **Use Case**    | New user (no password yet)       | Existing user (forgot password)  |
| **Token Type**  | `invitation`                     | `password_reset`                 |
| **Expiration**  | 7 days (default)                 | 15 minutes (default)             |
| **Endpoint**    | `/auth/set-password`             | `/auth/reset-password`           |
| **User Status** | `inactive` → `active`            | Remains `active`                 |
| **Validation**  | User must NOT have password      | User must HAVE password          |
| **Security**    | One-time use (token invalidated) | One-time use (token invalidated) |

## Usage Examples

### Protect Routes with Permissions

```typescript
import { Controller, Get, Post, Body, UseGuards, Param } from "@nestjs/common";
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  JwtPayload,
} from "@sottosviluppo/auth-backend";

@Controller("products")
@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply to all routes
export class ProductsController {
  @Get()
  @RequirePermissions("products:list")
  findAll(@CurrentUser() user: JwtPayload) {
    // User must have "products:list" permission
    return `User ${user.email} is listing products`;
  }

  @Post()
  @RequirePermissions("products:create")
  create(@Body() createDto: any) {
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

### Public Routes

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

## Configuration Options

```typescript
interface AuthModuleOptions {
  /**
   * JWT configuration (required)
   */
  jwt: {
    secret: string; // JWT secret key (use env var in production)
    expiresIn?: string | number; // Access token expiration (default: '15m')
    refreshExpiresIn?: string | number; // Refresh token expiration (default: '7d')
  };

  /**
   * Password reset token configuration
   */
  passwordReset?: {
    expiresIn?: string | number; // Reset token expiration (default: '15m')
  };

  /**
   * Invitation token configuration
   */
  invitation?: {
    expiresIn?: string | number; // Invitation token expiration (default: '7d')
  };

  /**
   * Resources for permission system
   * Default resources (users, roles, permissions) are auto-included
   */
  resources?: ResourceDefinition[];

  /**
   * Default role assigned to new registrations
   * Default: 'user'
   */
  defaultUserRole?: string;

  /**
   * Bcrypt hashing rounds
   * Default: 10
   */
  bcryptRounds?: number;
}

interface ResourceDefinition {
  name: string; // Resource name (e.g., "products", "orders")
  description?: string; // Human-readable description
  actions?: PermissionAction[]; // Optional: limit actions (default: all 6)
}
```

## Workflow Examples

### 1. Initial Setup (Empty Database)

```bash
# 1. Start application
pnpm start:dev

# Logs:
# [BootstrapService] Permissions bootstrap completed: 18 created, 0 already existed
# [BootstrapService] System roles bootstrap completed: 3 created, 0 updated, 0 skipped

# 2. Create first super-admin
POST /v1/setup/initial-admin
{
  "email": "admin@example.com",
  "password": "SuperSecure!Pass123",
  "firstName": "Admin"
}

# 3. Login
POST /v1/auth/login
{
  "email": "admin@example.com",
  "password": "SuperSecure!Pass123"
}
# Returns: { user, accessToken, refreshToken }
```

### 2. Create Custom Role

```bash
POST /v1/roles
Authorization: Bearer <access-token>

{
  "name": "content-editor",
  "description": "Can manage products and blog posts",
  "permissionIds": [
    "<products:create-uuid>",
    "<products:read-uuid>",
    "<products:update-uuid>",
    "<products:list-uuid>",
    "<blog-posts:create-uuid>",
    "<blog-posts:update-uuid>"
  ]
}
```

### 3. User Invitation Flow

```bash
# Admin creates user
POST /v1/users
{
  "email": "editor@example.com",
  "firstName": "Jane",
  "invitationUrl": "https://app.com/set-password",
  "roleIds": ["<content-editor-uuid>"]
}
# Email sent with invitation link

# User sets password
POST /v1/auth/set-password
{
  "token": "<invitation-token>",
  "password": "MySecureP@ss123!"
}

# User logs in
POST /v1/auth/login
{
  "email": "editor@example.com",
  "password": "MySecureP@ss123!"
}
```

### 4. Password Recovery Flow

```bash
# User forgets password
POST /v1/auth/forgot-password
{ "email": "user@example.com" }
# Email sent with reset link

# User resets password
POST /v1/auth/reset-password
{
  "token": "<reset-token>",
  "newPassword": "NewSecureP@ss123!"
}

# Token now invalid (one-time use)
# User logs in with new password
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "NewSecureP@ss123!"
}
```

### 5. Token Refresh

```bash
# Access token expires after 15 minutes
POST /v1/auth/refresh
{ "refreshToken": "<refresh-token>" }
# Returns: { accessToken, refreshToken }
```

## Exports

### Services

- `AuthService` - Authentication logic
- `UserService` - User CRUD
- `RoleService` - Role management
- `PermissionService` - Permission queries
- `PasswordRecoveryService` - Password reset/invitation
- `BootstrapService` - Auto-initialization

### Guards

- `JwtAuthGuard` - JWT validation
- `PermissionsGuard` - Permission checking

### Decorators

- `@Public()` - Mark route as public
- `@RequirePermissions(...permissions)` - Require permissions
- `@CurrentUser()` - Get current user

### Strategies

- `JwtStrategy` - Passport JWT strategy

### Controllers

- `AuthController` - Authentication
- `UserController` - User management
- `RoleController` - Role management
- `PermissionController` - Permission listing
- `SetupController` - Initial setup

### Interfaces

- `IEmailService` - Email service contract
- `AuthModuleOptions` - Module configuration
- `JwtPayload` - Token payload structure

## Security Best Practices

### ✅ Password Security

- Bcrypt hashing (10+ rounds)
- GDPR-compliant validation
- Personal data detection
- Common password blocking
- Minimum 12 characters

### ✅ Token Security

- Short-lived access tokens (15m)
- Long-lived refresh tokens (7d)
- One-time use for special tokens
- Automatic invalidation after use
- Token type validation
- Version-based invalidation

### ✅ API Security

- JWT authentication required by default
- Permission-based authorization
- Input validation on all endpoints
- Security by obscurity (password reset)
- No password enumeration
- Rate limiting recommended

### ✅ Database Security

- Passwords never in responses
- Unique constraints (email/username)
- System roles cannot be deleted
- Soft deletes recommended

## Troubleshooting

### Bootstrap Failed

```
[BootstrapService] Bootstrap failed: Connection error
```

**Solution**: Check database connection in TypeORM config.

### Default Role Not Found

```
BadRequestException: default user role 'user' not found
```

**Solution**: Ensure bootstrap completed successfully. Check logs for role creation.

### Permission Denied

```
403 Forbidden: Insufficient permissions
```

**Solution**:

1. Check user roles: `GET /v1/auth/me`
2. Verify role has required permissions: `GET /v1/roles/:id`
3. Ensure permission exists: `GET /v1/permissions`

### Initial Admin Exists

```
409 Conflict: Cannot create initial admin
```

**Solution**: Endpoint only works with empty database. Use existing admin or create users via `/v1/users`.

### Token Invalid After Use

```
401 Unauthorized: Token has been invalidated
```

**Solution**: This is **expected behavior**. Password reset/invitation tokens are one-time use only. Request new token if needed.

### Email Not Sent

**Solution**:

1. Check if `EMAIL_SERVICE` is registered
2. Verify email service configuration
3. Check logs for email errors
4. If email service not configured, use tokens from API response

### User Already Has Password

```
400 BadRequest: User already has password
```

**Solution**: Use password reset flow (`/auth/forgot-password`) instead of invitation flow.

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types, validators, enums
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Vue 3 composables (coming soon)

## Examples

See [examples/auth](../../examples/auth) for complete working examples.

## License

UNLICENSED - Private package for internal use.

---

**Quick Start Checklist:**

1. ✅ Install package and dependencies
2. ✅ Configure database (TypeORM)
3. ✅ Configure auth module (JWT secret, resources)
4. ✅ Optional: Setup email service
5. ✅ Run application (bootstrap auto-runs)
6. ✅ Create super-admin (`/setup/initial-admin`)
7. ✅ Login and start building! 🚀
