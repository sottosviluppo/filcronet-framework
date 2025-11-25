# @sottosviluppo/frontend-core

Core utilities for Filcronet frontend packages. Framework-agnostic building blocks for Vue 3 applications.

## Features

- 🌐 **HTTP Client** - Axios-based client with TypeScript support
- 💾 **Generic Storage** - In-memory and localStorage implementations
- 🎣 **Vue Composables** - Reusable composition functions
- 🚀 **Framework Agnostic** - Can be extended by other packages

## Installation

```bash
pnpm add @sottosviluppo/frontend-core
```

## Quick Start

### HTTP Client

```typescript
import { AxiosHttpClient } from '@sottosviluppo/frontend-core';

// Create client
const client = new AxiosHttpClient('https://api.example.com/v1');

// Make requests
const users = await client.get<User[]>('/users');
const user = await client.post<User>('/users', { name: 'John' });
const updated = await client.patch<User>('/users/1', { name: 'Jane' });
await client.delete('/users/1');
```

### Storage

```typescript
import { MemoryStorage, LocalStorage } from '@sottosviluppo/frontend-core';

// In-memory storage (XSS-safe, lost on refresh)
const memoryStorage = new MemoryStorage();
memoryStorage.set('key', { data: 'value' });
const data = memoryStorage.get<MyType>('key');

// LocalStorage (persists across sessions)
const localStorage = new LocalStorage();
localStorage.set('theme', 'dark');
```

### Vue Composables

```typescript
import { useDebounce, useLocalStorage } from '@sottosviluppo/frontend-core';

// Debounced value
const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 300);

// Reactive localStorage
const theme = useLocalStorage('theme', 'light');
theme.value = 'dark'; // Automatically persisted
```

## API Reference

### HTTP Client

#### IHttpClient Interface

```typescript
interface IHttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  setHeader(key: string, value: string | null): void;
  onError(callback: (error: any) => void): void;
  onRequest(callback: (config: any) => any): void;
}
```

#### AxiosHttpClient

```typescript
import { AxiosHttpClient } from '@sottosviluppo/frontend-core';

const client = new AxiosHttpClient('https://api.example.com/v1');

// Set default headers
client.setHeader('X-Custom-Header', 'value');

// Error handling
client.onError((error) => {
  console.error('API Error:', error.message);
});

// Request interceptor
client.onRequest((config) => {
  config.headers['X-Request-ID'] = generateId();
  return config;
});

// Access underlying Axios instance
const axios = client.getAxiosInstance();
```

#### Request Configuration

```typescript
interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

// Usage
const data = await client.get('/users', {
  headers: { 'Accept-Language': 'it' },
  params: { page: 1, limit: 10 },
  timeout: 5000,
});
```

### Storage

#### IStorage Interface

```typescript
interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
```

#### MemoryStorage

In-memory storage, data lost on page refresh. **Recommended for sensitive data.**

```typescript
import { MemoryStorage } from '@sottosviluppo/frontend-core';

const storage = new MemoryStorage();

storage.set('token', 'secret-value');
const token = storage.get<string>('token');
storage.has('token'); // true
storage.remove('token');
storage.clear();
```

#### LocalStorage

Persistent storage using browser's localStorage.

```typescript
import { LocalStorage } from '@sottosviluppo/frontend-core';

const storage = new LocalStorage();

// Automatically serializes/deserializes JSON
storage.set('user', { id: 1, name: 'John' });
const user = storage.get<User>('user');
```

### Composables

#### useDebounce

Debounces a reactive value.

```typescript
import { useDebounce } from '@sottosviluppo/frontend-core';

const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 300);

// debouncedQuery updates 300ms after searchQuery stops changing
watch(debouncedQuery, (value) => {
  fetchResults(value);
});
```

#### useLocalStorage

Reactive localStorage with automatic persistence.

```typescript
import { useLocalStorage } from '@sottosviluppo/frontend-core';

// With default value
const theme = useLocalStorage('theme', 'light');

// Read
console.log(theme.value); // 'light' or stored value

// Write (automatically persisted)
theme.value = 'dark';

// With custom serializer
const settings = useLocalStorage('settings', { notifications: true }, {
  serializer: {
    read: (v) => JSON.parse(v),
    write: (v) => JSON.stringify(v),
  },
});
```

## Extending for Authentication

This package provides base utilities. For authentication features, use `@sottosviluppo/auth-frontend` which extends these classes:

```typescript
// auth-frontend extends frontend-core
import { AxiosHttpClient, MemoryStorage } from '@sottosviluppo/frontend-core';

// AuthHttpClient extends AxiosHttpClient with:
// - setAuthToken()
// - setupAutoRefresh()
// - onUnauthorized()

// MemoryTokenStorage uses MemoryStorage with:
// - getToken() / setToken()
// - getUser() / setUser()
// - Token-specific API
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
import type { 
  IHttpClient, 
  IStorage, 
  RequestConfig 
} from '@sottosviluppo/frontend-core';

// Implement custom HTTP client
class CustomHttpClient implements IHttpClient {
  // ...
}

// Implement custom storage
class CustomStorage implements IStorage {
  // ...
}
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern browsers with ES2020 support

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types and interfaces
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Vue 3 authentication (extends this package)
- **[@sottosviluppo/auth-backend](../auth-backend)** - NestJS auth module

## License

UNLICENSED - Private package for Filcronet projects.

---

**Simple. Extensible. Type-safe.**
