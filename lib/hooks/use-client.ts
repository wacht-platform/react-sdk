import { useDeployment } from "./use-deployment";

type UseClientReturnType = {
	client: Client;
	loading: boolean;
};

export function useClient(): UseClientReturnType {
	const { deployment, loading } = useDeployment();

	if (loading || !deployment) {
		return {
			client: () => Promise.reject(new Error("Deployment is loading")),
			loading,
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

		if (!(options?.body instanceof FormData)) {
			headers.set("Content-Type", "application/json");
		}

		const response = await fetch(new URL(url, deployment?.host ?? ""), {
			...defaultOptions,
			...options,
			headers,
		});

		return response;
	};

	return {
		client: fetcher,
		loading,
	};
}

function getDefaultOptions(deployment: Deployment): RequestInit {
	const headers = new Headers();

	if (deployment.mode === "staging") {
		headers.append(
			"X-Development-Session",
			localStorage.getItem("__dev_session__") ?? "",
		);
		return {
			headers,
		};
	}

	return {};
}
