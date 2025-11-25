# @sottosviluppo/frontend-core

Core utilities for Filcronet frontend packages with **automatic token refresh**, **in-memory storage**, and **401 retry logic**.

## Features

- 🌐 **HTTP Client** - Axios-based client with TypeScript support
- 🔄 **Auto Token Refresh** - Automatic refresh with 401 retry logic
- 💾 **Token Storage** - Secure in-memory storage (XSS-safe)
- 🔐 **JWT Utilities** - Decode and validate JWT tokens
- ⏰ **Refresh Scheduler** - Schedule refresh before expiration
- 🚀 **Production Ready** - Battle-tested in production

## Installation

```bash
pnpm add @sottosviluppo/frontend-core
```

## Quick Start

### HTTP Client with Auto-Refresh

```typescript
import { AxiosHttpClient, MemoryTokenStorage } from '@sottosviluppo/frontend-core';

// 1. Create HTTP client
const httpClient = new AxiosHttpClient('https://api.example.com/v1');

// 2. Create storage
const storage = new MemoryTokenStorage();

// 3. Setup auto-refresh (handles 401 automatically)
httpClient.setupAutoRefresh(async () => {
  // This function is called when:
  // - Access token expires (401 response)
  // - Multiple 401s are queued and retried after refresh
  
  const response = await httpClient.post('/auth/refresh');
  const newAccessToken = response.accessToken;
  
  // Store new token
  storage.setToken(newAccessToken);
  httpClient.setAuthToken(newAccessToken);
  
  return newAccessToken; // Return for queued requests
});

// 4. Setup unauthorized callback (when refresh fails)
httpClient.onUnauthorized(() => {
  storage.clear();
  window.location.href = '/login';
});

// 5. Make requests - auto-refresh handles 401s
const data = await httpClient.get('/users');
```

## HTTP Client

### Features

- ✅ **Automatic 401 handling** with token refresh
- ✅ **Request queuing** during refresh
- ✅ **Race condition prevention** (multiple 401s → single refresh)
- ✅ **Retry logic** for failed requests after refresh
- ✅ **TypeScript-first** with full type safety

### Basic Usage

```typescript
import { AxiosHttpClient } from '@sottosviluppo/frontend-core';

const client = new AxiosHttpClient('https://api.example.com/v1');

// Set auth token
client.setAuthToken('your-jwt-token');

// Make requests
const users = await client.get<User[]>('/users');
const user = await client.post<User>('/users', { name: 'John' });
const updated = await client.patch<User>('/users/1', { name: 'Jane' });
await client.delete('/users/1');
```

### Advanced Configuration

```typescript
// Custom headers
const data = await client.get('/users', {
  headers: { 'X-Custom': 'value' },
});

// Query parameters
const filtered = await client.get('/users', {
  params: { status: 'active', page: 1 },
});

// Timeout
const data = await client.get('/users', {
  timeout: 5000, // 5 seconds
});
```

### 401 Retry Flow

```
┌─────────────────────────────────────────────────────┐
│              Token Refresh Flow                      │
└─────────────────────────────────────────────────────┘

1. Request fails with 401
   ├─ Is refresh already in progress?
   │  ├─ Yes → Queue request, wait for refresh
   │  └─ No  → Start refresh
   │
2. Call refresh callback
   ├─ POST /auth/refresh
   ├─ Get new access token
   └─ Update HTTP client
   
3. Process queued requests
   ├─ Retry original request with new token
   ├─ Retry all queued requests
   └─ Resolve/reject promises
   
4. If refresh fails
   └─ Call onUnauthorized() → Redirect to login
```

### Race Condition Prevention

```typescript
// Multiple requests failing simultaneously
Promise.all([
  client.get('/users'),      // 401
  client.get('/products'),   // 401
  client.get('/orders'),     // 401
]);

// ✅ Only ONE refresh triggered
// ✅ All requests queued
// ✅ All retried after successful refresh
// ✅ No duplicate refresh calls
```

## Token Storage

### MemoryTokenStorage (Recommended)

```typescript
import { MemoryTokenStorage } from '@sottosviluppo/frontend-core';

const storage = new MemoryTokenStorage();

// Store tokens
storage.setToken('access-token');
storage.setUser({ id: '1', email: 'user@example.com' });

// Retrieve
const token = storage.getToken();        // string | null
const user = storage.getUser<User>();    // User | null

// Clear
storage.removeToken();
storage.removeUser();
storage.clear(); // Clear everything
```

### Why In-Memory?

**Security Comparison:**

| Storage | XSS Vulnerable | Persists on Refresh | Use Case |
|---------|---------------|-------------------|----------|
| localStorage | ✅ Yes | ✅ Yes | ❌ Not recommended |
| sessionStorage | ✅ Yes | ✅ Yes (session) | ❌ Not recommended |
| **Memory** | ❌ No | ❌ No | ✅ **Recommended** |
| HttpOnly Cookie | ❌ No | ✅ Yes | ✅ **Best for refresh tokens** |

**Our Approach:**
- Access token → Memory (short-lived, auto-refreshed)
- Refresh token → HttpOnly cookie (long-lived, secure)

### Custom Storage

Implement `ITokenStorage` interface:

```typescript
import { ITokenStorage } from '@sottosviluppo/frontend-core';

class CustomStorage implements ITokenStorage {
  getToken(): string | null {
    // Your implementation
  }
  
  setToken(token: string): void {
    // Your implementation
  }
  
  removeToken(): void {
    // Your implementation
  }
  
  getUser<T>(): T | null {
    // Your implementation
  }
  
  setUser<T>(user: T): void {
    // Your implementation
  }
  
  removeUser(): void {
    // Your implementation
  }
  
  clear(): void {
    // Your implementation
  }
}
```

## JWT Utilities

