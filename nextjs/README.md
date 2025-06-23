# @snipextt/wacht-nextjs

Next.js adapter for Wacht authentication library. This package provides platform-specific routing integration for Next.js applications using the Wacht authentication system.

## Installation

```bash
pnpm add @snipextt/wacht-nextjs @snipextt/wacht next
```

## Usage

### Basic Setup (App Router)

```tsx
// app/layout.tsx
import { DeploymentProvider } from '@snipextt/wacht-nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DeploymentProvider publicKey="your-deployment-key">
          {children}
        </DeploymentProvider>
      </body>
    </html>
  );
}
```

### Basic Setup (Pages Router)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { DeploymentProvider } from '@snipextt/wacht-nextjs';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DeploymentProvider publicKey="your-deployment-key">
      <Component {...pageProps} />
    </DeploymentProvider>
  );
}
```

### Using Navigation Components

Once the platform adapter is configured, all Wacht navigation components will automatically use Next.js router for navigation:

```tsx
import { NavigateToSignIn, NavigationLink } from '@snipextt/wacht';

function MyComponent() {
  return (
    <div>
      {/* This will use Next.js router navigation */}
      <NavigationLink to="/dashboard">Go to Dashboard</NavigationLink>
      
      {/* This will redirect to sign-in using Next.js router */}
      <NavigateToSignIn />
    </div>
  );
}
```

### Using the Navigation Hook

```tsx
import { useNavigation } from '@snipextt/wacht';

function MyComponent() {
  const { navigate } = useNavigation();

  const handleClick = () => {
    // This will use Next.js router navigation
    navigate('/profile', { replace: true });
  };

  return <button onClick={handleClick}>Go to Profile</button>;
}
```

## API

### `DeploymentProvider`

The main component that wraps your Next.js application with Wacht authentication. Automatically handles Next.js router integration.

**Props:**
- `publicKey: string` - Your Wacht deployment public key
- `children: ReactNode` - Your application content

**Features:**
- Automatic Next.js router detection (App Router and Pages Router)
- Smart fallback to browser APIs when needed
- Server-side safe (can be used in server components)
- Zero configuration required

### `createNextjsAdapter()` (Advanced)

For advanced use cases where you need direct access to the platform adapter.

**Returns:** `PlatformAdapter`



## Requirements

- React 19+
- Next.js 14+ or 15+
- @snipextt/wacht

## License

MIT
