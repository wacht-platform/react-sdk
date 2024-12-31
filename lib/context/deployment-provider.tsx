import { useState, useEffect, useMemo, createContext } from "react";
import type { ReactNode } from "react";
import { Client } from "../types/client";

interface DeploymentInstance {
  baseUrl: string;
}

interface DeploymentContextType {
  loading: boolean;
  client: Client | null;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(
  undefined,
);

interface DeploymentProviderProps {
  children: ReactNode;
  publicKey: string;
}

function createClient(deployment: DeploymentInstance): Client {
  const fetcher = (url: URL | string, options?: RequestInit) =>
    fetch(new URL(url, deployment.baseUrl), options);

  return fetcher;
}

function DeploymentProvider({ children, publicKey }: DeploymentProviderProps) {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    async function initializeDeployment() {
      setLoading(true);

      const baseUrlEncoded = publicKey.split("_")[1];

      if (!baseUrlEncoded) {
        throw new Error("Invalid public key");
      }

      const deploymentConfig = {
        baseUrl: atob(baseUrlEncoded),
      };

      const client = createClient(deploymentConfig);
      setClient(() => client);
      setLoading(false);
    }

    initializeDeployment();
  }, [publicKey]);

  const value = useMemo(
    () => ({
      loading,
      client,
    }),
    [loading],
  );

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export { DeploymentProvider, DeploymentContext };
export type { DeploymentContextType };
