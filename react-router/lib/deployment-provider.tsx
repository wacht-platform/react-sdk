"use client";

import { type ReactNode } from "react";
import { DeploymentProvider as BaseDeploymentProvider } from "@snipextt/wacht";
import { createReactRouterAdapter } from "./react-router-adapter";

interface DeploymentProviderProps {
  children: ReactNode;
  publicKey: string;
}

export const DeploymentProvider = ({ children, publicKey }: DeploymentProviderProps) => {
  const adapter = createReactRouterAdapter();

  return (
    <BaseDeploymentProvider
      publicKey={publicKey}
      adapter={adapter}
    >
      {children}
    </BaseDeploymentProvider>
  );
};
