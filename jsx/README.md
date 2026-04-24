# @wacht/jsx

Shared React components and hooks for building Wacht-powered product surfaces.

Use `@wacht/jsx` when you want the core Wacht React layer without committing to a framework adapter. If you are using Next.js, React Router, or TanStack Router, you will usually install the adapter package instead and import the same primitives from there.

- Docs: https://docs.wacht.dev
- npm: https://www.npmjs.com/package/@wacht/jsx

## What it includes

`@wacht/jsx` contains the shared client-side building blocks behind the framework adapters:

- auth UI such as `SignInForm`, `SignUpForm`, `WaitlistForm`, `SSOCallback`, and `MagicLinkVerification`
- control components such as `SignedIn`, `SignedOut`, `SignedInAccounts`, and `NavigateToSignIn`
- account and tenancy components such as `UserButton`, `UserControls`, `ManageAccount`, `ManageOrganization`, `ManageWorkspace`, `CreateOrganizationForm`, and `CreateWorkspaceForm`
- notifications components such as `NotificationBell`, `NotificationPopover`, and `NotificationPanel`
- shared hooks for auth, session state, multi-tenancy, notifications, agents, webhooks, and API identity

## Install

```bash
pnpm add @wacht/jsx @wacht/types
```

## Basic usage

```tsx
import {
  DeploymentProvider,
  SignedIn,
  SignedOut,
  SignInForm,
} from "@wacht/jsx";

export default function App() {
  return (
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
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

## What `DeploymentProvider` does

`DeploymentProvider` is the shared root for the client SDK. It:

- resolves deployment configuration from the `publicKey`
- exposes deployment-aware client state to the hooks
- powers navigation-aware auth components through the platform adapter
- lets you override deployment UI settings with `uiOverrides` when you are embedding auth UI inside your own app

## Main hook families

- state and context: `useDeployment`, `useClient`, `useSession`, `useUser`, `useNavigation`
- auth flows: `useSignIn`, `useSignUp`, `useSSOCallback`, `useMagicLinkVerification`, `useForgotPassword`, `useInvitation`, `useWaitlist`, `useUserSignins`
- multi tenancy: `useOrganizationList`, `useActiveOrganization`, `useWorkspaceList`, `useActiveWorkspace`, `useActiveTenancy`, `useOrganizationMemberships`, `useWorkspaceMemberships`
- notifications: `useNotifications`, `useNotificationStream`, `useNotificationUnreadCount`
- platform surfaces: agent, webhook, and API identity hooks

## Framework adapters

If you are already using one of the supported router integrations, prefer importing from the adapter package instead of `@wacht/jsx` directly:

- `@wacht/nextjs`
- `@wacht/react-router`
- `@wacht/tanstack-router`

Those packages re-export the shared JSX layer and add the framework-specific provider and server helpers.

## Build

```bash
pnpm build
```

## License

Apache License 2.0. See [LICENSE.md](../LICENSE.md).
