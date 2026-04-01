import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Plus, LogOut, Loader2 } from "lucide-react";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "../auth/auth-image";
import { NavigationLink } from "../utility/navigation";
import { getStoredDevSession } from "@/utils/dev-session";

const shimmer = keyframes`
  0% {
    background-position: calc(var(--size-50u) * -10) 0;
  }
  100% {
    background-position: calc(var(--size-50u) * 10) 0;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
    width: calc(var(--size-50u) * 4);
    max-width: 100vw;
    padding: var(--space-14u) 0px;
    background: var(--color-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: var(--border-width-thin) solid var(--color-border);
`;

const AccountsWrapper = styled.div`
    margin: var(--space-8u) 0;
    border-top: var(--border-width-thin) solid var(--color-border);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    overflow: hidden;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: var(--space-10u);
`;

const Title = styled.h1`
    font-size: var(--font-size-2xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin-bottom: var(--space-2u);
    margin-top: 0;
`;

const Subtitle = styled.p`
    color: var(--color-secondary-text);
    font-size: var(--font-size-md);
`;

const AccountItem = styled.div<{ $isActive?: boolean; $isSwitching?: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-6u);
    padding: var(--space-6u);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    border-bottom: var(--border-width-thin) solid var(--color-border);

    &:last-of-type {
        border-bottom: none;
    }

    &:hover {
        background: var(--color-accent);
    }

    ${(props) =>
        props.$isActive &&
        `
    background: var(--color-secondary);
    border-bottom: none;
    cursor: default;

    &:hover {
      background: var(--color-secondary);
    }
  `}

    ${(props) =>
        props.$isSwitching &&
        `
    cursor: wait;
    background: var(--color-accent);
    pointer-events: none;
    overflow: hidden;

    &:hover {
      background: var(--color-accent);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: var(--space-1u);
      background: var(--color-primary);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

const Avatar = styled.div`
    width: var(--size-20u);
    height: var(--size-20u);
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: var(--color-secondary-text);
    flex-shrink: 0;
    border: var(--border-width-thin) solid var(--color-border);

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const AccountDetails = styled.div`
    flex: 1;
    min-width: 0;
`;

const AccountMeta = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    min-width: 0;
    margin-bottom: var(--space-1u);
`;

const AccountName = styled.div`
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: var(--color-card-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const AccountEmail = styled.div`
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ActiveBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0 var(--space-3u);
    min-height: var(--size-8u);
    border-radius: var(--radius-full);
    background: var(--color-primary-background);
    color: var(--color-primary);
    font-size: var(--font-size-2xs);
    font-weight: 500;
    letter-spacing: var(--letter-spacing-tight);
`;

const SignOutButton = styled.button<{ $isLoading?: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-2u);
    padding: var(--space-2u) var(--space-4u);
    background: transparent;
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-2xs);
    color: var(--color-secondary-text);
    font-size: var(--font-size-xs);
    cursor: ${(props) => (props.$isLoading ? "not-allowed" : "pointer")};
    transition: all 0.2s ease;
    opacity: ${(props) => (props.$isLoading ? 0.7 : 1)};

    &:hover:not(:disabled) {
        background: var(--color-accent);
        border-color: var(--color-border-hover);
    }

    svg {
        animation: ${(props) => (props.$isLoading ? spin : "none")} 1s linear
            infinite;
    }
`;

const AddAccountButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4u);
    margin-top: var(--space-8u);
    width: 100%;
    padding: var(--space-8u);
    background: transparent;
    border: none;
    border-top: var(--border-width-thin) solid var(--color-border);
    color: var(--color-primary);
    font-size: var(--font-size-md);
    font-weight: 400;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background: var(--color-accent);
    }

    svg {
        width: var(--size-8u);
        height: var(--size-8u);
    }
`;

const SkeletonItem = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-6u);
    padding: var(--space-6u);
    border-bottom: var(--border-width-thin) solid var(--color-border);

    &:last-child {
        border-bottom: none;
    }
`;

const SkeletonAvatar = styled.div`
    width: var(--size-20u);
    height: var(--size-20u);
    border-radius: 50%;
    background: linear-gradient(
        90deg,
        var(--color-accent) 0%,
        var(--color-secondary) 50%,
        var(--color-accent) 100%
    );
    background-size: calc(var(--size-50u) * 10) 100%;
    animation: ${shimmer} 2s infinite linear;
`;

const SkeletonTextWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2u);
`;

const SkeletonText = styled.div<{ $width?: string }>`
    height: ${(props) =>
        props.$width === "small" ? "var(--space-6u)" : "var(--space-7u)"};
    width: ${(props) => (props.$width === "small" ? "60%" : "40%")};
    border-radius: var(--radius-2xs);
    background: linear-gradient(
        90deg,
        var(--color-accent) 0%,
        var(--color-secondary) 50%,
        var(--color-accent) 100%
    );
    background-size: calc(var(--size-50u) * 10) 100%;
    animation: ${shimmer} 2s infinite linear;
`;