### Decode JWT

```typescript
import { decodeJwt } from '@sottosviluppo/frontend-core';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const payload = decodeJwt(token);

if (payload) {
  console.log('User ID:', payload.sub);
  console.log('Email:', payload.email);
  console.log('Expires:', new Date(payload.exp! * 1000));
}
```

### Check Token Expiration

```typescript
import { isTokenExpired, getTokenExpiryTime } from '@sottosviluppo/frontend-core';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Check if expired
if (isTokenExpired(token)) {
  console.log('Token expired, refreshing...');
  await refreshToken();
}

// Get time until expiration
const msUntilExpiry = getTokenExpiryTime(token);
console.log(`Token expires in ${Math.floor(msUntilExpiry / 1000)} seconds`);
```

## Token Refresh Scheduler

Automatically schedule token refresh before expiration.

```typescript
import { TokenRefreshScheduler } from '@sottosviluppo/frontend-core';

// Create scheduler
const scheduler = new TokenRefreshScheduler(
  async () => {
    // Refresh callback - called automatically
    await authApi.refreshToken();
  },
  60000 // Refresh 1 minute (60000ms) before expiry
);

// Schedule refresh when you get a new token
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
scheduler.schedule(accessToken);

// Token will be refreshed automatically 1 minute before expiration

// Cancel on logout
scheduler.cancel();
```

### How It Works

```typescript
// Token expires at: 15:30:00
// Current time: 15:15:00
// Time until expiry: 15 minutes = 900000ms
// Refresh before: 60000ms (1 minute)
// Scheduled refresh: 900000 - 60000 = 840000ms (14 minutes)
// Refresh will trigger at: 15:29:00 (1 minute before expiry)
```

### Edge Cases Handled

```typescript
// ✅ Token already expired
scheduler.schedule(expiredToken);
// → Refreshes immediately

// ✅ Token expires in less than refresh window
scheduler.schedule(tokenExpiring30Seconds);
// → Refreshes immediately (30s < 60s window)

// ✅ Multiple schedules
scheduler.schedule(token1);
scheduler.schedule(token2); // Cancels previous, schedules new
```

## Complete Integration Example

```typescript
import {
  AxiosHttpClient,
  MemoryTokenStorage,
  TokenRefreshScheduler,
  decodeJwt,
} from '@sottosviluppo/frontend-core';

// 1. Setup
const httpClient = new AxiosHttpClient('https://api.example.com/v1');
const storage = new MemoryTokenStorage();
const scheduler = new TokenRefreshScheduler(
  async () => await refreshAccessToken(),
  60000
);

// 2. Auto-refresh on 401
httpClient.setupAutoRefresh(async () => {
  const response = await httpClient.post('/auth/refresh');
  const newToken = response.accessToken;
  
  storage.setToken(newToken);
  httpClient.setAuthToken(newToken);
  scheduler.schedule(newToken); // Schedule next refresh
  
  return newToken;
});

// 3. Unauthorized callback
httpClient.onUnauthorized(() => {
  storage.clear();
  scheduler.cancel();
  window.location.href = '/login';
});

// 4. Login
async function login(credentials) {
  const response = await httpClient.post('/auth/login', credentials);
  
  storage.setToken(response.accessToken);
  storage.setUser(response.user);
  httpClient.setAuthToken(response.accessToken);
  scheduler.schedule(response.accessToken);
  
  return response;
}

// 5. Manual refresh
async function refreshAccessToken() {
  const response = await httpClient.post('/auth/refresh');
  
  storage.setToken(response.accessToken);
  storage.setUser(response.user);
  httpClient.setAuthToken(response.accessToken);
  scheduler.schedule(response.accessToken);
  
  return response.accessToken;
}

// 6. Logout
function logout() {
  httpClient.post('/auth/logout');
  storage.clear();
  httpClient.setAuthToken(null);
  scheduler.cancel();
}

// 7. Make requests - everything is automatic!
const users = await httpClient.get('/users');
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
interface IHttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  setAuthToken(token: string | null): void;
  onUnauthorized(callback: () => void): void;
  setupAutoRefresh(refreshCallback: () => Promise<string>): void;
}

interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  getUser<T>(): T | null;
  setUser<T>(user: T): void;
  removeUser(): void;
  clear(): void;
}

interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  type?: string;
  iat?: number;
  exp?: number;
}
```

## Best Practices

### ✅ Do

- Use `MemoryTokenStorage` for access tokens
- Use HttpOnly cookies for refresh tokens
- Enable auto-refresh for better UX
- Handle `onUnauthorized` callback
- Schedule refresh before expiration (60s recommended)
- Clear storage on logout

### ❌ Don't

- Store refresh tokens in localStorage/sessionStorage
- Store sensitive data in memory storage
- Skip `onUnauthorized` callback
- Forget to cancel scheduler on logout
- Use expired tokens without refreshing

## Testing

```typescript
// Mock HTTP client
const mockClient: IHttpClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  setAuthToken: vi.fn(),
  onUnauthorized: vi.fn(),
  setupAutoRefresh: vi.fn(),
};

// Mock storage
const mockStorage: ITokenStorage = {
  getToken: vi.fn(() => 'mock-token'),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  getUser: vi.fn(() => ({ id: '1' })),
  setUser: vi.fn(),
  removeUser: vi.fn(),
  clear: vi.fn(),
};
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern browsers with ES2020 support

## Related Packages

- **[@sottosviluppo/core](../core)** - Shared types and interfaces
- **[@sottosviluppo/auth-frontend](../auth-frontend)** - Complete Vue 3 auth solution
- **[@sottosviluppo/auth-backend](../auth-backend)** - NestJS auth module

## License

UNLICENSED - Private package for Filcronet projects.

---

**Built for security. Optimized for developer experience.**