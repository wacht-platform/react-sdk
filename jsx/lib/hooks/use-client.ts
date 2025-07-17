import type { Deployment } from "@/types";
import { useDeployment } from "./use-deployment";
import type { Client } from "@/types";

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

    const backendUrl = new URL(`${deployment.backend_host ?? ""}${url}`);

    if (deployment.mode === "staging") {
      backendUrl.searchParams.append(
        "__dev_session__",
        localStorage.getItem("__dev_session__") ?? ""
      );
    }

    const response = await fetch(backendUrl, {
      ...defaultOptions,
      ...options,
      headers,
    });

    if (
      deployment.mode === "staging" &&
      response.headers.get("x-development-session")
    ) {
      localStorage.setItem(
        "__dev_session__",
        response.headers.get("x-development-session") ?? ""
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
  if (deployment.mode === "staging") {
    return {};
  }
  return {
    credentials: "include",
  };
}
