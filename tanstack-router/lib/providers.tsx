"use client";

import React from "react";
import { DeploymentProvider as BaseProvider } from "@wacht/jsx";
import { createTanStackRouterAdapter } from "./tanstack-router-adapter";

import type { DeploymentUISettings } from "@wacht/types";

/**
 * TanStack Router-specific DeploymentProvider that automatically configures the adapter.
 * Works with TanStack Router without requiring manual adapter setup.
 * Can be used in the root route or any parent component.
 */
export function DeploymentProvider({
  children,
  publicKey,
  uiOverwrites,
}: {
  children: React.ReactNode;
  publicKey: string;
  uiOverwrites?: Partial<DeploymentUISettings>;
}) {
  const adapter = createTanStackRouterAdapter();

  return (
    <BaseProvider
      publicKey={publicKey}
      adapter={adapter}
      uiOverwrites={uiOverwrites}
    >
      {children}
    </BaseProvider>
  );
}
