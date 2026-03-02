<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">@wacht/nextjs</a>
</h1>

<p align="center">Next.js integration for Wacht with middleware auth primitives, server helpers, and React provider exports.</p>

<p align="center">
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://www.npmjs.com/package/@wacht/nextjs">npm</a>
</p>

## Install

```bash
pnpm add @wacht/nextjs @wacht/jsx @wacht/types
```

## Environment

```bash
NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY=pk_test_xxx
WACHT_API_KEY=wk_live_xxx
```

## App usage

```tsx
import { DeploymentProvider } from "@wacht/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <DeploymentProvider publicKey={process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY!}>
          {children}
        </DeploymentProvider>
      </body>
    </html>
  );
}
```

## Server usage

`@wacht/nextjs/server` exports:

- Middleware/auth: `wachtMiddleware`, `createRouteMatcher`, `auth`, `getAuth`, `requireAuth`
- Client access: `wachtClient`, `createWachtServerClient`
- Types: auth payload/protect option types and related auth models

## Notes

- `frontendApiUrl` should be derived from the publishable key flow.
- Middleware and server helpers are designed for framework-level request handling.

## Build

```bash
pnpm build
```

## License

Apache License 2.0. See [LICENSE.md](../LICENSE.md).
