"use client";

import React from "react";
import { DeploymentProvider as BaseProvider } from "@wacht/jsx";
import { createTanStackRouterAdapter } from "./tanstack-router-adapter";

/**
 * TanStack Router-specific DeploymentProvider that automatically configures the adapter.
 * Works with TanStack Router without requiring manual adapter setup.
 * Should be used within the TanStack Router context.
 */
export function DeploymentProvider({
  children,
  publicKey,
}: {
  children: React.ReactNode;
  publicKey: string;
}) {
  const adapter = createTanStackRouterAdapter();

  return (
    <BaseProvider publicKey={publicKey} adapter={adapter}>
      {children}
    </BaseProvider>
  );
}
