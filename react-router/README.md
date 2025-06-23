# @snipextt/wacht-react-router

React Router adapter for Wacht authentication library. This package provides platform-specific routing integration for React Router applications using the Wacht authentication system.

## Installation

```bash
pnpm add @snipextt/wacht-react-router @snipextt/wacht react-router-dom
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DeploymentProvider } from '@snipextt/wacht-react-router';

function App() {
  return (
    <DeploymentProvider publicKey="your-deployment-key">
      <BrowserRouter>
        {/* Your app content */}
      </BrowserRouter>
    </DeploymentProvider>
  );
}
```

### Advanced Setup (DeploymentProvider Outside Router)

The wrapper handles the common case where `DeploymentProvider` is outside the React Router context:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DeploymentProvider } from '@snipextt/wacht-react-router';

function App() {
  return (
    <DeploymentProvider publicKey="your-deployment-key">
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Navigation components inside Router automatically use React Router */}
        </Routes>
      </BrowserRouter>
    </DeploymentProvider>
  );
}
```

### Using Navigation Components

Once the platform adapter is configured, all Wacht navigation components will automatically use React Router for navigation:

```tsx
import { NavigateToSignIn, NavigationLink } from '@snipextt/wacht';

function MyComponent() {
  return (
    <div>
      {/* This will use React Router navigation */}
      <NavigationLink to="/dashboard">Go to Dashboard</NavigationLink>
      
      {/* This will redirect to sign-in using React Router */}
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
    // This will use React Router navigation
    navigate('/profile', { replace: true });
  };

  return <button onClick={handleClick}>Go to Profile</button>;
}
```

## API

### `DeploymentProvider`

The main component that wraps your React application with Wacht authentication. Automatically handles React Router integration.

**Props:**
- `publicKey: string` - Your Wacht deployment public key
- `children: ReactNode` - Your application content

**Features:**
- Automatic React Router context detection
- Smart fallback to browser APIs when Router context not available
- Works regardless of provider placement in component tree
- Zero configuration required

### `createReactRouterAdapter()` (Advanced)

For advanced use cases where you need direct access to the platform adapter.

**Returns:** `PlatformAdapter`

## Requirements

- React 19+
- React Router DOM 6+
- @snipextt/wacht

## License

MIT
