import { useEffect, useState } from "react";
import React from "react";
import { Plus, SignOut, Check } from "@phosphor-icons/react";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import { DefaultStylesProvider } from "../utility/root";
import { NavigationLink } from "../utility/navigation";
import { AuthCard, AuthHead, AuthCardLoader, Spin } from "../auth/auth-card";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

interface SignedInAccountsProps {
    onAccountSelect?: (signInId: string) => void;
    showAddAccount?: boolean;
}

export const SignedInAccounts: React.FC<SignedInAccountsProps> = ({
    onAccountSelect,
    showAddAccount = true,
}) => {
    const { session, loading, switchSignIn, signOut } = useSession();
    const { deployment } = useDeployment();
    const { navigateToSignIn, navigate } = useNavigation();
    const [loadingSignOut, setLoadingSignOut] = useState<string | null>(null);
    const [switchingToAccount, setSwitchingToAccount] = useState<string | null>(
        null,
    );

    const activeSignIn = session?.active_signin;
    const signins = session?.signins || [];
    const isMultiSessionEnabled =
        deployment?.auth_settings?.multi_session_support?.enabled ?? false;
    const appName = deployment?.ui_settings?.app_name;

    useEffect(() => {
        if (loading) return;
        if (!signins.length) navigateToSignIn();
    }, [loading, signins, navigateToSignIn]);

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const handleAccountClick = async (signInId: string) => {
        setSwitchingToAccount(signInId);
        try {
            await switchSignIn(signInId);
            if (onAccountSelect) {
                onAccountSelect(signInId);
                setSwitchingToAccount(null);
            } else {
                let redirectUri = sanitizeRedirectUri(
                    deployment,
                    new URLSearchParams(window.location.search).get(
                        "redirect_uri",
                    ),
                );
                if (!redirectUri)
                    redirectUri =
                        deployment!.ui_settings?.after_signin_redirect_url;
                if (redirectUri) {
                    let uri: URL;
                    try {
                        uri = new URL(redirectUri);
                    } catch {
                        uri = new URL(redirectUri, window.location.origin);
                    }
                    if (deployment?.mode === "staging") {
                        uri.searchParams.set(
                            "__dev_session__",
                            getStoredDevSession(deployment.backend_host) ?? "",
                        );
                    }
                    navigate(uri.toString());
                } else {
                    setSwitchingToAccount(null);
                }
            }
        } catch {
            setSwitchingToAccount(null);
        }
    };

    const handleSignOut = async (e: React.MouseEvent, signInId: string) => {
        e.stopPropagation();
        setLoadingSignOut(signInId);
        try {
            await signOut(signInId);
        } catch {
        } finally {
            setLoadingSignOut(null);
        }
    };

    const handleAddAccount = () => {
        let redirectUri = sanitizeRedirectUri(
            deployment,
            new URLSearchParams(window.location.search).get("redirect_uri"),
        );
        if (!redirectUri)
            redirectUri = deployment!.ui_settings?.after_signin_redirect_url;
        navigateToSignIn(redirectUri);
    };

    if (loading) return <AuthCardLoader />;
    if (!signins.length) return null;

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-sub" style={{ fontSize: 12.5 }}>
                        Don't have an account?{" "}
                        <NavigationLink
                            to={`${deployment!.ui_settings?.sign_up_page_url}${window.location.search}`}
                            className="w-link"
                        >
                            Sign up
                        </NavigationLink>
                    </span>
                }
            >
                <AuthHead
                    title="Choose an account"
                    sub={`Select an account to continue${appName ? ` to ${appName}` : ""}`}
                />

                <div className="w-flex-col">
                    {signins.map(({ user: account, id: signInId }) => {
                        if (!account) return null;
                        const isActive = signInId === activeSignIn?.id;
                        const isSwitching = switchingToAccount === signInId;
                        const isSigningOut = loadingSignOut === signInId;
                        const fullName =
                            `${account.first_name || ""} ${account.last_name || ""}`.trim();
                        const displayName =
                            fullName ||
                            account.primary_email_address?.email ||
                            account.username ||
                            "User";
                        const displayEmail =
                            account.primary_email_address?.email ||
                            account.username;

                        return (
                            <button
                                key={signInId}
                                className="w-acct"
                                data-active={isActive ? "" : undefined}
                                data-busy={isSwitching ? "" : undefined}
                                onClick={() => handleAccountClick(signInId)}
                            >
                                <div className="w-avatar">
                                    {isSwitching ? (
                                        <Spin onAccent />
                                    ) : account.has_profile_picture ? (
                                        <img
                                            src={account.profile_picture_url}
                                            alt={fullName}
                                        />
                                    ) : (
                                        getInitials(displayName)
                                    )}
                                </div>

                                <div className="w-grow">
                                    <div className="w-sec w-truncate">
                                        {displayName}
                                    </div>
                                    {displayEmail &&
                                        displayEmail !== displayName && (
                                            <div className="w-secsub w-truncate">
                                                {displayEmail}
                                            </div>
                                        )}
                                </div>

                                {isActive && (
                                    <span className="w-pill w-pill--current">
                                        <Check size={11} weight="bold" />
                                        current
                                    </span>
                                )}
                                <span
                                    className="w-kebab w-acct-out"
                                    role="button"
                                    aria-disabled={isSigningOut}
                                    title="Sign out"
                                    onClick={(e) => handleSignOut(e, signInId)}
                                >
                                    {isSigningOut ? (
                                        <Spin />
                                    ) : (
                                        <SignOut size={15} />
                                    )}
                                </span>
                            </button>
                        );
                    })}

                </div>

                {showAddAccount && isMultiSessionEnabled && (
                    <div className="w-acct-foot">
                        <button
                            className="w-acct-add"
                            onClick={handleAddAccount}
                        >
                            <Plus size={15} />
                            Add another account
                        </button>
                    </div>
                )}
            </AuthCard>
        </DefaultStylesProvider>
    );
};
