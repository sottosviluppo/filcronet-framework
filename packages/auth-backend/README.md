# @sottosviluppo/auth-backend

Complete authentication and authorization module for NestJS applications with TypeORM, dynamic permissions system, GDPR-compliant password validation, and HttpOnly cookie-based token management.

## Features

- 🔐 **JWT-based authentication** with HttpOnly refresh tokens
- 👥 **User management** with roles and permissions
- 🛡️ **Role-based access control (RBAC)**
- ✅ **Dynamic permission system** (configure resources per project)
- 🔑 **Password recovery** with one-time tokens
- 📧 **User invitation system** (create users without password)
- 🔒 **GDPR-compliant password validation** (ENISA guidelines)
- 🚫 **Token invalidation** (password reset/invitation tokens expire after use)
- 🍪 **HttpOnly cookies** for refresh tokens (XSS-safe)
- 🚀 **Auto-bootstrap**: roles and permissions created on first startup
- 🎯 **Initial setup endpoint** for first super-admin user
- 📝 **Input validation** with class-validator
- 📖 **Swagger/OpenAPI documentation** support
- 🔄 **API versioning** ready
- 🌍 **Internationalized error messages**

## Installation

```bash
pnpm add @sottosviluppo/auth-backend @sottosviluppo/core
```

## Quick Start

### 1. Configure Database & Cookie Parser

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ⚠️ IMPORTANT: Enable cookie-parser BEFORE using auth
  app.use(cookieParser());

  // Enable CORS with credentials support for cookies
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Allow cookies
  });

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
}
bootstrap();
```

### 2. Configure Auth Module

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
      defaultUserRole: "user",
      resources: [
        { name: "products", description: "Product catalog management" },
        { name: "orders", description: "Order processing and tracking" },
      ],
    }),
  ],
})
export class AppModule {}
```

## 🍪 HttpOnly Cookie Authentication

### Security Architecture

The authentication system uses a **dual-token approach** for maximum security:

| Token Type        | Storage           | Accessible by JS | Lifetime   | Purpose            |
| ----------------- | ----------------- | ---------------- | ---------- | ------------------ |
| **Access Token**  | Memory (frontend) | ✅ Yes           | 15 minutes | API authentication |
| **Refresh Token** | HttpOnly Cookie   | ❌ No            | 7 days     | Renew access token |

### Why HttpOnly Cookies?

**Traditional approach (localStorage):**

```javascript
// ❌ VULNERABLE to XSS attacks
localStorage.setItem("refreshToken", token);
// Malicious script can steal: localStorage.getItem('refreshToken')
```

**Our approach (HttpOnly cookies):**

```javascript
// ✅ PROTECTED from XSS - JavaScript cannot access
// Cookie set by server with httpOnly flag
// Only browser can send it automatically
```

### Authentication Flow

```
┌─────────────┐                  ┌─────────────┐
│   Frontend  │                  │   Backend   │
│             │                  │             │
│  (Memory)   │                  │  (Cookie)   │
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │  1. POST /auth/login           │
       │  { email, password }           │
       ├───────────────────────────────>│
       │                                │
       │  2. Response                   │
       │  ✓ accessToken (JSON body)     │
       │  ✓ refreshToken (HttpOnly)     │
       │<───────────────────────────────┤
       │  Set-Cookie: refreshToken=...  │
       │  httpOnly; secure; sameSite    │
       │                                │
       │  3. API Request                │
       │  Authorization: Bearer <token> │
       ├───────────────────────────────>│
       │                                │
       │  4. Token Expired (401)        │
       │<───────────────────────────────┤
       │                                │
       │  5. POST /auth/refresh         │
       │  (cookie sent automatically)   │
       ├───────────────────────────────>│
       │                                │
       │  6. New Tokens                 │
       │  ✓ new accessToken (JSON)      │
       │  ✓ new refreshToken (Cookie)   │
       │<───────────────────────────────┤
       │                                │
```

### Backend Implementation

