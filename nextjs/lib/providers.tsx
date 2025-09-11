"use client";

import React from "react";
import { 
  DeploymentProvider as BaseProvider
} from "@snipextt/wacht";
import { createNextjsAdapter } from "./nextjs-adapter";

/**
 * Next.js-specific DeploymentProvider that automatically configures the adapter.
 * Works with both App Router and Pages Router without requiring manual adapter setup.
 * Can be used in Server Components (App Router) or _app.tsx (Pages Router).
 */
export function DeploymentProvider({ 
  children, 
  publicKey 
}: { 
  children: React.ReactNode; 
  publicKey: string;
}) {
  const adapter = createNextjsAdapter();
  
  return (
    <BaseProvider publicKey={publicKey} adapter={adapter}>
      {children}
    </BaseProvider>
  );
}