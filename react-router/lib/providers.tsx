"use client";

import React from "react";
import { DeploymentProvider as BaseProvider } from "@wacht/jsx";
import { createReactRouterAdapter } from "./react-router-adapter";

/**
 * React Router-specific DeploymentProvider that automatically configures the adapter.
 * Works with React Router v7 without requiring manual adapter setup.
 * Can be used in the root route or any parent component.
 */
export function DeploymentProvider({
  children,
  publicKey,
}: {
  children: React.ReactNode;
  publicKey: string;
}) {
  const adapter = createReactRouterAdapter();

  return (
    <BaseProvider publicKey={publicKey} adapter={adapter}>
      {children}
    </BaseProvider>
  );
}
