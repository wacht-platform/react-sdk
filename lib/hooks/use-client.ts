import type { Deployment } from "@/types/deployment";
import { useDeployment } from "./use-deployment";
import type { Client } from "@/types/client";

type UseClientReturnType = {
  client: Client;
  loading: boolean;
};

export function useClient(): UseClientReturnType {
  const { deployment, loading: sessionLoading } = useDeployment();

  if (sessionLoading || !deployment) {
    return {
      client: () => Promise.reject(new Error("Deployment is loading")),
      loading: sessionLoading,
    };
  }

  const fetcher = async (url: URL | string, options?: RequestInit) => {
    const defaultOptions = getDefaultOptions(deployment);
    const headers = new Headers(defaultOptions.headers);

    if (options?.headers) {
      const modifiedHeaders = new Headers(options.headers);
      modifiedHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(new URL(url, deployment?.backend_host ?? ""), {
      ...defaultOptions,
      ...options,
      headers,
    });

    if (
      deployment.mode === "staging" &&
      response.headers.get("X-Development-Session")
    ) {
      localStorage.setItem(
        "__dev_session__",
        response.headers.get("X-Development-Session") ?? ""
      );
    }

    return response;
  };

  return {
    client: fetcher,
    loading: sessionLoading,
  };
}

function getDefaultOptions(deployment: Deployment): RequestInit {
  const headers = new Headers();

  if (deployment.mode === "staging") {
    headers.append(
      "X-Development-Session",
      localStorage.getItem("__dev_session__") ?? ""
    );
    return {
      headers,
    };
  } else {
    return {
      credentials: "include",
    };
  }
}