```typescript
// auth.controller.ts - Login
@Public()
@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response,
) {
  const result = await this.authService.login(loginDto);

  // Set refresh token in HttpOnly cookie
  response.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,          // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',      // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/v1/auth/refresh', // Cookie only sent to refresh endpoint
  });

  // Return access token in response body (NOT refresh token)
  return { user: result.user, accessToken: result.accessToken };
}

// auth.controller.ts - Refresh
@Public()
@Post('refresh')
async refresh(
  @Req() request: Request,
  @Res({ passthrough: true }) response: Response,
) {
  // Get refresh token from HttpOnly cookie
  const refreshToken = request.cookies?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token not found');
  }

  const result = await this.authService.refreshAccessToken(refreshToken);

  // Update refresh token cookie
  response.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/v1/auth/refresh',
  });

  return { accessToken: result.accessToken, user: result.user };
}

// auth.controller.ts - Logout
@Post('logout')
async logout(@Res({ passthrough: true }) response: Response) {
  // Clear refresh token cookie
  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/v1/auth/refresh',
  });

  return { message: 'Logout successful' };
}
```

## Protecting Routes

The package provides `JwtAuthGuard` to protect your API endpoints. You have two approaches:

### Approach 1: Global Guard (Recommended)

Apply the guard globally so all routes are protected by default. Use `@Public()` decorator for public endpoints.

```typescript
// main.ts
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { JwtAuthGuard } from "@sottosviluppo/auth-backend";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply JwtAuthGuard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ... rest of configuration
  await app.listen(3000);
}
bootstrap();
```

With global guard, all routes require authentication except those marked with `@Public()`:

```typescript
// products.controller.ts
import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import {
  Public,
  RequirePermissions,
  JwtAuthGuard,
} from "@sottosviluppo/auth-backend";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  // ✅ Public endpoint - no authentication required
  @Public()
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // ✅ Protected by global guard - authentication required
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // ✅ Protected with specific permissions
  @RequirePermissions("products:delete")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
```

### Approach 2: Per-Controller/Per-Route Guard

Apply guards on specific controllers or routes:

```typescript
// products.controller.ts
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
} from "@sottosviluppo/auth-backend";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Apply to entire controller
@Controller("products")
export class ProductsController {
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Add permission check on specific route
  @UseGuards(PermissionsGuard)
  @RequirePermissions("products:create")
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

Or apply to specific routes only:

```typescript
@Controller("products")
export class ProductsController {
  // Public route - no guard
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Protected route
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

### Available Guards

| Guard              | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| `JwtAuthGuard`     | Validates JWT access token                                              |
| `PermissionsGuard` | Checks user has required permissions (use with `@RequirePermissions()`) |

### Available Decorators

| Decorator                             | Description                                |
| ------------------------------------- | ------------------------------------------ |
| `@Public()`                           | Mark route as public (skip authentication) |
| `@RequirePermissions(...permissions)` | Require specific permissions               |
| `@CurrentUser()`                      | Inject current user into handler           |

### Example: Complete Protected Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  Public,
} from "@sottosviluppo/auth-backend";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtPayload } from "@sottosviluppo/auth-backend";