const Footer = styled.p`
    margin-top: var(--space-8u);
    text-align: center;
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
`;

const Link = styled.span`
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 400;
    transition: color 0.2s;
    cursor: pointer;

    &:hover {
        color: var(--color-primary-hover);
    }
`;

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

    useEffect(() => {
        if (loading) return;

        if (!signins.length) {
            navigateToSignIn();
        }
    }, [loading, signins, navigateToSignIn]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleAccountClick = async (signInId: string) => {
        setSwitchingToAccount(signInId);
        try {
            await switchSignIn(signInId);
            if (onAccountSelect) {
                onAccountSelect(signInId);
                setSwitchingToAccount(null);
            } else {
                let redirectUri = new URLSearchParams(
                    window.location.search,
                ).get("redirect_uri");

                if (!redirectUri) {
                    redirectUri =
                        deployment!.ui_settings?.after_signin_redirect_url;
                }

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
        let redirectUri = new URLSearchParams(window.location.search).get(
            "redirect_uri",
        );

        if (!redirectUri) {
            redirectUri = deployment!.ui_settings?.after_signin_redirect_url;
        }

        navigateToSignIn(redirectUri);
    };

    if (loading) {
        return (
            <DefaultStylesProvider>
                <Container>
                    <AuthFormImage />
                    <Header>
                        <Title>Choose an account</Title>
                        <Subtitle>
                            to continue to{" "}
                            {deployment?.ui_settings?.app_name || "App"}
                        </Subtitle>
                    </Header>

                    <AccountsWrapper>
                        {/* Show 2-3 skeleton items */}
                        {[1, 2].map((item) => (
                            <SkeletonItem key={item}>
                                <SkeletonAvatar />
                                <SkeletonTextWrapper>
                                    <SkeletonText />
                                    <SkeletonText $width="small" />
                                </SkeletonTextWrapper>
                            </SkeletonItem>
                        ))}
                    </AccountsWrapper>
                </Container>
            </DefaultStylesProvider>
        );
    }

    if (!signins.length) {
        return null;
    }

    return (
        <DefaultStylesProvider>
            <Container>
                <AuthFormImage />
                <Header>
                    <Title>Choose an account</Title>
                    <Subtitle>
                        to continue to {deployment?.ui_settings?.app_name}
                    </Subtitle>
                </Header>

                <AccountsWrapper>
                    {signins.map(({ user: account, id: signInId }) => {
                        if (!account) return null;
                        const isActive = signInId === activeSignIn?.id;
                        const isSwitching = switchingToAccount === signInId;
                        const fullName =
                            `${account.first_name || ""} ${account.last_name || ""}`.trim();

                        return (
                            <AccountItem
                                key={signInId}
                                $isActive={isActive}
                                $isSwitching={isSwitching}
                                onClick={() => handleAccountClick(signInId)}
                            >
                                <Avatar>
                                    {account.has_profile_picture ? (
                                        <img
                                            src={account.profile_picture_url}
                                            alt={fullName}
                                        />
                                    ) : (
                                        getInitials(
                                            fullName ||
                                                account.primary_email_address
                                                    ?.email ||
                                                account.primary_phone_number
                                                    ?.phone_number ||
                                                account.username ||
                                                "U",
                                        )
                                    )}
                                </Avatar>

                                <AccountDetails>
                                    <AccountMeta>
                                        <AccountName>
                                            {fullName ||
                                                account.primary_email_address
                                                    ?.email ||
                                                account.primary_phone_number
                                                    ?.phone_number ||
                                                account.username ||
                                                "User"}
                                        </AccountName>
                                        {isActive && (
                                            <ActiveBadge>Active</ActiveBadge>
                                        )}
                                    </AccountMeta>
                                    <AccountEmail>
                                        {account.primary_email_address?.email ||
                                            account.username}
                                    </AccountEmail>
                                </AccountDetails>

                                {!isSwitching && (
                                    <SignOutButton
                                        onClick={(e) =>
                                            handleSignOut(e, signInId)
                                        }
                                        $isLoading={loadingSignOut === signInId}
                                        disabled={loadingSignOut === signInId}
                                    >
                                        {loadingSignOut === signInId ? (
                                            <Loader2 size={12} />
                                        ) : (
                                            <LogOut size={12} />
                                        )}
                                        {loadingSignOut === signInId
                                            ? "Signing out..."
                                            : "Sign out"}
                                    </SignOutButton>
                                )}
                            </AccountItem>
                        );
                    })}

                    {showAddAccount && isMultiSessionEnabled && (
                        <AddAccountButton onClick={handleAddAccount}>
                            <Plus />
                            Add another account
                        </AddAccountButton>
                    )}
                </AccountsWrapper>

                <Footer>
                    Don't have an account?{" "}
                    <Link>
                        <NavigationLink
                            to={`${deployment!.ui_settings?.sign_up_page_url}${window.location.search}`}
                        >
                            Sign up
                        </NavigationLink>
                    </Link>
                </Footer>
            </Container>
        </DefaultStylesProvider>
    );
};
