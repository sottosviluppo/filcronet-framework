# Filcronet Framework

> Enterprise-grade monorepo framework for building scalable Vue 3 and NestJS applications with built-in authentication, RBAC, and TypeScript support.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5+-green.svg)](https://vuejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)

Internal monorepo framework for Filcronet custom software projects.

## 📦 Packages

| Package                                                    | Version                                          | Description                                          |
| ---------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| [`@sottosviluppo/core`](./packages/core)                   | ![npm](https://img.shields.io/badge/v0.1.4-blue) | Shared types, interfaces, enums and validators       |
| [`@sottosviluppo/frontend-core`](./packages/frontend-core) | ![npm](https://img.shields.io/badge/v0.1.1-blue) | Core utilities for Vue 3 (HTTP client, storage, JWT) |
| [`@sottosviluppo/auth-backend`](./packages/auth-backend)   | ![npm](https://img.shields.io/badge/v0.2.1-blue) | NestJS authentication module with RBAC               |
| [`@sottosviluppo/auth-frontend`](./packages/auth-frontend) | ![npm](https://img.shields.io/badge/v0.1.3-blue) | Vue 3 authentication composables with i18n support   |

## 🛠 Tech Stack

- **Monorepo**: pnpm workspaces
- **Language**: TypeScript (strict mode)
- **Backend**: NestJS + TypeORM + JWT
- **Frontend**: Vue 3 (Composition API) + Pinia + Zod
- **Database**: PostgreSQL / MySQL / MongoDB (via TypeORM)
- **Styling**: Tailwind CSS + PrimeVue
- **Validation**: class-validator (backend), Zod (frontend)
- **Registry**: GitHub Packages

## 📋 Prerequisites

- **Node.js** 20+
- **pnpm** 10+
- **GitHub Account** with access to `sottosviluppo` organization
- **GitHub Personal Access Token** (for installing/publishing packages)

## 🔐 GitHub Authentication Setup

This framework is published to **GitHub Packages**, which requires authentication to install or publish packages.

### Step 1: Create GitHub Personal Access Token (PAT)

#### For Installing Packages (Developers)

1. Go to **GitHub Settings** → [Personal Access Tokens (Classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Configure token:
   - **Note**: `Filcronet Framework - Package Read`
   - **Expiration**: Choose appropriate duration (90 days recommended)
   - **Scopes**: Select **only**:
     - ✅ `read:packages` - Download packages from GitHub Packages
4. Click **"Generate token"**
5. **⚠️ IMPORTANT**: Copy the token immediately (format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### For Publishing Packages (Maintainers)

1. Go to **GitHub Settings** → [Personal Access Tokens (Classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Configure token:
   - **Note**: `Filcronet Framework - Package Write`
   - **Expiration**: Choose appropriate duration (90 days recommended)
   - **Scopes**: Select:
     - ✅ `write:packages` - Upload packages to GitHub Packages
     - ✅ `read:packages` - Download packages from GitHub Packages
     - ✅ `repo` - Access private repositories (if repo is private)
4. Click **"Generate token"**
5. **⚠️ IMPORTANT**: Copy the token immediately

### Step 2: Configure Authentication

**Windows (CMD)**:

```cmd
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Windows (PowerShell)**:

```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Linux/Mac/Git Bash**:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Make permanent** (add to your shell profile):

```bash
# Linux/Mac - Add to ~/.bashrc or ~/.zshrc
echo 'export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx' >> ~/.bashrc
source ~/.bashrc

# Windows - Add to Environment Variables via System Properties
```

### For Maintainers (Framework Development)

#### 1. Clone Repository

```bash
git clone https://github.com/sottosviluppo/filcronet-framework.git
cd filcronet-framework
```

#### 2. Setup Authentication

Use **Environment Variable** method (Option A) with a token that has `write:packages` scope.

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Development Workflow

```bash
# Build all packages
pnpm build

# Development mode (watch)
pnpm dev

# Clean build artifacts
pnpm clean

# Run tests
pnpm test
```

## 📁 Project Structure

```
filcronet-framework/
├── packages/
│   ├── core/                    # Shared types, interfaces, validators
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── frontend-core/           # Vue 3 core utilities
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── auth-backend/            # NestJS authentication module
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── auth-frontend/           # Vue 3 auth composables
│       ├── src/
│       ├── package.json
│       └── README.md
├── pnpm-workspace.yaml          # Workspace configuration
├── .npmrc                       # Registry configuration
├── tsconfig.base.json           # Base TypeScript config
├── package.json                 # Root package with scripts
└── README.md                    # This file
```

## 🔧 Available Scripts

### Build & Development

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @sottosviluppo/auth-backend build

# Development mode (watch all packages)
pnpm dev

# Clean build artifacts
pnpm clean
```

### Version Management

Bump package versions following [Semantic Versioning](https://semver.org/):

```bash
# Bug fixes: 0.1.0 → 0.1.1
pnpm version:patch

# New features: 0.1.0 → 0.2.0
pnpm version:minor

# Breaking changes: 0.1.0 → 1.0.0
pnpm version:major
```

### Semantic Versioning Guide

| Change           | Version | Command | Example       | Use Case                           |
| ---------------- | ------- | ------- | ------------- | ---------------------------------- |
| Bug fixes        | PATCH   | `patch` | 0.1.0 → 0.1.1 | Fix bugs, typos, performance       |
| New features     | MINOR   | `minor` | 0.1.0 → 0.2.0 | Add features (backward compatible) |
| Breaking changes | MAJOR   | `major` | 0.1.0 → 1.0.0 | API changes, rename interfaces     |

**Complete Workflow Example**:

```bash
# 1. Make changes to code
# 2. Bump version
pnpm version:minor

# 3. Commit version bump
git add .
git commit -m "chore: bump version to 0.2.0"

# 4. Build packages
pnpm build

# 5. Publish to GitHub Packages
pnpm publish:all

# 6. Push to repository
git push
git push --tags
```

## 📤 Publishing (For Maintainers)

### Prerequisites

✅ **GitHub Personal Access Token** with scopes:

- `write:packages` - Required for publishing
- `read:packages` - Required for installing dependencies
- `repo` - Required if repository is private

✅ **Member of `sottosviluppo` organization** with package publish permissions

### Publishing Workflow

#### 1. Ensure Authentication

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Linux/Mac
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Windows PowerShell

# Configure pnpm
pnpm config set //npm.pkg.github.com/:_authToken ${GITHUB_TOKEN}  # Linux/Mac
pnpm config set //npm.pkg.github.com/:_authToken $env:GITHUB_TOKEN  # Windows
```

#### 2. Update Version

```bash
# Choose appropriate version bump
pnpm version:patch   # Bug fixes
pnpm version:minor   # New features
pnpm version:major   # Breaking changes
```

This will:

- Update `package.json` version in all packages
- Create a git commit with version bump
- Create a git tag

#### 3. Build Packages

```bash
pnpm build
```

Ensure all packages build without errors.

#### 4. Publish to GitHub Packages

```bash
pnpm publish:all
```

This will publish all packages to:

```
https://github.com/orgs/sottosviluppo/packages
```

#### 5. Push to Repository

```bash
git push
git push --tags
```

### Verify Publication

After publishing, verify packages are available:

1. **GitHub Packages UI**: https://github.com/orgs/sottosviluppo/packages
2. **Check package page**:
   - `@sottosviluppo/core`
   - `@sottosviluppo/auth-backend`
   - `@sottosviluppo/auth-frontend`
   - `@sottosviluppo/frontend-core`

## 🛠 Troubleshooting

### Installation Issues

#### `401 Unauthorized` Error

```
npm ERR! code E401
npm ERR! 401 Unauthorized - GET https://npm.pkg.github.com/@sottosviluppo%2fcore
```

**Solutions**:

1. Verify your GitHub token has `read:packages` scope
2. Check token is correctly set:

```bash
   echo $GITHUB_TOKEN  # Linux/Mac
   echo $env:GITHUB_TOKEN  # Windows PowerShell
```

3. Verify `.npmrc` configuration:

```bash
   cat .npmrc  # Linux/Mac
   type .npmrc  # Windows
```

#### `403 Forbidden` Error

```
npm ERR! code E403
npm ERR! 403 Forbidden
```

**Solutions**:

1. Verify you have access to `sottosviluppo` organization
2. Ask organization admin to grant you package access
3. Check if package visibility is set to private (requires organization membership)

#### `404 Not Found` Error

```
npm ERR! code E404
npm ERR! 404 Not Found - GET https://npm.pkg.github.com/@sottosviluppo%2fcore
```

**Solutions**:

1. Verify package exists: https://github.com/orgs/sottosviluppo/packages
2. Check package name spelling in `package.json`
3. Ensure `@sottosviluppo:registry` is correctly configured

### Build Issues

#### TypeScript Errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

#### Dependency Issues

```bash
# Remove node_modules and reinstall
rm -rf node_modules  # Linux/Mac
rmdir /s node_modules  # Windows

pnpm install
```

#### Watch Mode Not Working

```bash
# Restart development mode
pnpm clean
pnpm dev
```

### Publishing Issues

#### Token Expired

```
npm ERR! code E401
npm ERR! 401 Unauthorized - PUT https://npm.pkg.github.com/@sottosviluppo/core
```

**Solution**: Generate new GitHub token with longer expiration.

#### Permission Denied

```
npm ERR! code E403
npm ERR! 403 Forbidden - PUT https://npm.pkg.github.com/@sottosviluppo/core
```

**Solution**: Verify token has `write:packages` scope and you're a member of `sottosviluppo` organization.

## 📚 Documentation

Each package has comprehensive documentation:

- **[Core Package](./packages/core/README.md)** - Shared types, interfaces, enums, and validators
- **[Frontend Core](./packages/frontend-core/README.md)** - Vue 3 core utilities (HTTP, storage, JWT)
- **[Auth Backend](./packages/auth-backend/README.md)** - NestJS authentication with RBAC
- **[Auth Frontend](./packages/auth-frontend/README.md)** - Vue 3 authentication composables

## 🔑 Key Features

### Authentication & Authorization

- ✅ JWT-based authentication with access & refresh tokens
- ✅ HttpOnly cookies for refresh tokens (XSS protection)
- ✅ Role-Based Access Control (RBAC)
- ✅ Dynamic permission system (resource:action pattern)
- ✅ User invitation flow (passwordless user creation)
- ✅ Password recovery with one-time tokens
- ✅ Token invalidation on password change
- ✅ Automatic token refresh with retry logic

### Security

- ✅ GDPR-compliant password validation (ENISA guidelines)
- ✅ In-memory access token storage (XSS-safe)
- ✅ Personal data detection in passwords
- ✅ Transaction-safe password operations
- ✅ Race condition prevention
- ✅ Rate limiting ready

### Developer Experience

- ✅ Full TypeScript support with strict mode
- ✅ Comprehensive JSDoc documentation (Mintlify compatible)
- ✅ Zod validation (frontend) + class-validator (backend)
- ✅ Swagger/OpenAPI documentation
- ✅ Vue 3 Composition API with `toValue()` support
- ✅ Pinia state management
- ✅ Automatic permission generation

## 🤝 Contributing

This is an internal framework for Filcronet projects. Follow these guidelines:

### Code Standards

- ✅ **All code in English** - Variables, functions, classes, comments
- ✅ **Comprehensive JSDoc** - All exports need documentation
- ✅ **Type safety** - No `any` types unless absolutely necessary
- ✅ **KISS principle** - Keep it simple and maintainable
- ✅ **Test your changes** - Add tests for new features

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 📄 License

**UNLICENSED** - Private package for Filcronet internal use only.

## 🔗 Links

- [GitHub Repository](https://github.com/sottosviluppo/filcronet-framework)
- [GitHub Packages](https://github.com/orgs/sottosviluppo/packages)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Built with ❤️ by Filcronet Development Team**

_For support, contact the framework maintainers._
