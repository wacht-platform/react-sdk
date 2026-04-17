# Wacht React SDK

Official React packages for adding Wacht to Next.js, React Router, TanStack Router, or a shared React UI layer.

- Docs: https://docs.wacht.dev
- npm: https://www.npmjs.com/org/wacht

## Packages

- `@wacht/types`
  Shared TypeScript contracts used across the SDK.

- `@wacht/jsx`
  Shared React components and hooks. This is the core client layer for authentication, account management, multi-tenancy, notifications, agents, webhooks, and API identity.

- `@wacht/nextjs`
  Next.js adapter. Re-exports the shared React layer and adds the Next.js provider, navigation adapter, and server helpers.

- `@wacht/react-router`
  React Router adapter. Re-exports the shared React layer and adds the React Router provider, navigation adapter, and server helpers.

- `@wacht/tanstack-router`
  TanStack Router adapter. Re-exports the shared React layer and adds the TanStack Router provider, navigation adapter, and server helpers.

## Workspace layout

- `wacht-types/`
  Shared type definitions.

- `jsx/`
  Shared React components, hooks, providers, and utilities.

- `nextjs/`
  Next.js bindings.

- `react-router/`
  React Router bindings.

- `tanstack-router/`
  TanStack Router bindings.

## Install dependencies

```bash
pnpm install
```

## Build

Build the full workspace:

```bash
pnpm build
```

Build a single package:

```bash
pnpm build:types
pnpm build:jsx
pnpm build:nextjs
pnpm build:react-router
pnpm build:tanstack-router
```

## Publish notes

Each package ships from its own `dist/` output and is versioned independently.

## License

Apache License 2.0. See [LICENSE.md](./LICENSE.md).
