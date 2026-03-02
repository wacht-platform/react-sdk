<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">@wacht/jsx</a>
</h1>

<p align="center">Core React primitives for Wacht authentication, session state, organization/workspace context, and product surface hooks.</p>

<p align="center">
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://www.npmjs.com/package/@wacht/jsx">npm</a>
</p>

## Install

```bash
pnpm add @wacht/jsx @wacht/types
```

## Quick start

```tsx
import { DeploymentProvider, SignedIn, SignedOut, SignInForm } from "@wacht/jsx";

export function App() {
  return (
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
      <SignedIn>Signed in</SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </DeploymentProvider>
  );
}
```

## Main exports

Components:

- Auth UI: `SignInForm`, `SignUpForm`, `WaitlistForm`, `SSOCallback`, `MagicLinkVerification`
- Session and navigation: `SignedIn`, `SignedOut`, `SignedInAccounts`, `NavigateToSignIn`
- User/account: `UserButton`, `UserControls`, `ManageAccount`
- Notifications: `NotificationBell`, `NotificationPopover`, `NotificationPanel`

Hooks:

- Auth/session: `useUser`, `useSession`, `useSignIn`, `useSignUp`, `useForgotPassword`
- Tenancy: `useActiveOrganization`, `useActiveWorkspace`, `useActiveTenancy`
- Notifications: `useNotifications`, `useNotificationStream`, `useScopeUnread`
- Agent/webhook/api-auth surfaces: `useAgentSession`, `useWebhookEndpoints`, `useApiAuthKeys`, and related hooks

Utilities:

- Permission helpers (organization/workspace)
- URL safety helpers

## Build

```bash
pnpm build
```

## License

Apache License 2.0. See [LICENSE.md](../LICENSE.md).
