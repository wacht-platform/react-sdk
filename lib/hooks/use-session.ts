import type { ApiResult, Client } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import { useEffect, useState } from "react";
import type { Session } from "../types/session";

type UseSessionReturnType =
	| {
			isLoaded: false;
			session: never;
			switchSignIn: never;
			signOut: never;
	  }
	| {
			isLoaded: true;
			session: Session;
			switchSignIn: (signInId: number) => Promise<void>;
			signOut: (signInId?: number) => Promise<void>;
	  };

async function fetchSession(client: Client): Promise<ApiResult<Session>> {
	const response = await client("/session", {
		method: "GET",
	});
	return mapResponse(response);
}

async function switchSignIn(
	client: Client,
	signInId: number,
): Promise<ApiResult<Session>> {
	const response = await client(
		`/session/switch-sign-in?sign_in_id=${signInId}`,
		{
			method: "POST",
		},
	);
	return mapResponse(response);
}

async function signOut(
	client: Client,
	signInId?: number,
): Promise<ApiResult<Session>> {
	const url = signInId
		? `/session/sign-out?sign_in_id=${signInId}`
		: "/session/sign-out";
	const response = await client(url, {
		method: "POST",
	});
	return mapResponse(response);
}

export function useSession(): UseSessionReturnType {
	const { client, loading } = useClient();
	const [session, setSession] = useState<Session | null>(null);

	useEffect(() => {
		if (!loading && client) {
			fetchSession(client).then(({ data }) => {
				setSession(data);
			});
		}
	}, [client, loading]);

	if (loading || !session) {
		return {
			isLoaded: false,
			session: null as never,
			switchSignIn: null as never,
			signOut: null as never,
		};
	}

	return {
		isLoaded: true,
		session,
		switchSignIn: async (signInId: number) => {
			const { data } = await switchSignIn(client, signInId);
			setSession(data);
		},
		signOut: async (signInId?: number) => {
			const { data } = await signOut(client, signInId);
			setSession(data);
		},
	};
}
