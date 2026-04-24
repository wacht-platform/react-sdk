"use client";

import type { ClientResponse, Deployment, DeploymentUISettings } from "@/types";
import type { DeploymentContextType, PlatformAdapter } from "@/types";
import { useState, useEffect, useMemo, createContext, useRef } from "react";
import type { ReactNode } from "react";
import { getStoredDevSession, persistDevSession } from "@/utils/dev-session";

const DeploymentContext = createContext<DeploymentContextType | undefined>(
    undefined,
);

interface DeploymentProviderProps {
    children: ReactNode;
    publicKey: string;
    adapter: PlatformAdapter;
    uiOverrides?: Partial<DeploymentUISettings>;
}

function DeploymentProvider({
    children,
    publicKey,
    adapter,
    uiOverrides,
}: DeploymentProviderProps) {
    const [loading, setLoading] = useState(true);
    const [deployment, setDeployment] = useState<Deployment | null>(null);
    const singletonLock = useRef(false);

    useEffect(() => {
        async function initializeDeployment() {
            if (singletonLock.current) {
                return;
            }

            try {
                singletonLock.current = true;
                setLoading(true);

                const [_, mode, baseUrlBase64] = publicKey.split("_");

                if (!baseUrlBase64) {
                    throw new Error("Invalid public key");
                }

                let baseUrl = atob(baseUrlBase64);
                let staging = mode === "test";
                const devSessionScope = baseUrl;

                let devSession = null;
                if (
                    new URLSearchParams(window.location.search).has(
                        "__dev_session__",
                    )
                ) {
                    devSession = new URLSearchParams(
                        window.location.search,
                    ).get("__dev_session__");
                    persistDevSession(devSession, devSessionScope);
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete("__dev_session__");
                    window.history.replaceState({}, "", newUrl.toString());
                } else {
                    devSession = getStoredDevSession(devSessionScope);
                    if (devSession) {
                        persistDevSession(devSession, devSessionScope);
                    }
                }

                let opts: RequestInit = {};
                const params = new URLSearchParams();

                if (!staging) {
                    opts = {
                        credentials: "include",
                    };
                } else {
                    params.append("__dev_session__", devSession ?? "");
                }

                const deployment = await fetch(
                    `${baseUrl}/deployment${staging ? "?" : ""}${params.toString()}`,
                    opts,
                );

                if (!deployment.ok) {
                    setLoading(false);
                    return;
                }

                const deploymentConfig =
                    (await deployment.json()) as ClientResponse<Deployment>;

                deploymentConfig.data.backend_host = baseUrl;

                if (uiOverrides) {
                    deploymentConfig.data.ui_settings = {
                        ...deploymentConfig.data.ui_settings,
                        ...uiOverrides,
                    };
                }

                setDeployment(deploymentConfig.data);

                if (
                    staging &&
                    deployment.headers.get("x-development-session")
                ) {
                    persistDevSession(
                        deployment.headers.get("x-development-session"),
                        devSessionScope,
                    );
                }

                setLoading(false);
            } catch {
                setLoading(false);
            }
        }

        initializeDeployment();
    }, [publicKey, uiOverrides]);

    const value = useMemo(
        () => ({
            loading,
            deployment,
            adapter,
        }),
        [loading, deployment, adapter],
    );

    return (
        <DeploymentContext.Provider value={value}>
            {children}
        </DeploymentContext.Provider>
    );
}

export { DeploymentProvider, DeploymentContext };
