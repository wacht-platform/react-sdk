import { useEffect, useState } from "react";
import React from "react";
import styled, { keyframes } from "styled-components";
import { Plus, SignOut, CircleNotch, CheckCircle, UserCircle } from "@phosphor-icons/react";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import { DefaultStylesProvider } from "../utility/root";
import { NavigationLink } from "../utility/navigation";
import { getStoredDevSession } from "@/utils/dev-session";

const shimmer = keyframes`
  0%   { background-position: calc(var(--size-50u) * -10) 0; }
  100% { background-position: calc(var(--size-50u) * 10) 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Spinner = styled(CircleNotch)`
    animation: ${spin} 1s linear infinite;
    flex-shrink: 0;
`;

/* ── Shell ───────────────────────────────────────────── */

const Wrapper = styled.div`
    display: flex;
    width: calc(var(--size-50u) * 6);
    max-width: 100vw;
    background: var(--color-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: var(--border-width-thin) solid var(--color-border);
    overflow: hidden;

    @media (max-width: 520px) {
        width: 100%;
        flex-direction: column;
        border-radius: var(--radius-lg);
    }
`;

/* ── Left panel ──────────────────────────────────────── */

const LeftPanel = styled.div`
    width: 200px;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--color-primary) 4%, var(--color-card));
    border-right: var(--border-width-thin) solid var(--color-border);
    padding: var(--space-10u) var(--space-8u);
    display: flex;
    flex-direction: column;
    min-height: 340px;

    @media (max-width: 520px) {
        width: 100%;
        min-height: unset;
        border-right: none;
        border-bottom: var(--border-width-thin) solid var(--color-border);
        padding: var(--space-8u) var(--space-8u) var(--space-6u);
        flex-direction: row;
        align-items: center;
        gap: var(--space-5u);
    }
`;

const LeftTop = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-4u);

    @media (max-width: 520px) {
        flex-direction: row;
        align-items: center;
        gap: var(--space-4u);
        flex: 1;
    }
`;

const AppLogo = styled.img`
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    object-fit: contain;
    flex-shrink: 0;
`;

const AppIconFallback = styled.div`
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: var(--color-primary-background);
    border: var(--border-width-thin) solid color-mix(in srgb, var(--color-primary) 15%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
`;

const AppMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-1u);
`;

const AppName = styled.div`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    line-height: 1.2;
`;

const AppTagline = styled.div`
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
    line-height: 1.5;
`;

const LeftSpacer = styled.div`
    flex: 1;

    @media (max-width: 520px) {
        display: none;
    }
`;


/* ── Right panel ─────────────────────────────────────── */

const RightPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
`;

const RightHeader = styled.div`
    padding: var(--space-8u) var(--space-8u) var(--space-5u);
    border-bottom: var(--border-width-thin) solid var(--color-border);
`;

const RightTitle = styled.div`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin-bottom: var(--space-1u);
`;

const RightSubtitle = styled.div`
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
`;

/* ── Account rows ────────────────────────────────────── */

const AccountsList = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const AccountRow = styled.div<{ $isActive?: boolean; $isSwitching?: boolean; $clickable?: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-5u);
    padding: var(--space-5u) var(--space-8u);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    transition: background 0.15s;
    cursor: ${p => p.$clickable ? "pointer" : "default"};

    &:last-child { border-bottom: none; }

    ${p => p.$clickable && `&:hover { background: var(--color-accent); }`}
    ${p => p.$isActive && `background: color-mix(in srgb, var(--color-primary) 4%, transparent);`}
    ${p => p.$isSwitching && `opacity: 0.55; pointer-events: none;`}
