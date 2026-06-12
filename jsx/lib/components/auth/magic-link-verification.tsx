import { useEffect, useState, useRef } from "react";
import { Check, X } from "@phosphor-icons/react";
import {
    useMagicLinkVerification,
    useMagicLinkParams,
} from "../../hooks/use-magic-link";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, Spin } from "./auth-card";
import { useNavigation } from "../../hooks/use-navigation";
import { useDeployment } from "../../hooks/use-deployment";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

interface MagicLinkVerificationProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function MagicLinkVerification({
    onSuccess,
    onError,
}: MagicLinkVerificationProps = {}) {
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading",
    );
    const [subMessage, setSubMessage] = useState("");
    const { token, attempt, redirectUri } = useMagicLinkParams();
    const { verifyMagicLink } = useMagicLinkVerification();
    const { navigate } = useNavigation();
    const { deployment } = useDeployment();
    const hasVerified = useRef(false);

    useEffect(() => {
        const performVerification = async () => {
            if (hasVerified.current) return;

            if (!token || !attempt) {
                setStatus("error");
                setSubMessage(
                    "The magic link appears to be malformed. Please try signing in again.",
                );
                onError?.("Invalid magic link parameters");
                return;
            }

            hasVerified.current = true;
            setStatus("loading");
            setSubMessage("Please wait while we verify your magic link.");

            try {
                await verifyMagicLink({ token, attempt, redirectUri });
                setStatus("success");
                setSubMessage(
                    "You will be redirected to your account shortly.",
                );
                onSuccess?.();

                setTimeout(() => {
                    let finalRedirectUri: string | null | undefined =
                        sanitizeRedirectUri(deployment, redirectUri);

                    if (!finalRedirectUri) {
                        finalRedirectUri =
                            deployment?.ui_settings?.after_signin_redirect_url;
                    }

                    if (!finalRedirectUri && deployment?.frontend_host) {
                        finalRedirectUri = `https://${deployment.frontend_host}`;
                    }

                    if (finalRedirectUri) {
                        const uri = new URL(finalRedirectUri);

                        if (deployment?.mode === "staging") {
                            uri.searchParams.set(
                                "__dev_session__",
                                getStoredDevSession(deployment.backend_host) ||
                                    "",
                            );
                        }

                        navigate(uri.toString());
                    }
                }, 2000);
            } catch (error: any) {
                setStatus("error");
                setSubMessage(
                    "The magic link may have expired or already been used. Please try signing in again.",
                );
                onError?.(error.message);
            }
        };

        performVerification();
    }, [token, attempt]);

    const handleRetry = () => {
        if (deployment?.ui_settings?.sign_in_page_url) {
            navigate(deployment.ui_settings.sign_in_page_url);
        }
    };

    return (
        <DefaultStylesProvider>
            <AuthCard>
                <AuthHead
                    title="Magic link"
                    sub="Verifying your magic link"
                />

                <div className="w-auth-status">
                    {status === "loading" && <Spin size={32} />}

                    {status === "success" && (
                        <div className="w-success">
                            <span className="ring" />
                            <span className="disc">
                                <Check weight="bold" />
                            </span>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="w-success w-success--error">
                            <span className="ring" />
                            <span className="disc">
                                <X weight="bold" />
                            </span>
                        </div>
                    )}

                    <p className="w-auth-sub">{subMessage}</p>

                    {status === "error" && (
                        <button
                            type="button"
                            className="w-btn w-btn--primary w-btn--block"
                            onClick={handleRetry}
                        >
                            Try again
                        </button>
                    )}
                </div>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
