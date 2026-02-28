# @wacht/nextjs

Next.js integration for Wacht.

This package provides:
- Client-side UI bindings via `DeploymentProvider`
- Server auth primitives via `@wacht/nextjs/server`
- Middleware/proxy integration with `wachtMiddleware`
- Server-side API client helpers backed by `@wacht/backend`

## Install

```bash
pnpm add @wacht/nextjs @wacht/jsx @wacht/types
```

## Environment

```bash
NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY=pk_test_base64url
WACHT_API_KEY=wk_live_xxx # only needed for server-side backend API calls
```

`frontendApiUrl` is derived from the publishable key. Do not pass it manually.

## Client Setup

```tsx
// app/layout.tsx
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

## Proxy (Next.js 16+)

```ts
// proxy.ts
import { NextResponse } from "next/server";
import { createRouteMatcher, wachtMiddleware } from "@wacht/nextjs/server";

const isProtected = createRouteMatcher(["/dashboard(.*)", "/api/private(.*)"]);

export default wachtMiddleware(
  async (auth, req) => {
    if (!isProtected(req)) return NextResponse.next();
    await auth.protect();
    return NextResponse.next();
  },
  {
    apiRoutePrefixes: ["/api", "/trpc"],
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

## Server Auth API

From `@wacht/nextjs/server`:
- `wachtMiddleware(handler?, options?)`
- `createRouteMatcher(patterns)`
- `auth(request, options?)` and `auth(headers)`
- `getAuth(request, options?)`
- `requireAuth(request, options?)`

`auth.protect()` supports:
- auth checks
- permission checks
- token-type checks (`session_token`, `api_key`, `oauth_token`, `machine_token`, `any`)

## API-style vs document requests

For middleware errors:
- Non-API-like requests: redirect to sign-in/account portal
- API-like requests (as detected by `apiRoutePrefixes` or `isApiRoute`): JSON error response with status code

## Server Backend Client

```ts
import { NextResponse } from "next/server";
import { wachtClient } from "@wacht/nextjs/server";

export async function GET() {
  const client = await wachtClient();
  const apps = await client.webhooks.listWebhookApps();
  return NextResponse.json({ apps });
}
```

Or create explicit instances:

```ts
import { createWachtServerClient } from "@wacht/nextjs/server";

const client = createWachtServerClient({
  apiKey: process.env.WACHT_API_KEY,
  name: "internal-worker",
});
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE.md](../LICENSE.md).
