<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">Wacht React SDK</a>
</h1>

<p align="center">
  <strong>Drop-in React, Next.js, React Router, and TanStack Router bindings for Wacht.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/org/wacht">
    <img alt="npm" src="https://img.shields.io/badge/npm-%40wacht-cb3837?style=flat-square" />
  </a>
  <a href="https://github.com/wacht-platform/react-sdk/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" />
  </a>
  <img alt="Status" src="https://img.shields.io/badge/status-public%20beta-blue?style=flat-square" />
  <img alt="React" src="https://img.shields.io/badge/react-18%20%7C%2019-61dafb?style=flat-square" />
</p>

<p align="center">
  <a href="https://wacht.dev">Website</a> ·
  <a href="https://docs.wacht.dev">Docs</a> ·
  <a href="https://github.com/wacht-platform/react-sdk/issues">Issues</a>
</p>

---

## Overview

The Wacht React SDK is the official client layer for embedding Wacht into a React application.
It wraps the [Frontend API](https://github.com/wacht-platform/frontend-api) with typed hooks,
ready-to-use components, and framework adapters so authentication, multi-tenancy,
notifications, agent UIs, and API identity flows can be added with a few lines of code.

A single shared core (`@wacht/jsx`) provides the components and hooks; thin adapter packages
add provider, navigation, and server-helper integration for each supported framework.

## Packages

| Package                  | Purpose                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `@wacht/types`           | Shared TypeScript contracts used across the SDK.                              |
| `@wacht/jsx`             | Core components, hooks, providers, and utilities. Framework-agnostic React.   |
| `@wacht/nextjs`          | Next.js adapter — provider, navigation adapter, and server helpers.           |
| `@wacht/react-router`    | React Router adapter — provider, navigation adapter, and server helpers.     |
| `@wacht/tanstack-router` | TanStack Router adapter — provider, navigation adapter, and server helpers.   |

Each package is published independently from its own `dist/` output.

## What's Included

- **Authentication.** `<SignIn />`, `<SignUp />`, social providers, MFA, password reset.
- **Account management.** Profile, security, devices, attached identities.
- **Multi-tenancy.** Organization and workspace switching, membership, invitations, roles.
- **Notifications.** In-app notification feed and toast surfaces.
- **Agents.** UI primitives for invoking and streaming Wacht agents from the browser.
- **API identity.** End-user API key and OAuth client management.
- **Webhooks.** Customer-managed webhook subscription UIs.
- **Hooks.** Typed hooks (`useUser`, `useSession`, `useOrganization`, …) for everything above.

## Workspace Layout

```
wacht-types/        Shared type definitions
jsx/                Core React components, hooks, providers
nextjs/             Next.js bindings
react-router/       React Router bindings
tanstack-router/    TanStack Router bindings
examples/           Reference apps for each framework
```

## Quickstart

Install the adapter for your framework:

```bash
# Next.js
pnpm add @wacht/nextjs

# React Router
pnpm add @wacht/react-router

# TanStack Router
pnpm add @wacht/tanstack-router
```

See the [documentation](https://docs.wacht.dev) for provider setup, environment variables,
and framework-specific guides.

## Local Development

```bash
pnpm install

# Build the entire workspace
pnpm build

# Build a single package
pnpm build:types
pnpm build:jsx
pnpm build:nextjs
pnpm build:react-router
pnpm build:tanstack-router
```

## Status

The React SDK is in **public beta**. The hook and component APIs are stabilizing; breaking
changes are noted in each package's changelog.

## Contributing

We're not accepting pull requests yet — the contribution process isn't set up. Forks and any
other use the Apache-2.0 license allows are welcome.

## Support

- Documentation: [docs.wacht.dev](https://docs.wacht.dev).
- Direct assistance: [engineering@intellinesia.com](mailto:engineering@intellinesia.com).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE.md](./LICENSE.md) for the full text.

---

<sub>* This README was AI-generated.</sub>
