# Examples

This directory contains complete working examples demonstrating how to use Filcronet framework packages.

## Structure

```
examples/
├── auth/              # Authentication system example
│   ├── backend/       # NestJS backend with @sottosviluppo/auth-backend
│   └── frontend/      # Vue 3 frontend with @sottosviluppo/auth-frontend
└── README.md          # This file
```

## Available Examples

### 🔐 Authentication Example

Location: `examples/auth/`

Demonstrates:

- Complete authentication system with JWT
- User, Role, and Permission management
- Dynamic permission system
- Password recovery and invitation flows
- GDPR-compliant password validation
- Auto-bootstrap of roles and permissions
- Frontend integration with Vue 3

**Tech Stack:**

- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: Vue 3 + Pinia + Tailwind CSS
- Packages: `@sottosviluppo/auth-backend`, `@sottosviluppo/core`

[See detailed documentation →](./auth/README.md)

## Running Examples

Each example has its own README with setup instructions. Generally:

### Backend

```bash
cd examples/auth/backend

# Install dependencies
pnpm install

# Start database with Docker
docker-compose up -d

# Start development server
pnpm start:dev
```

### Frontend

```bash
cd examples/auth/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Requirements

- Node.js 20+
- pnpm 10+
- Docker (for databases)

## What's Included

Each example provides:

- ✅ Complete working application
- ✅ Docker Compose for infrastructure
- ✅ API documentation (Swagger)
- ✅ Frontend UI (Vue 3)
- ✅ Detailed setup instructions
- ✅ Example data/fixtures
- ✅ API testing collections

## Future Examples

Planned examples:

- 📁 File Management (upload, storage, CDN)
- 📊 CRUD Generator (dynamic forms and tables)
- 🔔 Notifications (email, push, websocket)
- 🌍 Multi-tenancy (SaaS architecture)

## Using Examples as Templates

These examples can serve as starting points for your projects:

```bash
# Copy example to your project
cp -r examples/auth/backend my-project

# Update package.json
cd my-project
# Change name, version, etc.

# Install dependencies
pnpm install

# Start building!
```

## Contributing

When adding new examples:

1. Create directory under `examples/`
2. Include complete README.md
3. Provide Docker Compose for infrastructure
4. Add working backend + frontend
5. Document all setup steps
6. Include example data/fixtures

## Support

For questions about examples:

- Check individual example READMEs
- Review package documentation
- Contact Filcronet development team

---

**Start exploring**: [Authentication Example →](./auth/README.md)
