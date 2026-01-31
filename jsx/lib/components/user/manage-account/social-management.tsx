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
            <div style={{ marginBottom: "24px" }}>
                <h3
                    style={{
                        fontSize: "16px",
                        margin: "0 0 6px 0",
                        letterSpacing: "-0.01em",
                        color: "var(--color-foreground)",
                    }}
                >
                    Connected Accounts
                </h3>
                <p
                    style={{
                        fontSize: "13px",
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
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {providerInfo.label}
                                    </div>
                                    {connectedAccounts.map((account) => (
                                        <div
                                            key={account.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                background: "var(--color-input-background)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "6px",
                                                padding: "4px 8px",
                                                fontSize: "13px",
                                                color: "var(--color-muted)",
                                            }}
                                        >
                                            <span>{account.email_address}</span>
                                            <IconButton
                                                onClick={async () => {
                                                    await disconnectSocialConnection(
                                                        account.id.toString(),
                                                    );
                                                    user.refetch();
                                                }}
                                                style={{ padding: "2px" }}
                                            >
                                                <X size={14} />
                                            </IconButton>
                                        </div>
                                    ))}
                                </ConnectionLeft>

                                <ConnectionRight>
                                    {connectedAccounts.length > 0 ? (
                                        <Button
                                            onClick={() => {
                                                connectSocialAccount({
                                                    provider: provider.provider,
                                                    redirectUri: window.location.href,
                                                });
                                            }}
                                            style={{
                                                padding: "6px 24px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Add
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                connectSocialAccount({
                                                    provider: provider.provider,
                                                    redirectUri: window.location.href,
                                                });
                                            }}
                                            style={{
                                                padding: "6px 14px",
                                                fontSize: "13px",
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
                                        height: "1px",
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
