# @wacht/tanstack-router

TanStack Router integration for Wacht.

This package provides:
- Client-side UI bindings via `DeploymentProvider`
- Server auth helpers via `@wacht/tanstack-router/server`
- Server-side backend client helpers backed by `@wacht/backend`

## Install

```bash
pnpm add @wacht/tanstack-router @wacht/jsx @wacht/types @tanstack/react-router
```

## Environment

```bash
NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY=pk_test_base64url
WACHT_API_KEY=wk_live_xxx # only for backend API client usage
```

## Client Setup

```tsx
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { DeploymentProvider } from "@wacht/tanstack-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

export function App() {
  return (
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
      <RouterProvider router={router} />
    </DeploymentProvider>
  );
}
```

## Server Auth

```ts
import { authenticateRequest } from "@wacht/tanstack-router/server";

export async function getDashboardData(request: Request) {
  const { auth, headers } = await authenticateRequest(request, {
    publishableKey: process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY,
  });

  if (!auth.userId) {
    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(headers.entries()),
        Location: "/sign-in",
      },
    });
  }

  return Response.json({ userId: auth.userId }, { headers });
}
```

Important: always merge returned `headers` into your response.

## Server API

From `@wacht/tanstack-router/server`:
- `authenticateRequest(request, options?)`
- `getAuth(request, options?)`
- `requireAuth(request, options?)`
- `wachtClient(options?)`
- `createWachtServerClient(options?)`

## Notes

- Current TanStack server helpers are session-auth oriented.
- For machine-token gateway auth enforcement, use `@wacht/backend` gateway APIs directly in your server logic.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE.md](../LICENSE.md).
