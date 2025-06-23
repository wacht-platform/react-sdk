"use client";

import { type ReactNode } from "react";
import { DeploymentProvider as BaseDeploymentProvider } from "@snipextt/wacht";
import { createNextjsAdapter } from "./nextjs-adapter";

interface DeploymentProviderProps {
  children: ReactNode;
  publicKey: string;
}

export const DeploymentProvider = ({ children, publicKey }: DeploymentProviderProps) => {
  const adapter = createNextjsAdapter();

  return (
    <BaseDeploymentProvider
      publicKey={publicKey}
      adapter={adapter}
    >
      {children}
    </BaseDeploymentProvider>
  );
};
