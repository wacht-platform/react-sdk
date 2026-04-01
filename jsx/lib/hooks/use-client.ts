import { useCallback, useMemo } from "react";
import type { Deployment } from "@/types";
import { useDeployment } from "./use-deployment";
import type { Client } from "@/types";
import { getStoredDevSession, persistDevSession } from "@/utils/dev-session";

type UseClientReturnType = {
    client: Client;
    loading: boolean;
};

export function useClient(): UseClientReturnType {
    const { deployment, loading: sessionLoading } = useDeployment();

    const fetcher = useCallback<Client>(
        async (url: URL | string, options?: RequestInit) => {
            if (sessionLoading || !deployment) {
                throw new Error("Deployment is loading");
            }

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
                    getStoredDevSession(deployment.backend_host) ?? "",
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
                persistDevSession(
                    response.headers.get("x-development-session"),
                    deployment.backend_host,
                );
            }

            return response;
        },
        [deployment, sessionLoading],
    );

    return useMemo(
        () => ({
            client: fetcher,
            loading: sessionLoading,
        }),
        [fetcher, sessionLoading],
    );
}

function getDefaultOptions(deployment: Deployment): RequestInit {
    if (deployment.mode === "staging") {
        return {};
    }
    return {
        credentials: "include",
    };
}
