"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, X } from "@phosphor-icons/react";
import { DefaultStylesProvider } from "../utility/root";
import { useSSOCallback } from "../../hooks/use-sso-callback";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { PasskeyPrompt } from "./passkey-prompt";
import { AuthCard, AuthHead, Spin } from "./auth-card";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

function Status({
    title,
    sub,
    icon,
    message,
    action,
    footer,
}: {
    title: string;
    sub: string;
    icon: ReactNode;
    message: string;
    action?: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <DefaultStylesProvider>
            <AuthCard footer={footer}>
                <AuthHead title={title} sub={sub} />
                <div className="w-auth-status">
                    {icon}
                    <p className="w-auth-sub">{message}</p>
                    {action}
                </div>
            </AuthCard>
        </DefaultStylesProvider>
    );
}

export function SSOCallback() {
    const { deployment } = useDeployment();
    const { navigate } = useNavigation();
    const { error, session, processed, signinAttempt, redirectUri, loading } =
        useSSOCallback();
    const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
    const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(
        null,
    );

    const handleRetry = () => {
        window.location.reload();
    };

    const handleReturnToSignIn = () => {
        const signInUrl =
            deployment?.ui_settings?.sign_in_page_url || "/sign-in";
        navigate(signInUrl);
    };

    const handlePasskeyComplete = () => {
        setShowPasskeyPrompt(false);
        if (pendingRedirectUrl) {
            navigate(pendingRedirectUrl);
        }
    };

    const handlePasskeySkip = () => {
        setShowPasskeyPrompt(false);
        if (pendingRedirectUrl) {
            navigate(pendingRedirectUrl);
        }
    };

    useEffect(() => {
        if (!processed || loading || showPasskeyPrompt) return;

        if (signinAttempt && !signinAttempt.completed) {
            const signinUrl = deployment?.ui_settings?.sign_in_page_url;
            if (signinUrl) {
                const url = new URL(signinUrl, window.location.origin);
                url.searchParams.set("signin_attempt_id", signinAttempt.id);

                if (redirectUri) {
                    url.searchParams.set("redirect_uri", redirectUri);
                }

                navigate(url.toString());
            }
            return;
        }

        if (signinAttempt?.completed) {
            const safeRedirectUri = sanitizeRedirectUri(deployment, redirectUri);
            const redirectTarget =
                safeRedirectUri ||
                deployment?.ui_settings?.after_signin_redirect_url ||
                deployment?.frontend_host ||
                "/";

            let redirectUrl: URL;
            try {
                redirectUrl = new URL(redirectTarget);
            } catch {
                redirectUrl = new URL(redirectTarget, window.location.origin);
            }

            if (redirectUrl) {
                if (deployment?.mode === "staging") {
                    redirectUrl.searchParams.set(
                        "__dev_session__",
                        getStoredDevSession(deployment.backend_host) || "",
                    );
                }

                const passkeySettings = deployment?.auth_settings?.passkey;
                const shouldPrompt =
                    passkeySettings?.enabled &&
                    passkeySettings?.prompt_registration_on_auth &&
                    !session?.active_signin?.user?.has_passkeys;

                if (shouldPrompt) {
                    setPendingRedirectUrl(redirectUrl.toString());
                    setShowPasskeyPrompt(true);
                } else {
                    navigate(redirectUrl.toString());
                }
            }
        }
    }, [
        session,
        processed,
        loading,
        redirectUri,
        deployment,
        signinAttempt,
        navigate,
    ]);

    useEffect(() => {
        if (error && error.message.includes("No OAuth callback data found")) {
            setTimeout(() => {
                const loginUrl =
                    deployment?.ui_settings?.sign_in_page_url ||
                    deployment?.frontend_host;

                if (loginUrl) {
                    navigate(loginUrl);
                }
            }, 2000);
        }
    }, [error, deployment, navigate]);

    if (showPasskeyPrompt) {
        return (
            <DefaultStylesProvider>
                <AuthCard>
                    <PasskeyPrompt
                        onComplete={handlePasskeyComplete}
                        onSkip={handlePasskeySkip}
                    />
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    if (session && processed && !error) {
        return (
            <Status
                title="Success"
                sub="Authentication completed successfully"
                icon={
                    <div className="w-success">
                        <span className="ring" />
                        <span className="disc">
                            <Check weight="bold" />
                        </span>
                    </div>
                }
                message="You'll be redirected to your destination shortly."
            />
        );
    }

    if (error) {
        const isNoCallbackData = error.message.includes(
            "No OAuth callback data found",
        );

        return (
            <Status
                title="Something went wrong"
                sub="We couldn't complete your sign in"
                icon={
                    <div className="w-success w-success--error">
                        <span className="ring" />
                        <span className="disc">
                            <X weight="bold" />
                        </span>
                    </div>
                }
                message={
                    error.message ||
                    "An unexpected error occurred during authentication."
                }
                action={
                    !isNoCallbackData ? (
                        <button
                            type="button"
                            className="w-btn w-btn--primary w-btn--block"
                            onClick={handleRetry}
                        >
                            Try again
                        </button>
                    ) : undefined
                }
                footer={
                    !isNoCallbackData ? (
                        <span className="w-auth-foot">
                            Having trouble?{" "}
                            <button
                                type="button"
                                className="w-link"
                                onClick={handleReturnToSignIn}
                            >
                                Return to sign in
                            </button>
                        </span>
                    ) : undefined
                }
            />
        );
    }

    return (
        <Status
            title="Completing sign in"
            sub="Please wait while we authenticate you"
            icon={<Spin size={32} />}
            message="Verifying your credentials… this will only take a moment."
        />
    );
}

export default SSOCallback;
