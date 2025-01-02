import { Client } from "../types/client";
import { useDeployment } from "./use-deployment";

type UseClientReturnType = {
    client: Client;
    loading: boolean;
}

export function useClient(): UseClientReturnType {
    const { deployment, loading } = useDeployment();

    if (loading) {
        return {
            client: () => Promise.reject(new Error("Deployment is loading")),
            loading,
        };
    }

    const fetcher = async (url: URL | string, options?: RequestInit) => {
        const response = await fetch(new URL(url, deployment?.host ?? ""), {
            ...options,
            ...getDefaultOptions(deployment!),
        });

        return response;
    }

    return {
        client: fetcher,
        loading,
    };
}

function getDefaultOptions(deployment: Deployment): RequestInit {
    if (deployment.mode === "staging") {
        return {
            headers: {
                "X-Development-Session": localStorage.getItem("__dev_session__") ?? "",
            },
        };
    }

    return {};
}
