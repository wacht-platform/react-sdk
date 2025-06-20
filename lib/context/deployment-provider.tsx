"use client";

import type { ClinetReponse } from "@/types/client";
import type { Deployment, DeploymentContextType } from "@/types/deployment";
import { useState, useEffect, useMemo, createContext, useRef } from "react";
import type { ReactNode } from "react";

const DeploymentContext = createContext<DeploymentContextType | undefined>(
  undefined
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

      const [_, mode, baseUrlBase64] = publicKey.split("_");

      if (!baseUrlBase64) {
        throw new Error("Invalid public key");
      }

      let baseUrl = atob(baseUrlBase64);
      let staging = mode === "test";

      if (staging) {
        baseUrl = baseUrl + "/api";
      }

      let devSession = null;
      if (new URLSearchParams(window.location.search).has("dev_session")) {
        devSession = new URLSearchParams(window.location.search).get(
          "dev_session"
        );
        localStorage.setItem("__dev_session__", devSession ?? "");
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("dev_session");
        window.history.replaceState({}, "", newUrl.toString());
      } else {
        devSession = localStorage.getItem("__dev_session__");
      }

      let opts: RequestInit = {};

      if (!staging) {
        opts = {
          credentials: "include",
        };
      } else {
        opts = {
          headers: { "X-Development-Session": devSession ?? "" },
        };
      }

      const deployment = await fetch(`${baseUrl}/deployment`, opts);

      if (!deployment.ok) {
        setLoading(false);
        return;
      }

      const deploymentConfig =
        (await deployment.json()) as ClinetReponse<Deployment>;

      deploymentConfig.data.backend_host = baseUrl;
      setDeployment(deploymentConfig.data);

      if (staging && deployment.headers.get("X-Development-Session")) {
        localStorage.setItem(
          "__dev_session__",
          deployment.headers.get("X-Development-Session") ?? ""
        );
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
    [loading, deployment]
  );

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export { DeploymentProvider, DeploymentContext };
