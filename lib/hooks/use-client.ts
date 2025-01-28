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
            ...getDefaultOptions(deployment!),
            ...options,
        });

        return response;
    }

    return {
        client: fetcher,
        loading,
    };
}

function getDefaultOptions(deployment: Deployment): RequestInit {
    const headers = new Headers();

    if (deployment.mode === "staging") {
        headers.append("X-Development-Session", localStorage.getItem("__dev_session__") ?? "");
        return {
            headers,
        };
    }

    return {};
}
