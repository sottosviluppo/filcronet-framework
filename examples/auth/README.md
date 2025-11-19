# Authentication Example

Complete working example demonstrating `@sottosviluppo/auth-backend` with NestJS backend and Vue 3 frontend.

## Features Demonstrated

### Backend

- ✅ JWT authentication with refresh tokens
- ✅ User, Role, and Permission management
- ✅ Dynamic permission system (configure resources)
- ✅ Auto-bootstrap (roles and permissions created on startup)
- ✅ Initial super-admin setup endpoint
- ✅ Password recovery and invitation flows
- ✅ GDPR-compliant password validation
- ✅ Swagger API documentation
- ✅ API versioning (v1)

### Frontend

- ✅ Login and registration forms
- ✅ Token management (access + refresh)
- ✅ Protected routes
- ✅ User profile management
- ✅ Role and permission display
- ✅ Password reset flow
- ✅ Responsive UI with Tailwind CSS

## Project Structure

```
examples/auth/
├── backend/              # NestJS application
│   ├── src/
│   │   ├── app.module.ts    # Auth module configuration
│   │   └── main.ts          # Swagger setup, API versioning
│   ├── docker-compose.yml   # PostgreSQL database
│   ├── package.json
│   └── README.md
├── frontend/             # Vue 3 application
│   ├── src/
│   │   ├── views/           # Login, Register, Dashboard
│   │   ├── router/          # Route guards
│   │   ├── stores/          # Pinia auth store
│   │   └── api/             # API client
│   ├── package.json
│   └── README.md
└── README.md             # This file
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose

### 1. Start Database

```bash
cd backend
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432`:

- Database: `auth_example`
- User: `postgres`
- Password: `postgres`

### 2. Start Backend

```bash
cd backend

# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

Backend runs on `http://localhost:3000`

**On first startup:**

- Bootstrap automatically creates permissions and roles
- Logs show: "Created role: super-admin", "Created role: admin", etc.

### 3. Create First Super-Admin

```bash
# Using curl
curl -X POST http://localhost:3000/v1/setup/initial-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SuperSecure123!",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Or use Swagger UI at http://localhost:3000/api-docs
```

**Response:**

```json
{
  "message": "Super-admin user created successfully",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "status": "active",
    "roles": [{ "name": "super-admin" }]
  }
}
```

### 4. Start Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Frontend runs on `http://localhost:5173`

### 5. Login

1. Open `http://localhost:5173`
2. Login with:
   - Email: `admin@example.com`
   - Password: `SuperSecure123!`
3. Explore dashboard with all features

## Backend Setup Details

### Configuration

```typescript
// backend/src/app.module.ts
FilcronetAuthModule.forRoot({
  jwt: {
    secret: "your-secret-key-change-in-production",
    expiresIn: "15m",
    refreshExpiresIn: "7d",
  },
  resources: [
    { name: "users", description: "User management" },
    { name: "roles", description: "Role management" },
    { name: "products", description: "Product catalog" },
    { name: "orders", description: "Order management" },
  ],
  defaultRoles: ["user"],
});
```

### API Endpoints

**Swagger Documentation**: `http://localhost:3000/api-docs`

**Authentication** (Public):

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh token
- `GET /v1/auth/me` - Current user (protected)

**Setup** (Public, only if DB empty):

- `POST /v1/setup/initial-admin` - Create first super-admin

**Users** (Protected):

- `GET /v1/users` - List users (`users:list`)
- `POST /v1/users` - Create user (`users:create`)
- `GET /v1/users/:id` - Get user (`users:read`)
- `PATCH /v1/users/:id` - Update user (`users:update`)
- `DELETE /v1/users/:id` - Delete user (`users:delete`)

**Roles** (Protected):

- `GET /v1/roles` - List roles (`roles:list`)
- `POST /v1/roles` - Create role (`roles:create`)
- `GET /v1/roles/:id` - Get role (`roles:read`)
- `PATCH /v1/roles/:id` - Update role (`roles:update`)
- `DELETE /v1/roles/:id` - Delete role (`roles:delete`)

**Permissions** (Protected, Read-only):

- `GET /v1/permissions` - List all (`permissions:list`)
- `GET /v1/permissions/:id` - Get single (`permissions:read`)

