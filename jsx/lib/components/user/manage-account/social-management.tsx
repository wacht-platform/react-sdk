import { X } from "@phosphor-icons/react";
import styled from "styled-components";
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
import { EmptyState } from "@/components/utility/empty-state";

const providerMeta: Record<string, { icon: React.ReactNode; label: string }> = {
    google_oauth: { icon: <GoogleIcon />, label: "Google" },
    microsoft_oauth: { icon: <MicrosoftIcon />, label: "Microsoft" },
    github_oauth: { icon: <GithubIcon />, label: "GitHub" },
    gitlab_oauth: { icon: <GitLabIcon />, label: "GitLab" },
    linkedin_oauth: { icon: <LinkedInIcon />, label: "LinkedIn" },
    discord_oauth: { icon: <DiscordIcon />, label: "Discord" },
    x_oauth: { icon: <XIcon />, label: "X" },
};

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    margin-bottom: var(--space-6u);
`;

const HeaderText = styled.div`
    flex: 1;
    min-width: 0;
`;

const HeaderTitle = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: var(--color-card-foreground);
`;

const HeaderSubtitle = styled.div`
    font-size: 12px;
    color: var(--color-secondary-text);
    margin-top: 2px;
`;

const ProviderList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const ProviderRow = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-6u);
    padding: var(--space-5u) 0;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
        border-bottom: none;
    }

    @media (max-width: 600px) {
        grid-template-columns: auto 1fr;
        row-gap: var(--space-4u);
    }
`;

const ProviderIcon = styled.div`
    width: 28px;
    height: 28px;
    min-width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: 20px;
        height: 20px;
    }
`;

const ProviderMain = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const ProviderName = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-card-foreground);
`;

const AccountChips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
`;

const AccountChip = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px 2px 8px;
    font-size: 11px;
    color: var(--color-secondary-text);
    background: color-mix(in srgb, var(--color-popover-foreground) 6%, transparent);
    border-radius: 999px;
    max-width: 100%;
`;

const ChipEmail = styled.span`
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ChipRemove = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-secondary-text);
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.12s ease;

    &:hover {
        color: var(--color-error);
        background: color-mix(in srgb, var(--color-error) 14%, transparent);
    }
`;

const NotLinked = styled.span`
    font-size: 11px;
    color: var(--color-muted);
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;

    @media (max-width: 600px) {
        grid-column: 1 / -1;
        justify-content: flex-start;
        padding-left: calc(28px + var(--space-6u));
    }
`;

export const SocialManagementSection = () => {
    const { user, disconnectSocialConnection, connectSocialAccount } = useUser();
    const { deployment } = useDeployment();

    const enabledProviders =
        deployment?.social_connections.filter((c) => c.enabled) || [];

    const handleConnect = (provider: string) => {
        connectSocialAccount({ provider, redirectUri: window.location.href });
    };

    const handleDisconnect = async (id: string | number) => {
        await disconnectSocialConnection(id.toString());
        user.refetch();
    };

    if (enabledProviders.length === 0) {
        return (
            <EmptyState
                title="No providers available"
                description="Social sign-in providers have not been configured for this app."
            />
        );
    }

    return (
        <>
            <Header>
                <HeaderText>
                    <HeaderTitle>Connected accounts</HeaderTitle>
                    <HeaderSubtitle>
                        Sign in faster by linking third-party accounts.
                    </HeaderSubtitle>
                </HeaderText>
            </Header>

            <ProviderList>
                {enabledProviders.map((provider) => {
                    const meta =
                        providerMeta[provider.provider as keyof typeof providerMeta];
                    if (!meta) return null;

                    const accounts =
                        user?.social_connections?.filter(
                            (c) => c.provider === provider.provider,
                        ) || [];
                    const linked = accounts.length > 0;

                    return (
                        <ProviderRow key={provider.provider}>
                            <ProviderIcon>{meta.icon}</ProviderIcon>
                            <ProviderMain>
                                <ProviderName>{meta.label}</ProviderName>
                                {linked ? (
                                    <AccountChips>
                                        {accounts.map((account) => (
                                            <AccountChip key={account.id}>
                                                <ChipEmail>
                                                    {account.email_address}
                                                </ChipEmail>
                                                <ChipRemove
                                                    onClick={() =>
                                                        handleDisconnect(account.id)
                                                    }
                                                    title="Remove connection"
                                                    aria-label="Remove connection"
                                                >
                                                    <X size={10} weight="bold" />
                                                </ChipRemove>
                                            </AccountChip>
                                        ))}
                                    </AccountChips>
                                ) : (
                                    <NotLinked>Not linked</NotLinked>
                                )}
                            </ProviderMain>
                            <Actions>
                                <Button
                                    $size="sm"
                                    $outline
                                    onClick={() => handleConnect(provider.provider)}
                                >
                                    {linked ? "Link another" : "Link"}
                                </Button>
                            </Actions>
                        </ProviderRow>
                    );
                })}
            </ProviderList>
        </>
    );
};
