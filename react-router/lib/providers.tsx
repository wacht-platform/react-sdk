"use client";

import React from "react";
import { DeploymentProvider as BaseProvider } from "@wacht/jsx";
import { createReactRouterAdapter } from "./react-router-adapter";
import type { DeploymentUISettings } from "@wacht/types";

/**
 * React Router-specific DeploymentProvider that automatically configures the adapter.
 * Works with React Router v7 without requiring manual adapter setup.
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
  const adapter = createReactRouterAdapter();

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