### Testing with Thunder Client / Postman

Example requests included in `backend/thunder-tests/` (if using Thunder Client).

**Login:**

```http
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SuperSecure123!"
}
```

**Create User:**

```http
POST http://localhost:3000/v1/users
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "roleIds": ["<user-role-uuid>"]
}
```

## Frontend Setup Details

### Features

- 🔐 Login and registration forms
- 🔄 Automatic token refresh
- 🛡️ Route guards (protect authenticated routes)
- 👤 User profile display
- 🎨 Tailwind CSS styling
- 📱 Responsive design

### Key Files

```
frontend/src/
├── views/
│   ├── LoginView.vue       # Login form
│   ├── RegisterView.vue    # Registration form
│   └── DashboardView.vue   # Protected dashboard
├── stores/
│   └── auth.ts             # Pinia auth store
├── router/
│   └── index.ts            # Route guards
└── api/
    └── client.ts           # Axios client with interceptors
```

### Authentication Flow

1. **Login** → Receives access + refresh tokens
2. **Store tokens** in localStorage
3. **API requests** → Axios adds `Authorization: Bearer <token>`
4. **Token expires** → Axios intercepts 401, refreshes token, retries
5. **Logout** → Clears tokens, redirects to login

### Route Protection

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});
```

## Docker Compose

### Services

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: auth_example
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Commands

```bash
# Start database
docker-compose up -d

# View logs
docker-compose logs -f

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v
```

## Development Workflow

### 1. Fresh Start (Reset Everything)

```bash
# Stop and remove database
cd backend
docker-compose down -v

# Start fresh database
docker-compose up -d

# Restart backend (bootstrap will recreate roles/permissions)
pnpm start:dev

# Create super-admin again
curl -X POST http://localhost:3000/v1/setup/initial-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SuperSecure123!","firstName":"Admin"}'
```

### 2. Add New Resource (e.g., "products")

```typescript
// backend/src/app.module.ts
resources: [
  // ... existing
  { name: "products", description: "Product management" },
];
```

Restart backend → Bootstrap creates:

```
products:create
products:read
products:update
products:delete
products:list
products:manage
```

### 3. Create Custom Role

```bash
# Login as super-admin
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SuperSecure123!"}'

# Get access token from response

# Create "Product Manager" role
curl -X POST http://localhost:3000/v1/roles \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "product-manager",
    "description": "Manages products",
    "permissionIds": ["<products:create-uuid>", "<products:read-uuid>"]
  }'
```

### 4. Testing Password Validation

```bash
# Test weak password
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak"
  }'

# Response:
# {
#   "statusCode": 400,
#   "message": [
#     "Password must be at least 12 characters long",
#     "Must contain at least 3 of: uppercase, lowercase, number, special character"
#   ]
# }
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
cd backend
docker-compose up -d
# Wait 5 seconds for PostgreSQL to start
pnpm start:dev
```

### Bootstrap Failed

```
[BootstrapService] Bootstrap failed: Role not found
```

**Solution:** Check `resources` array includes `"users"` and `"roles"`:

```typescript
resources: [
  { name: "users" }, // Required
  { name: "roles" }, // Required
  // ... others
];
```

### Cannot Create Initial Admin

```
409 Conflict: users already exist
```

**Solution:** The endpoint only works with empty database. Either:

1. Login with existing admin
2. Reset database: `docker-compose down -v && docker-compose up -d`

### Frontend 401 Unauthorized

**Solution:**

1. Check access token is valid
2. Try refresh token flow
3. Re-login if refresh fails

### CORS Errors

**Solution:** Ensure backend has CORS enabled:

```typescript
// main.ts
app.enableCors();
```

## Environment Variables

### Backend

Create `.env` file:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=auth_example

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Frontend

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Next Steps

After exploring this example:

1. **Customize resources** in `app.module.ts`
2. **Add new roles** via API
3. **Protect custom routes** with `@RequirePermissions()`
4. **Implement email service** for password recovery
5. **Deploy to production** (see deployment guide)

## Related Documentation

- [@sottosviluppo/auth-backend](../../packages/auth-backend/README.md)
- [@sottosviluppo/core](../../packages/core/README.md)
- [Main Framework Docs](../../README.md)

## License

UNLICENSED - Example for Filcronet internal use
