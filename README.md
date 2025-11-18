# Filcronet Framework

Internal framework for Filcronet custom software projects.

## Packages

- **[@filcronet/core](./packages/core)** - Shared types, interfaces and enums
- **[@filcronet/auth-backend](./packages/auth-backend)** - NestJS authentication module
- **[@filcronet/auth-frontend](./packages/auth-frontend)** - Vue3 authentication module

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: NestJS + TypeORM
- **Frontend**: Vue 3 + TypeScript
- **Database**: PostgreSQL / MySQL / MongoDB
- **Styling**: Tailwind CSS + PrimeVue

## Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Development mode (watch)
pnpm dev
```

### Project Structure

```
filcronet-framework/
├── packages/
│   ├── core/              # Shared types and interfaces
│   └── auth-backend/      # Backend Authentication module
│   └── auth-frontend/     # Frontend Authentication module
├── pnpm-workspace.yaml
└── package.json
```

## Usage

### Install in a project

```bash
pnpm add @filcronet/core
```

## Scripts

```bash
# Build all packages
pnpm build

# Clean build artifacts
pnpm clean

# Watch mode
pnpm dev

# Bump versions
pnpm version:patch
pnpm version:minor

# Publish (to private registry)
pnpm publish:all
```

## License

UNLICENSED - Private internal use only
