<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">@wacht/react-router</a>
</h1>

<p align="center">React Router adapter for Wacht, including provider integration and server-side auth helpers.</p>

<p align="center">
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://www.npmjs.com/package/@wacht/react-router">npm</a>
</p>

## Install

```bash
pnpm add @wacht/react-router @wacht/jsx @wacht/types react-router
```

## Environment

```bash
VITE_WACHT_PUBLISHABLE_KEY=pk_test_xxx
WACHT_API_KEY=wk_live_xxx
```

## App usage

```tsx
import { BrowserRouter } from "react-router";
import { DeploymentProvider } from "@wacht/react-router";

export function App() {
  return (
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
      <BrowserRouter>{/* routes */}</BrowserRouter>
    </DeploymentProvider>
  );
}
```

## Server usage

`@wacht/react-router/server` exports:

- Auth helpers: `authenticateRequest`, `getAuth`, `requireAuth`
- Server client: `wachtClient`, `createWachtServerClient`
- Auth model types (`WachtAuth`, `ProtectOptions`, `JWTPayload`, and related)

## Notes

This package re-exports the JSX primitives while adding React Router-specific provider wiring.

## Build

```bash
pnpm build
```

## License

Apache License 2.0. See [LICENSE.md](../LICENSE.md).
