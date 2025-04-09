"use client";

import { useState, useEffect, useMemo, createContext, useRef } from "react";
import type { ReactNode } from "react";

interface FrontendDeploymentContextType {
	loading: boolean;
	deployment: Deployment | null;
}

const FrontendDeploymentContext = createContext<
	FrontendDeploymentContextType | undefined
>(undefined);

interface FrontendDeploymentProviderProps {
	children: ReactNode;
	publicKey: string;
}

function FrontendDeploymentProvider({
	children,
	publicKey,
}: FrontendDeploymentProviderProps) {
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

			const baseUrlEncoded = publicKey.split("_").pop();

			if (!baseUrlEncoded) {
				throw new Error("Invalid public key");
			}

			const baseUrl = atob(baseUrlEncoded);

			const devSession = localStorage.getItem("__dev_session__");

			const deployment = await fetch(`${baseUrl}/deployment`, {
				headers: { "X-Development-Session": devSession ?? "" },
			});

			if (!deployment.ok) {
				setLoading(false);
				return;
			}

			const deploymentConfig =
				(await deployment.json()) as ClinetReponse<Deployment>;

			deploymentConfig.data.host = baseUrl;
			setDeployment(deploymentConfig.data);

			if (deployment.headers.get("X-Development-Session")) {
				localStorage.setItem(
					"__dev_session__",
					deployment.headers.get("X-Development-Session") ?? "",
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
		[loading, deployment],
	);

	return (
		<FrontendDeploymentContext.Provider value={value}>
			{children}
		</FrontendDeploymentContext.Provider>
	);
}

export { FrontendDeploymentProvider, FrontendDeploymentContext };
export type { FrontendDeploymentContextType };
