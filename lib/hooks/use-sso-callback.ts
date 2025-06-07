import { useState, useEffect } from "react";
import { useClient } from "./use-client";
import { useDeployment } from "./use-deployment";
import { responseMapper } from "../utils/response-mapper";
import type { Session } from "@/types/session";

interface SSOCallbackResult {
	session: Session;
	redirect_uri?: string;
}

interface SSOCallbackState {
	loading: boolean;
	error: Error | null;
	session: Session | null;
	redirectUri: string | null;
	processed: boolean;
}

interface SSOCallbackOptions {
	onSuccess?: (session: Session, redirectUri?: string) => void;
	onError?: (error: Error) => void;
	autoRedirect?: boolean;
}

/**
 * Headless hook for handling SSO OAuth callback
 * Automatically processes URL parameters and handles the callback flow
 */
export function useSSOCallback(options: SSOCallbackOptions = {}): SSOCallbackState {
	const { onSuccess, onError, autoRedirect = true } = options;
	const { client, loading: clientLoading } = useClient();
	const { deployment } = useDeployment();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [redirectUri, setRedirectUri] = useState<string | null>(null);
	const [processed, setProcessed] = useState(false);

	// Process OAuth callback parameters
	useEffect(() => {
		if (processed || clientLoading) return;

		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		const state = urlParams.get("state");
		const oauthError = urlParams.get("error");
		const errorDescription = urlParams.get("error_description");

		// Only process if we have OAuth parameters
		if (!code && !oauthError) return;

		setProcessed(true);
		setLoading(true);

		// Handle OAuth errors
		if (oauthError) {
			const errorMessage = errorDescription || oauthError;
			const err = new Error(`OAuth Error: ${errorMessage}`);
			setError(err);
			setLoading(false);
			if (onError) onError(err);
			return;
		}

		// Handle successful callback
		if (code && state) {
			handleCallback(code, state);
		} else {
			const err = new Error("Missing required OAuth parameters");
			setError(err);
			setLoading(false);
			if (onError) onError(err);
		}
	}, [processed, clientLoading, onError]);

	const handleCallback = async (code: string, state: string) => {
		try {
			const response = await client(
				`/auth/oauth2/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
				{
					method: "GET",
				}
			);

			const result = await responseMapper<SSOCallbackResult>(response);

			if ("data" in result) {
				const sessionData = result.data.session;
				const redirectUriData = result.data.redirect_uri || null;

				setSession(sessionData);
				setRedirectUri(redirectUriData);

				if (onSuccess) {
					onSuccess(sessionData, redirectUriData || undefined);
				}
			} else {
				const err = new Error("SSO callback failed");
				setError(err);
				if (onError) onError(err);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error("Unknown error occurred");
			setError(error);
			if (onError) onError(error);
		} finally {
			setLoading(false);
		}
	};

	// Auto redirect functionality
	useEffect(() => {
		if (!autoRedirect || !session || !processed || loading) return;

		// Determine final redirect URL
		let finalRedirectUrl = redirectUri;

		if (!finalRedirectUrl) {
			finalRedirectUrl = deployment?.ui_settings?.sign_in_page_url || deployment!.frontend_host;
		}

		// Perform redirect
		if (finalRedirectUrl) {
			window.location.href = finalRedirectUrl;
		}
	}, [autoRedirect, session, processed, loading, redirectUri, deployment]);

	return {
		loading,
		error,
		session,
		redirectUri,
		processed,
	};
}

/**
 * Helper hook that provides a redirect function for manual control
 */
export function useSSORedirect() {
	const { deployment } = useDeployment();

	const redirect = (customRedirectUri?: string) => {
		let finalRedirectUrl = customRedirectUri;

		if (!finalRedirectUrl) {
			// Use deployment's sign-in page URL as fallback
			finalRedirectUrl = deployment?.ui_settings?.sign_in_page_url || deployment?.backend_host || "/";
		}

		// Add dev session for staging mode
		if (deployment?.mode === "staging" && finalRedirectUrl) {
			try {
				const url = new URL(finalRedirectUrl);
				const devSession = localStorage.getItem("__dev_session__");
				if (devSession) {
					url.searchParams.set("dev_session", devSession);
				}
				finalRedirectUrl = url.toString();
			} catch {
				// If URL parsing fails, use as-is
			}
		}

		// Perform redirect
		if (finalRedirectUrl) {
			window.location.href = finalRedirectUrl;
		}
	};

	return { redirect };
}
