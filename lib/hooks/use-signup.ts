import type { ApiResult, Client } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { SignUpParams, SSOProvider, SSOResponse } from "../types/auth";

type SignUpFunction = (params: SignUpParams) => Promise<ApiResult<unknown>>;
type InitSSOFunction = (
	provider: SSOProvider,
) => Promise<ApiResult<SSOResponse>>;

type IdentifierAvailabilityFunction = (
	identifier: string,
	identifierType: "email" | "username",
) => Promise<ApiResult<{ exists: boolean }>>;

type UseSignUpReturnType =
	| {
			isLoaded: false;
			signUp: never;
			initSSO: never;
			identifierAvailability: never;
	  }
	| {
			isLoaded: true;
			signUp: SignUpFunction;
			initSSO: InitSSOFunction;
			identifierAvailability: IdentifierAvailabilityFunction;
	  };

function builder(client: Client): SignUpFunction {
	return async (params: SignUpParams) => {
		const form = new FormData();
		for (const [key, value] of Object.entries(params)) {
			form.append(key, value);
		}
		const response = await client("/auth/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: form,
		});
		return mapResponse(response);
	};
}

function ssoBuilder(client: Client): InitSSOFunction {
	return async (provider: SSOProvider) => {
		const response = await client("/auth/sso", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ provider }),
		});
		return mapResponse(response);
	};
}

function identifierAvailabilityBuilder(
	client: Client,
): IdentifierAvailabilityFunction {
	return async (identifier: string, identifierType: "email" | "username") => {
		const response = await client(
			`/auth/identifier-availability?identifier=${identifier}&type=${identifierType}`,
		);
		return mapResponse(response);
	};
}

export function useSignUp(): UseSignUpReturnType {
	const { client, loading } = useClient();

	if (loading) {
		return {
			isLoaded: false,
			signUp: null as never,
			initSSO: null as never,
			identifierAvailability: null as never,
		};
	}

	return {
		isLoaded: true,
		signUp: builder(client),
		initSSO: ssoBuilder(client),
		identifierAvailability: identifierAvailabilityBuilder(client),
	};
}
