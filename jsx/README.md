# @wacht/jsx

Core React UI/auth package for Wacht.

Use this package directly for framework-agnostic React apps, or through:
- `@wacht/nextjs`
- `@wacht/react-router`
- `@wacht/tanstack-router`

## Install

```bash
pnpm add @wacht/jsx @wacht/types
```

## Basic Setup

```tsx
import { DeploymentProvider, SignInForm, SignedIn, SignedOut } from "@wacht/jsx";

export function App() {
  return (
    <DeploymentProvider publicKey={process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY!}>
      <SignedIn>
        <div>Signed in</div>
      </SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </DeploymentProvider>
  );
}
```

## Includes

- Components: `SignInForm`, `SignUpForm`, `UserButton`, `SignedIn`, `SignedOut`, etc.
- Hooks: `useUser`, `useSession`, `useDeployment`, `useSignIn`, `useSignUp`, etc.
- Permission helpers: `hasOrgPermission`, `hasWorkspacePermission`, `isOrgAdmin`, `isWorkspaceAdmin`

For router-aware navigation behavior, use one of the framework adapters instead of raw `@wacht/jsx`.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE.md](../LICENSE.md).