`;

const RowAvatar = styled.div<{ $isActive?: boolean }>`
    width: var(--size-20u);
    height: var(--size-20u);
    border-radius: 50%;
    flex-shrink: 0;
    background: ${p => p.$isActive ? "var(--color-primary-background)" : "var(--color-accent)"};
    border: var(--border-width-thin) solid ${p => p.$isActive
        ? "color-mix(in srgb, var(--color-primary) 20%, transparent)"
        : "var(--color-border)"};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: ${p => p.$isActive ? "var(--color-primary)" : "var(--color-secondary-text)"};
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
`;

const RowInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const RowName = styled.div`
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: var(--color-card-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RowEmail = styled.div`
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RowAction = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--radius-2xs);
    border: none;
    background: transparent;
    color: var(--color-secondary-text);
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: var(--color-border);
        color: var(--color-card-foreground);
    }
`;

/* ── Add account ─────────────────────────────────────── */

const AddRow = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-5u);
    padding: var(--space-5u) var(--space-8u);
    width: 100%;
    background: transparent;
    border: none;
    border-top: var(--border-width-thin) solid var(--color-border);
    color: var(--color-secondary-text);
    font-size: var(--font-size-md);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: left;

    &:hover {
        background: var(--color-accent);
        color: var(--color-card-foreground);
    }
`;

const AddIcon = styled.div`
    width: var(--size-20u);
    height: var(--size-20u);
    border-radius: 50%;
    border: var(--border-width-thin) dashed var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.15s;

    ${AddRow}:hover & { border-color: var(--color-secondary-text); }
`;

/* ── Footer ──────────────────────────────────────────── */

const RightFooter = styled.div`
    margin: 0 var(--space-8u);
    padding: var(--space-6u) 0 var(--space-8u);
    border-top: var(--border-width-thin) solid var(--color-border);
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
    text-align: center;
`;

const FooterLink = styled.span`
    color: var(--color-primary);
    cursor: pointer;
    transition: color 0.15s;
    &:hover { color: var(--color-primary-hover); }
`;

/* ── Skeleton ────────────────────────────────────────── */

const SkeletonRow = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-5u);
    padding: var(--space-5u) var(--space-8u);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    &:last-child { border-bottom: none; }
`;

const SkeletonCircle = styled.div`
    width: var(--size-20u);
    height: var(--size-20u);
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-accent) 100%);
    background-size: calc(var(--size-50u) * 10) 100%;
    animation: ${shimmer} 2s infinite linear;
`;

const SkeletonLines = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2u);
`;

const SkeletonLine = styled.div<{ $width?: string }>`
    height: var(--space-6u);
    width: ${p => p.$width ?? "50%"};
    border-radius: var(--radius-2xs);
    background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-accent) 100%);
    background-size: calc(var(--size-50u) * 10) 100%;
    animation: ${shimmer} 2s infinite linear;
