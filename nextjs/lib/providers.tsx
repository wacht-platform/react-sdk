"use client";

import React from "react";
import {
  DeploymentProvider as BaseProvider
} from "@wacht/jsx";
import { createNextjsAdapter } from "./nextjs-adapter";

import type { DeploymentUISettings } from "@wacht/types";

/**
 * Next.js-specific DeploymentProvider that automatically configures the adapter.
 * Works with Next.js App Router without requiring manual adapter setup.
 * Can be used in the root layout or any parent component.
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
  const adapter = createNextjsAdapter();

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