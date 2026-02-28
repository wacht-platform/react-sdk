# @wacht/react-router

React Router integration for Wacht.

This package provides:
- Client-side UI bindings via `DeploymentProvider`
- Server auth helpers via `@wacht/react-router/server`
- Server-side backend client helpers backed by `@wacht/backend`

## Install

```bash
pnpm add @wacht/react-router @wacht/jsx @wacht/types react-router
```

## Environment

```bash
NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY=pk_test_base64url
WACHT_API_KEY=wk_live_xxx # only for backend API client usage
```

## Client Setup

```tsx
import { DeploymentProvider } from "@wacht/react-router";
import { BrowserRouter } from "react-router";

export function App() {
  return (
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
      <BrowserRouter>{/* routes */}</BrowserRouter>
    </DeploymentProvider>
  );
}
```

## Server Auth (loaders/actions)

```ts
import { json, redirect, type LoaderFunctionArgs } from "react-router";
import { authenticateRequest } from "@wacht/react-router/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { auth, headers } = await authenticateRequest(request, {
    publishableKey: process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY,
  });

  if (!auth.userId) {
    throw redirect("/sign-in", { headers });
  }

  return json({ userId: auth.userId }, { headers });
}
```

Important: always forward `headers` returned by `authenticateRequest()`.

## Server API

From `@wacht/react-router/server`:
- `authenticateRequest(request, options?)`
- `getAuth(request, options?)`
- `requireAuth(request, options?)`
- `wachtClient(options?)`
- `createWachtServerClient(options?)`

## Notes

- Current React Router server helpers are session-auth oriented.
- For machine-token gateway auth enforcement, use `@wacht/backend` gateway APIs directly in your server logic.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE.md](../LICENSE.md).
