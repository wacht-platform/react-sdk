<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">@wacht/tanstack-router</a>
</h1>

<p align="center">TanStack Router adapter for Wacht, including provider integration and server-side auth helpers.</p>

<p align="center">
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://www.npmjs.com/package/@wacht/tanstack-router">npm</a>
</p>

## Install

```bash
pnpm add @wacht/tanstack-router @wacht/jsx @wacht/types @tanstack/react-router
```

## Environment

```bash
VITE_WACHT_PUBLISHABLE_KEY=pk_test_xxx
WACHT_API_KEY=wk_live_xxx
```

## App usage

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

## Server usage

`@wacht/tanstack-router/server` exports:

- Auth helpers: `authenticateRequest`, `getAuth`, `requireAuth`
- Server client: `wachtClient`, `createWachtServerClient`
- Auth model types (`WachtAuth`, `ProtectOptions`, `JWTPayload`, and related)

## Notes

This package re-exports JSX primitives and layers TanStack Router adapter behavior on top.

## Build

```bash
pnpm build
```

## License

Apache License 2.0. See [LICENSE.md](../LICENSE.md).
