import { useState } from "react";
import type { ApiResult, Client } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import type { SignUpParams, SSOProvider, SSOResponse } from "../types/auth";
import type { SignInAttempt, Session } from "../types/session";

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
		signUpAttempt: null;
	}
	| {
		isLoaded: true;
		signUp: SignUpFunction;
		initSSO: InitSSOFunction;
		identifierAvailability: IdentifierAvailabilityFunction;
		signUpAttempt: SignInAttempt | null;
	};

type SignUpResponse = {
	sign_in_attempt?: SignInAttempt;
};

type InitSSOResponseType = {
	oauth_url: string;
	session: Session;
};

function builder(
	client: Client,
	setSignUpAttempt: (attempt: SignInAttempt | null) => void,
): SignUpFunction {
	return async (params: SignUpParams) => {
		const form = new FormData();
		for (const [key, value] of Object.entries(params)) {
			form.append(key, value);
		}
		const response = await client("/auth/signup", {
			method: "POST",
			body: form,
		});
		const result = await mapResponse<SignUpResponse>(response);
		if ("data" in result && result.data?.sign_in_attempt) {
			setSignUpAttempt(result.data.sign_in_attempt);
		}
		return result;
	};
}

function ssoBuilder(client: Client): InitSSOFunction {
	return async (provider: SSOProvider) => {
		const response = await client("/auth/oauth/authorize", {
			method: "POST",
			body: JSON.stringify({ provider }),
		});
		return mapResponse<InitSSOResponseType>(response);
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
	const [signUpAttempt, setSignUpAttempt] = useState<SignInAttempt | null>(
		null,
	);

	if (loading) {
		return {
			isLoaded: false,
			signUp: null as never,
			initSSO: null as never,
			identifierAvailability: null as never,
			signUpAttempt: null,
		};
	}

	return {
		isLoaded: true,
		signUpAttempt,
		signUp: builder(client, setSignUpAttempt),
		initSSO: ssoBuilder(client),
		identifierAvailability: identifierAvailabilityBuilder(client),
	};
}
