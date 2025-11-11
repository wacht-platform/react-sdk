# @wacht/tanstack-router

TanStack Router adapter for Wacht authentication library. This package provides platform-specific routing integration for TanStack Router applications using the Wacht authentication system.

## Installation

```bash
pnpm add @wacht/tanstack-router @wacht/jsx @tanstack/react-router
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { DeploymentProvider } from '@wacht/tanstack-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

function App() {
  return (
    <DeploymentProvider publicKey="your-deployment-key">
      <RouterProvider router={router} />
    </DeploymentProvider>
  );
}
```

### Setup with Root Component

You can also place the `DeploymentProvider` inside your root route:

```tsx
// routes/__root.tsx
import { Outlet } from '@tanstack/react-router';
import { DeploymentProvider } from '@wacht/tanstack-router';

export function Root() {
  return (
    <DeploymentProvider publicKey="your-deployment-key">
      <Outlet />
    </DeploymentProvider>
  );
}
```

### Using Navigation Components

Once the platform adapter is configured, all Wacht navigation components will automatically use TanStack Router for navigation:

```tsx
import { NavigateToSignIn, NavigationLink } from '@wacht/tanstack-router';

function MyComponent() {
  return (
    <div>
      {/* This will use TanStack Router navigation */}
      <NavigationLink to="/dashboard">Go to Dashboard</NavigationLink>

      {/* This will redirect to sign-in using TanStack Router */}
      <NavigateToSignIn />
    </div>
  );
}
```

### Using the Navigation Hook

```tsx
import { useNavigation } from '@wacht/tanstack-router';

function MyComponent() {
  const { navigate } = useNavigation();

  const handleClick = () => {
    // This will use TanStack Router navigation
    navigate('/profile', { replace: true });
  };

  return <button onClick={handleClick}>Go to Profile</button>;
}
```

### Using Authentication Components

All Wacht authentication components work seamlessly with TanStack Router:

```tsx
import { SignInForm, UserButton, SignedIn, SignedOut } from '@wacht/tanstack-router';

function AuthRoute() {
  return (
    <>
      <SignedIn>
        <UserButton />
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </>
  );
}
```

## API

### `DeploymentProvider`

The main component that wraps your TanStack Router application with Wacht authentication. Automatically handles TanStack Router integration.

**Props:**
- `publicKey: string` - Your Wacht deployment public key
- `children: ReactNode` - Your application content

**Features:**
- Automatic TanStack Router context detection
- Smart fallback to browser APIs when Router context not available
- Type-safe navigation with TanStack Router
- Zero configuration required

### `createTanStackRouterAdapter()` (Advanced)

For advanced use cases where you need direct access to the platform adapter.

**Returns:** `PlatformAdapter`

**Example:**
```tsx
import { createTanStackRouterAdapter } from '@wacht/tanstack-router';
import { DeploymentProvider as BaseProvider } from '@wacht/jsx';

function CustomProvider({ children, publicKey }) {
  const adapter = createTanStackRouterAdapter();

  return (
    <BaseProvider publicKey={publicKey} adapter={adapter}>
      {children}
    </BaseProvider>
  );
}
```

## Requirements

- React 19+
- @tanstack/react-router 1.0+
- @wacht/jsx

## Type Safety

TanStack Router provides excellent TypeScript support. The Wacht adapter maintains full type safety when used with TanStack Router's type-safe navigation.

## Comparison with Other Adapters

| Feature | @wacht/nextjs | @wacht/react-router | @wacht/tanstack-router |
|---------|---------------|---------------------|------------------------|
| Type-safe routing | ✅ | ❌ | ✅ |
| File-based routing | ✅ | ❌ | ✅ |
| Server-side rendering | ✅ | ❌ | ❌ |
| Client-side only | ❌ | ✅ | ✅ |
| Search params | ✅ | ✅ | ✅ (Type-safe) |

## License

MIT
