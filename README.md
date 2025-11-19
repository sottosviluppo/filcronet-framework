# Filcronet Framework

Internal monorepo framework for Filcronet custom software projects.

## 📦 Packages

- **[@sottosviluppo/filcronet-core](./packages/core)** - Shared types, interfaces, enums and validators
- **[@sottosviluppo/filcronet-auth-backend](./packages/auth-backend)** - NestJS authentication module with RBAC
- **[@sottosviluppo/filcronet-auth-frontend](./packages/auth-frontend)** - Vue 3 authentication composables with i18n support

> **Note**: Packages are temporarily published under `@sottosviluppo` scope. They will be migrated to `@filcronet` scope when the organization becomes available.

## 🛠 Tech Stack

- **Monorepo**: pnpm workspaces
- **Language**: TypeScript (strict mode)
- **Backend**: NestJS + TypeORM + JWT
- **Frontend**: Vue 3 (Composition API) + Pinia + Zod
- **Database**: PostgreSQL / MySQL / MongoDB (via TypeORM)
- **Styling**: Tailwind CSS + PrimeVue
- **Validation**: class-validator (backend), Zod (frontend)

## 📋 Prerequisites

- Node.js 20+
- pnpm 10+
- GitHub Personal Access Token with `write:packages` scope (for publishing)

## 🚀 Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/sottosviluppo/filcronet-framework.git
cd filcronet-framework
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Development Mode (Watch)

```bash
pnpm dev
```

This will start TypeScript compiler in watch mode for all packages in parallel.

## 📚 Usage in Your Project

### 1. Setup Authentication

Create a `.npmrc` file in your project root:

```bash
echo @sottosviluppo:registry=https://npm.pkg.github.com > .npmrc
```

### 2. Authenticate with GitHub

You need a GitHub Personal Access Token with `read:packages` scope.

**Create token at**: https://github.com/settings/tokens/new

**Environment Variable**

```bash
# Windows CMD
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Linux/Mac/Git Bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install Packages

```bash
# Core package (required by others)
npm install @sottosviluppo/core

pnpm add @sottosviluppo/core
```

### 4. Use in Your Code

See individual package READMEs for detailed documentation.

## 📁 Project Structure

```
filcronet-framework/
├── packages/
│   ├── core/                    # Shared types, interfaces, validators
│   ├── auth-backend/            # NestJS auth module
│   └── auth-frontend/           # Vue 3 auth composables
├── pnpm-workspace.yaml          # Workspace configuration
├── .npmrc                       # Registry configuration
└── package.json                 # Root package with scripts
```

## 🔧 Available Scripts

### Build & Development

```bash
# Build all packages
pnpm build

# Development mode (watch)
pnpm dev

# Clean build artifacts
pnpm clean

# Clean everything
pnpm clean:all
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

After version bump:

```bash
git add .
git commit -m "chore: bump version to X.X.X"
pnpm build
pnpm -r publish
git push
```

### Semantic Versioning Guide

| Change           | Version | Example       | Use Case                           |
| ---------------- | ------- | ------------- | ---------------------------------- |
| Bug fixes        | PATCH   | 0.1.0 → 0.1.1 | Fix bugs, typos                    |
| New features     | MINOR   | 0.1.0 → 0.2.0 | Add features (backward compatible) |
| Breaking changes | MAJOR   | 0.1.0 → 1.0.0 | API changes, rename interfaces     |

**Example:**

```bash
# Fixed a bug
pnpm version:patch && pnpm build && pnpm -r publish

# Added new composable
pnpm version:minor && pnpm build && pnpm -r publish

# Renamed IUser interface (breaking!)
pnpm version:major && pnpm build && pnpm -r publish
```

## 📤 Publishing (For Maintainers)

### Prerequisites

1. **GitHub Personal Access Token** with scopes:

   - `write:packages`
   - `read:packages`
   - `repo` (if repository is private)

2. **Member of `sottosviluppo` organization** with package publish permissions

### Steps to Publish

#### 1. Set GitHub Token

```bash
# Windows CMD
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Linux/Mac/Git Bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 2. Configure pnpm

```bash
pnpm config set //npm.pkg.github.com/:_authToken $env:GITHUB_TOKEN
```

Or on Linux/Mac:

```bash
pnpm config set //npm.pkg.github.com/:_authToken ${GITHUB_TOKEN}
```

#### 3. Update Version (if needed)

```bash
# Patch version (0.1.0 → 0.1.1)
pnpm version:patch

# Minor version (0.1.0 → 0.2.0)
pnpm version:minor

# Major version (0.1.0 → 1.0.0)
pnpm version:major
```

#### 4. Build Packages

```bash
pnpm build
```

#### 5. Publish to GitHub Packages

```bash
pnpm -r publish
```

This will publish all packages to:

```
https://github.com/orgs/sottosviluppo/packages
```

### Verify Publication

After publishing, verify packages are available at:

- https://github.com/orgs/sottosviluppo/packages

## 🐛 Troubleshooting

### Cannot install packages (401 Unauthorized)

Make sure you have:

1. Created a GitHub Personal Access Token with `read:packages` scope
2. Added token to `.npmrc` or environment variable
3. Access to the `sottosviluppo` organization packages

### Build fails

```bash
pnpm clean
pnpm install
pnpm build
```

### TypeScript errors

Restart TypeScript server in your IDE or:

```bash
pnpm clean
pnpm build
```

## 📝 Documentation

Each package has its own README with detailed documentation:

- [Core Package Documentation](./packages/core/README.md)
- [Auth Backend Documentation](./packages/auth-backend/README.md)
- [Auth Frontend Documentation](./packages/auth-frontend/README.md)

## 📄 License

UNLICENSED - Private internal use only for Filcronet projects.

## 🤝 Contributing

This is an internal framework. Contact the maintainers for contribution guidelines.

## 📧 Support

For issues or questions, contact the Filcronet development team.
