import { useState, useRef, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type { ApiAuthAppInfo, ApiAuthAppSessionData } from "@wacht/types";

interface UseApiAuthAppSessionResult {
	// Session state
	hasSession: boolean;
	sessionLoading: boolean;
	sessionError: Error | null;
	sessionId: string | null;

	// API Auth App
	apiAuthApp: ApiAuthAppInfo | null;

	// Ticket state
	ticketExchanged: boolean;
	ticketLoading: boolean;

	// Helpers
	refetch: () => Promise<void>;
}

export function useApiAuthAppSession(ticket?: string | null): UseApiAuthAppSessionResult {
	const { client } = useClient();

	const [ticketExchanged, setTicketExchanged] = useState(!ticket);
	const [ticketLoading, setTicketLoading] = useState(!!ticket);
	const [ticketError, setTicketError] = useState<Error | null>(null);
	const exchangedRef = useRef(false);
	const exchangingRef = useRef(false);

	const shouldFetch = ticketExchanged;

	const fetcher = useCallback(async () => {
		const response = await client("/api-auth/session", {
			method: "GET",
		});

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				throw new Error("NO_SESSION");
			}
			throw new Error("Failed to fetch API auth app session");
		}

		const parsed = await responseMapper<ApiAuthAppSessionData>(response);
		return parsed.data;
	}, [client]);

	const { data, error: fetchError, isLoading, mutate } = useSWR(
		shouldFetch ? "wacht-api-auth-app-session" : null,
		fetcher,
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
		}
	);

	// Handle ticket exchange
	useEffect(() => {
		if (!ticket || exchangedRef.current || exchangingRef.current) return;

		const exchange = async () => {
			exchangingRef.current = true;
			setTicketLoading(true);
			try {
				const response = await client(`/session/ticket/exchange?ticket=${encodeURIComponent(ticket)}`, {
					method: "GET",
				});

				if (response.ok) {
					exchangedRef.current = true;
					setTicketExchanged(true);
				} else {
					setTicketError(new Error("Failed to exchange ticket"));
				}
			} catch (err) {
				setTicketError(err instanceof Error ? err : new Error("Failed to exchange ticket"));
			} finally {
				setTicketLoading(false);
				exchangingRef.current = false;
			}
		};

		exchange();
	}, [ticket, client]);

	const hasSession = !fetchError || fetchError.message !== "NO_SESSION";
	const sessionError = ticketError || (fetchError && fetchError.message !== "NO_SESSION" ? fetchError : null);
	const sessionLoading = ticketLoading || (shouldFetch && isLoading);

	return {
		hasSession,
		sessionLoading,
		sessionError,
		sessionId: data?.session_id || null,
		apiAuthApp: data?.api_auth_app || null,
		ticketExchanged,
		ticketLoading,
		refetch: async () => { await mutate(); }
	};
}