@ApiTags("Products")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public endpoint - anyone can view products
  @Public()
  @Get()
  @ApiOperation({ summary: "List all products (public)" })
  findAll() {
    return this.productsService.findAll();
  }

  // Authenticated users can view single product
  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  // Only users with products:create permission
  @RequirePermissions("products:create")
  @Post()
  @ApiOperation({ summary: "Create product" })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productsService.create(dto, user.sub);
  }

  // Only users with products:update permission
  @RequirePermissions("products:update")
  @Put(":id")
  @ApiOperation({ summary: "Update product" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.update(id, dto);
  }

  // Only users with products:delete permission
  @RequirePermissions("products:delete")
  @Delete(":id")
  @ApiOperation({ summary: "Delete product" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
```

> ⚠️ **Important**: `@ApiBearerAuth()` is only for Swagger documentation. It does NOT protect your routes. Always use `@UseGuards(JwtAuthGuard)` or global guard for actual protection.

### Frontend Integration

See [@sottosviluppo/auth-frontend](../auth-frontend) for complete Vue 3 integration with automatic cookie handling.

## Token Security & Invalidation

### Token Types

| Token Type         | Purpose                   | Lifetime      | Storage         | Invalidation       |
| ------------------ | ------------------------- | ------------- | --------------- | ------------------ |
| **ACCESS**         | API authentication        | 15m (default) | Memory          | Natural expiration |
| **REFRESH**        | Renew access token        | 7d (default)  | HttpOnly Cookie | Natural expiration |
| **PASSWORD_RESET** | Reset forgotten password  | 15m (default) | N/A             | **One-time use**   |
| **INVITATION**     | Set password (first time) | 7d (default)  | N/A             | **One-time use**   |

### One-Time Token Invalidation

Password reset and invitation tokens use `passwordVersion` counter for automatic invalidation:

```typescript
// Token contains version
{
  "sub": "user-id",
  "email": "user@example.com",
  "type": "password_reset",
  "version": 0, // Current passwordVersion
  "exp": 1234567890
}

// After password change:
// 1. Password updated
// 2. passwordVersion: 0 → 1
// 3. Token becomes invalid immediately

// When token is reused:
// Token version: 0
// User version: 1
// Result: ❌ "Token has been invalidated"
```

### Security Benefits

- ✅ **XSS Protection**: Refresh tokens inaccessible to JavaScript
- ✅ **CSRF Protection**: SameSite cookie policy
- ✅ **Replay Prevention**: One-time tokens for sensitive operations
- ✅ **Automatic Invalidation**: No token blacklist needed
- ✅ **Secure by Default**: Production-ready configuration

## Password Validation (GDPR-Compliant)

Based on **ENISA guidelines** and **NIST SP 800-63B**:

- ✅ Minimum **12 characters**
- ✅ At least **3 out of 4** character types
- ✅ No sequential characters (123, abc)
- ✅ No repeated characters (aaa, 111)
- ✅ Cannot contain personal data

See full documentation in [Configuration Options](#configuration-options) section.

## API Endpoints

### Authentication (Public)

| Method | Endpoint            | Description                  | Response                  |
| ------ | ------------------- | ---------------------------- | ------------------------- |
| `POST` | `/v1/auth/register` | Register new user            | Access token + cookie     |
| `POST` | `/v1/auth/login`    | Login user                   | Access token + cookie     |
| `POST` | `/v1/auth/refresh`  | Refresh tokens               | New access token + cookie |
| `POST` | `/v1/auth/logout`   | Logout user                  | Clear cookie              |
| `GET`  | `/v1/auth/me`       | Get current user (protected) | User data                 |

### Password Recovery (Public)

| Method | Endpoint                   | Description            | Token Type       |
| ------ | -------------------------- | ---------------------- | ---------------- |
| `POST` | `/v1/auth/forgot-password` | Request password reset | `password_reset` |
| `POST` | `/v1/auth/reset-password`  | Reset with token       | `password_reset` |
| `POST` | `/v1/auth/set-password`    | Set from invitation    | `invitation`     |
| `GET`  | `/v1/auth/validate-token`  | Validate token         | Any              |

### Protected Endpoints

See full API documentation at `/api-docs` (Swagger).

## Configuration Options

```typescript
interface AuthModuleOptions {
  jwt: {
    secret: string; // JWT secret (use env var)
    expiresIn?: string | number; // Access token (default: '15m')
    refreshExpiresIn?: string | number; // Refresh token (default: '7d')
  };

  passwordReset?: {
    expiresIn?: string | number; // Reset token (default: '15m')
  };

  invitation?: {
    expiresIn?: string | number; // Invitation token (default: '7d')
  };

  resources?: ResourceDefinition[]; // Custom resources
  defaultUserRole?: string; // Default role (default: 'user')
  bcryptRounds?: number; // Hash rounds (default: 10)
}
```

## Production Checklist

- ✅ Set strong `JWT_SECRET` environment variable
- ✅ Enable `secure: true` for cookies (HTTPS)
- ✅ Configure CORS with specific origins
- ✅ Set `synchronize: false` in TypeORM
- ✅ Use database migrations
- ✅ Enable rate limiting
- ✅ Configure proper logging
- ✅ Set up monitoring

## Migration from Previous Version

If upgrading from localStorage-based auth:

**Before (localStorage):**

```typescript
// Client stored refresh token
localStorage.setItem('refreshToken', token);

// Client sent in request body
POST /auth/refresh
{ "refreshToken": "..." }
```

**After (HttpOnly cookies):**

```typescript
// Server sets cookie automatically
response.cookie("refreshToken", token, { httpOnly: true });

// Client sends automatically (browser handles)
POST / auth / refresh;
// Cookie sent automatically by browser
```

No client-side code changes needed with `@sottosviluppo/auth-frontend`!

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types, validators, enums
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Vue 3 composables with cookie support

## License

UNLICENSED - Private package for internal use.

---

**Security First. Developer Experience Second. Always.**
