import { useEffect, useRef, type ReactNode } from "react";
import { Check, X, Info, Clock } from "@phosphor-icons/react";
import { useInvitation } from "@/hooks/use-invitation";
import { useNavigation } from "@/hooks/use-navigation";
import { useDeployment } from "@/hooks/use-deployment";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, Spin } from "./auth-card";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

function StatusIcon({
    kind,
}: {
    kind: "success" | "error" | "info";
}) {
    const cls =
        kind === "success"
            ? "w-success"
            : kind === "error"
              ? "w-success w-success--error"
              : "w-success w-success--info";
    const Glyph = kind === "success" ? Check : kind === "error" ? X : Info;
    return (
        <div className={cls}>
            <span className="ring" />
            <span className="disc">
                <Glyph weight="bold" />
            </span>
        </div>
    );
}

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
    message: ReactNode;
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

interface AcceptInviteProps {
    token?: string;
    onSuccess?: (organizationId?: string, workspaceId?: string) => void;
    onError?: (error: string) => void;
}

export function AcceptInvite({
    token: propToken,
    onSuccess,
    onError,
}: AcceptInviteProps) {
    const { acceptInvitation, invitationData, loading, error } =
        useInvitation();
    const { navigate } = useNavigation();
    const { deployment } = useDeployment();
    const hasAttempted = useRef(false);

    const getUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            token:
                propToken ||
                params.get("invite_token") ||
                params.get("token"),
            redirectUri:
                sanitizeRedirectUri(deployment, params.get("redirect_uri")) ||
                deployment?.ui_settings?.after_signin_redirect_url ||
                "/",
        };
    };

    useEffect(() => {
        if (hasAttempted.current) return;

        const { token } = getUrlParams();
        if (!token) return;

        hasAttempted.current = true;
        acceptInvitation(token);
    }, [acceptInvitation]);

    useEffect(() => {
        if (!invitationData) return;

        if (
            invitationData.organization &&
            !invitationData.requires_signin &&
            onSuccess
        ) {
            onSuccess(
                invitationData.organization.id,
                invitationData.workspace?.id,
            );
        }

        if (invitationData.error_code && onError) {
            onError(invitationData.message || "Failed to accept invitation");
        }
    }, [invitationData, onSuccess, onError]);

    const handleContinue = () => {
        const { redirectUri } = getUrlParams();
        navigate(redirectUri);
    };

    const handleGoToAuth = () => {
        const { token } = getUrlParams();
        const signInUrl =
            deployment?.ui_settings?.sign_in_page_url || "/sign-in";
        const signUpUrl =
            deployment?.ui_settings?.sign_up_page_url || "/sign-up";
        const params = new URLSearchParams();

        if (token) params.set("invite_token", token);
        if (invitationData?.invited_email)
            params.set("invited_email", invitationData.invited_email);

        const invitePageUrl = window.location.pathname;
        const inviteRedirectUri = `${invitePageUrl}?token=${token}`;
        params.set("redirect_uri", inviteRedirectUri);

        if (invitationData?.message) {
            params.set("message", invitationData.message);
        }

        const isSignup =
            invitationData?.error_code === "INVITATION_REQUIRES_SIGNUP";
        navigate(`${isSignup ? signUpUrl : signInUrl}?${params.toString()}`);
    };

    const handleRetry = () => {
        const { token } = getUrlParams();
        if (token) {
            hasAttempted.current = false;
            acceptInvitation(token);
        }
    };

    const primaryBtn = (label: string, onClick: () => void) => (
        <button
            type="button"
            className="w-btn w-btn--primary w-btn--block"
            onClick={onClick}
        >
            {label}
        </button>
    );

    const { token } = getUrlParams();

    if (!token && !loading) {
        return (
            <Status
                title="Invalid invitation"
                sub="No invitation token found"
                icon={<StatusIcon kind="error" />}
                message="The invitation link appears to be invalid or incomplete."
                action={primaryBtn("Go to home", () => navigate("/"))}
            />
        );
    }

    if (loading) {
        return (
            <Status
                title="Processing invitation"
                sub="Please wait while we verify your invitation"
                icon={<Spin size={32} />}
                message="Verifying invitation… this will only take a moment."
            />
        );
    }

    if (invitationData?.organization && !invitationData.requires_signin) {
        return (
            <Status
                title="Invitation accepted"
                sub="You've successfully joined the organization"
                icon={<StatusIcon kind="success" />}
                message={
                    <>
                        Welcome to{" "}
                        <strong>{invitationData.organization.name}</strong>
                        {invitationData.workspace
                            ? `. You've been added to the ${invitationData.workspace.name} workspace.`
                            : "."}
                    </>
                }
                action={primaryBtn("Continue to application", handleContinue)}
            />
        );
    }

    if (invitationData?.already_member) {
        return (
            <Status
                title="Already a member"
                sub="You're already part of this organization"
                icon={<StatusIcon kind="info" />}
                message={`You're already a member of ${invitationData.organization?.name || "this organization"}. No action needed.`}
                action={primaryBtn("Continue to application", handleContinue)}
            />
        );
    }

    if (invitationData?.requires_signin) {
        const isSignup =
            invitationData.error_code === "INVITATION_REQUIRES_SIGNUP";

        return (
            <Status
                title={isSignup ? "Sign up required" : "Sign in required"}
                sub="To accept this invitation"
                icon={<StatusIcon kind="info" />}
                message={
                    <>
                        This invitation is for{" "}
                        <strong className="w-text-primary">
                            {invitationData.invited_email}
                        </strong>
                        .{" "}
                        {isSignup
                            ? "Create an account with this email address to accept it."
                            : invitationData.error_code ===
                                "INVITATION_EMAIL_MISMATCH"
                              ? "You're signed in with a different account. Please sign in with the invited email."
                              : "Please sign in to accept this invitation."}
                    </>
                }
                action={primaryBtn(
                    isSignup ? "Sign up to accept" : "Sign in to accept",
                    handleGoToAuth,
                )}
            />
        );
    }

    if (invitationData?.error_code === "INVITATION_EXPIRED") {
        return (
            <Status
                title="Invitation expired"
                sub="This invitation is no longer valid"
                icon={
                    <div className="w-success w-success--error">
                        <span className="ring" />
                        <span className="disc">
                            <Clock weight="bold" />
                        </span>
                    </div>
                }
                message={
                    <>
                        Invitation for{" "}
                        <strong className="w-text-primary">
                            {invitationData.invited_email}
                        </strong>{" "}
                        has expired. Invitations are valid for 10 days — please
                        request a new one from your organization administrator.
                    </>
                }
            />
        );
    }

    if (error || invitationData?.error_code) {
        return (
            <Status
                title="Invitation error"
                sub="Unable to process invitation"
                icon={<StatusIcon kind="error" />}
                message={
                    invitationData?.message ||
                    error ||
                    "Failed to accept invitation"
                }
                action={primaryBtn("Try again", handleRetry)}
                footer={
                    <span className="w-auth-foot">
                        Having trouble?{" "}
                        <button
                            type="button"
                            className="w-link"
                            onClick={handleGoToAuth}
                        >
                            Sign in manually
                        </button>
                    </span>
                }
            />
        );
    }

    return null;
}
