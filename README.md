<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">Wacht React SDK Workspace</a>
</h1>

<p align="center">Official React packages for integrating Wacht across frontend and framework server boundaries.</p>

<p align="center">
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://github.com/wacht-platform">GitHub</a>
</p>

## Packages

- `@wacht/types` - shared TypeScript contracts
- `@wacht/jsx` - framework-agnostic React components and hooks
- `@wacht/nextjs` - Next.js adapter (`/server` exports included)
- `@wacht/react-router` - React Router adapter (`/server` exports included)
- `@wacht/tanstack-router` - TanStack Router adapter (`/server` exports included)

## How this workspace is organized

- `wacht-types/` - type package consumed by all adapters
- `jsx/` - core UI and hook layer
- `nextjs/`, `react-router/`, `tanstack-router/` - framework bindings

Each framework package re-exports JSX-level primitives and adds framework-specific provider + server helpers.

## Build

Install dependencies:

```bash
pnpm install
```

Build all packages:

```bash
pnpm build
```

Build individual packages:

```bash
pnpm build:types
pnpm build:jsx
pnpm build:nextjs
pnpm build:react-router
pnpm build:tanstack-router
```

## Release notes

All publishable packages ship from `dist/` and are versioned independently.

## License

Apache License 2.0. See [LICENSE.md](./LICENSE.md).