`;

/* ── Component ───────────────────────────────────────── */

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
    const [switchingToAccount, setSwitchingToAccount] = useState<string | null>(null);

    const activeSignIn = session?.active_signin;
    const signins = session?.signins || [];
    const isMultiSessionEnabled =
        deployment?.auth_settings?.multi_session_support?.enabled ?? false;
    const logoUrl = deployment?.ui_settings?.logo_image_url;
    const appName = deployment?.ui_settings?.app_name;

    useEffect(() => {
        if (loading) return;
        if (!signins.length) navigateToSignIn();
    }, [loading, signins, navigateToSignIn]);

    const getInitials = (name: string) =>
        name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

    const handleAccountClick = async (signInId: string) => {
        setSwitchingToAccount(signInId);
        try {
            await switchSignIn(signInId);
            if (onAccountSelect) {
                onAccountSelect(signInId);
                setSwitchingToAccount(null);
            } else {
                let redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");
                if (!redirectUri) redirectUri = deployment!.ui_settings?.after_signin_redirect_url;
                if (redirectUri) {
                    let uri: URL;
                    try { uri = new URL(redirectUri); }
                    catch { uri = new URL(redirectUri, window.location.origin); }
                    if (deployment?.mode === "staging") {
                        uri.searchParams.set("__dev_session__", getStoredDevSession(deployment.backend_host) ?? "");
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
        try { await signOut(signInId); }
        catch {}
        finally { setLoadingSignOut(null); }
    };

    const handleAddAccount = () => {
        let redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");
        if (!redirectUri) redirectUri = deployment!.ui_settings?.after_signin_redirect_url;
        navigateToSignIn(redirectUri);
    };

    const renderLeftPanel = () => (
        <LeftPanel>
            <LeftTop>
                {logoUrl
                    ? <AppLogo src={logoUrl} alt={appName || "App"} />
                    : <AppIconFallback><UserCircle size={20} /></AppIconFallback>
                }
                <AppMeta>
                    <AppName>{appName || "Your App"}</AppName>
                    <AppTagline>Select or switch between your accounts</AppTagline>
                </AppMeta>
            </LeftTop>

            <LeftSpacer />
        </LeftPanel>
    );

    if (loading) {
        return (
            <DefaultStylesProvider>
                <Wrapper>
                    {renderLeftPanel()}
                    <RightPanel>
                        <RightHeader>
                            <SkeletonLine $width="55%" />
                        </RightHeader>
                        <AccountsList>
                            {[1, 2, 3].map(i => (
                                <SkeletonRow key={i}>
                                    <SkeletonCircle />
                                    <SkeletonLines>
                                        <SkeletonLine $width="45%" />
                                        <SkeletonLine $width="65%" />
                                    </SkeletonLines>
                                </SkeletonRow>
                            ))}
                        </AccountsList>
                    </RightPanel>
                </Wrapper>
            </DefaultStylesProvider>
        );
    }

    if (!signins.length) return null;

    return (
        <DefaultStylesProvider>
            <Wrapper>
                {renderLeftPanel()}

                <RightPanel>
                    <RightHeader>
                        <RightTitle>Your accounts</RightTitle>
                        <RightSubtitle>Select one to continue</RightSubtitle>
                    </RightHeader>

                    <AccountsList>
                        {signins.map(({ user: account, id: signInId }) => {
                            if (!account) return null;
                            const isActive = signInId === activeSignIn?.id;
                            const isSwitching = switchingToAccount === signInId;
                            const isSigningOut = loadingSignOut === signInId;
                            const fullName = `${account.first_name || ""} ${account.last_name || ""}`.trim();
                            const displayName = fullName || account.primary_email_address?.email || account.username || "User";
                            const displayEmail = account.primary_email_address?.email || account.username;

                            return (
                                <AccountRow
                                    key={signInId}
                                    $isActive={isActive}
                                    $isSwitching={isSwitching}
                                    $clickable={!isActive}
                                    onClick={() => !isActive && handleAccountClick(signInId)}
                                >
                                    <RowAvatar $isActive={isActive}>
                                        {isSwitching ? (
                                            <Spinner size={14} />
                                        ) : account.has_profile_picture ? (
                                            <img src={account.profile_picture_url} alt={fullName} />
                                        ) : (
                                            getInitials(displayName)
                                        )}
                                    </RowAvatar>

                                    <RowInfo>
                                        <RowName>{displayName}</RowName>
                                        {displayEmail && displayEmail !== displayName && (
                                            <RowEmail>{displayEmail}</RowEmail>
                                        )}
                                    </RowInfo>

                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3u)", flexShrink: 0 }}>
                                        {isActive && (
                                            <CheckCircle
                                                size={16}
                                                weight="fill"
                                                style={{ color: "var(--color-primary)" }}
                                            />
                                        )}
                                        <RowAction
                                            onClick={e => handleSignOut(e, signInId)}
                                            disabled={isSigningOut}
                                            title="Sign out"
                                        >
                                            {isSigningOut ? <Spinner size={13} /> : <SignOut size={13} />}
                                        </RowAction>
                                    </div>
                                </AccountRow>
                            );
                        })}

                        {showAddAccount && isMultiSessionEnabled && (
                            <AddRow onClick={handleAddAccount}>
                                <AddIcon><Plus size={13} /></AddIcon>
                                Add account
                            </AddRow>
                        )}
                    </AccountsList>

                    <RightFooter>
                        Don't have an account?{" "}
                        <FooterLink>
                            <NavigationLink
                                to={`${deployment!.ui_settings?.sign_up_page_url}${window.location.search}`}
                            >
                                Sign up
                            </NavigationLink>
                        </FooterLink>
                    </RightFooter>
                </RightPanel>
            </Wrapper>
        </DefaultStylesProvider>
    );
};
