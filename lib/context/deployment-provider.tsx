import { useState, useEffect, useMemo, createContext, useRef } from "react";
import type { ReactNode } from "react";
import { ClinetReponse } from "../types/client";

interface DeploymentContextType {
  loading: boolean;
  deployment: Deployment | null;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(
  undefined,
);

interface DeploymentProviderProps {
  children: ReactNode;
  publicKey: string;
}



function DeploymentProvider({ children, publicKey }: DeploymentProviderProps) {
  const [loading, setLoading] = useState(true);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const singletonLock = useRef(false);

  useEffect(() => {
    async function initializeDeployment() {
      if (singletonLock.current) {
        return;
      }

      singletonLock.current = true;
      setLoading(true);

      const baseUrlEncoded = publicKey.split("_")[1];

      if (!baseUrlEncoded) {
        throw new Error("Invalid public key");
      }

      const baseUrl = atob(baseUrlEncoded);

      const devSession = localStorage.getItem("__dev_session__");

      const deployment = await fetch(baseUrl + "/deployment", { headers: { "X-Development-Session": devSession ?? "" } });
      if (!deployment.ok) {
        throw new Error("Invalid deployment");
      }
      const deploymentConfig =
        (await deployment.json()) as ClinetReponse<Deployment>;

      deploymentConfig.data.host = baseUrl;
      setDeployment(deploymentConfig.data);

      if (deployment.headers.get("X-Development-Session")) {
        localStorage.setItem("__dev_session__", deployment.headers.get("X-Development-Session") ?? "");
      }

      setLoading(false);
    }

    initializeDeployment();
  }, [publicKey]);

  const value = useMemo(
    () => ({
      loading,
      deployment,
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
