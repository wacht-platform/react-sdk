import { X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useDeployment } from "@/hooks/use-deployment";
import { GoogleIcon } from "../../icons/google";
import { MicrosoftIcon } from "../../icons/microsoft";
import { GithubIcon } from "../../icons/github";
import { XIcon } from "../../icons/x";
import { GitLabIcon } from "../../icons/gitlab";
import { LinkedInIcon } from "../../icons/linkedin";
import { DiscordIcon } from "../../icons/discord";
import { Button } from "@/components/utility";
import {
    ConnectionItemRow,
    ConnectionLeft,
    ConnectionRight,
    IconWrapper,
    IconButton,
} from "./shared";
import styled from "styled-components";

const ProviderInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-3u);
    min-width: 0;
`;

const ProviderName = styled.div`
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--color-foreground);
`;

const ConnectedAccountsRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3u);
`;

const ConnectedAccountChip = styled.div`
    display: inline-flex;
    align-items: center;
    gap: var(--space-2u);
    background: var(--color-secondary);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    padding: var(--space-2u) var(--space-4u);
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
    min-width: 0;
`;

const ChipText = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(var(--size-50u) + var(--size-24u));
`;

export const SocialManagementSection = () => {
    const { user, disconnectSocialConnection, connectSocialAccount } = useUser();
    const { deployment } = useDeployment();

    const socialAuthProviders = {
        google_oauth: {
            icon: <GoogleIcon />,
            label: "Google",
        },
        microsoft_oauth: {
            icon: <MicrosoftIcon />,
            label: "Microsoft",
        },
        github_oauth: {
            icon: <GithubIcon />,
            label: "GitHub",
        },
        gitlab_oauth: {
            icon: <GitLabIcon />,
            label: "GitLab",
        },
        linkedin_oauth: {
            icon: <LinkedInIcon />,
            label: "LinkedIn",
        },
        discord_oauth: {
            icon: <DiscordIcon />,
            label: "Discord",
        },
        x_oauth: {
            icon: <XIcon />,
            label: "X",
        },
    };

    const enabledProviders =
        deployment?.social_connections.filter((conn) => conn.enabled) || [];

    return (
        <>
            <div style={{ marginBottom: "var(--space-12u)" }}>
                <h3
                    style={{
                        fontSize: "var(--font-size-xl)",
                        margin: "0 0 var(--space-3u) 0",
                        letterSpacing: "-0.01em",
                        color: "var(--color-foreground)",
                    }}
                >
                    Connected Accounts
                </h3>
                <p
                    style={{
                        fontSize: "var(--font-size-md)",
                        margin: 0,
                        lineHeight: "1.5",
                        color: "var(--color-muted)",
                    }}
                >
                    Connect social accounts for easy sign-in and profile sync
                </p>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {enabledProviders.map((provider, index) => {
                    const connectedAccounts =
                        user?.social_connections?.filter(
                            (conn) => conn.provider === provider.provider,
                        ) || [];
                    const providerInfo =
                        socialAuthProviders[
                        provider.provider as keyof typeof socialAuthProviders
                        ];

                    if (!providerInfo) return null;

                    return (
                        <div key={provider.provider}>

                            <ConnectionItemRow>
                                <ConnectionLeft>
                                    <IconWrapper>{providerInfo.icon}</IconWrapper>
                                    <ProviderInfo>
                                        <ProviderName>{providerInfo.label}</ProviderName>
                                        {connectedAccounts.length > 0 && (
                                            <ConnectedAccountsRow>
                                                {connectedAccounts.map((account) => (
                                                    <ConnectedAccountChip key={account.id}>
                                                        <ChipText>{account.email_address}</ChipText>
                                                        <IconButton
                                                            onClick={async () => {
                                                                await disconnectSocialConnection(
                                                                    account.id.toString(),
                                                                );
                                                                user.refetch();
                                                            }}
                                                            style={{ padding: "var(--space-1u)" }}
                                                        >
                                                            <X size={14} />
                                                        </IconButton>
                                                    </ConnectedAccountChip>
                                                ))}
                                            </ConnectedAccountsRow>
                                        )}
                                    </ProviderInfo>
                                </ConnectionLeft>

                                <ConnectionRight>
                                    {connectedAccounts.length > 0 ? (
                                        <Button
                                            $size="sm"
                                            onClick={() => {
                                                connectSocialAccount({
                                                    provider: provider.provider,
                                                    redirectUri: window.location.href,
                                                });
                                            }}
                                        >
                                            Add
                                        </Button>
                                    ) : (
                                        <Button
                                            $size="sm"
                                            onClick={() => {
                                                connectSocialAccount({
                                                    provider: provider.provider,
                                                    redirectUri: window.location.href,
                                                });
                                            }}
                                        >
                                            Connect
                                        </Button>
                                    )}
                                </ConnectionRight>
                            </ConnectionItemRow>

                            {index < enabledProviders.length - 1 && (
                                <div
                                    style={{
                                        height: "var(--border-width-thin)",
                                        background: "var(--color-border)",
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
