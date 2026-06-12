import { X } from "@phosphor-icons/react";
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
import { IconWrapper } from "./shared";

const providerMeta: Record<string, { icon: React.ReactNode; label: string }> = {
    google_oauth: { icon: <GoogleIcon />, label: "Google" },
    microsoft_oauth: { icon: <MicrosoftIcon />, label: "Microsoft" },
    github_oauth: { icon: <GithubIcon />, label: "GitHub" },
    gitlab_oauth: { icon: <GitLabIcon />, label: "GitLab" },
    linkedin_oauth: { icon: <LinkedInIcon />, label: "LinkedIn" },
    discord_oauth: { icon: <DiscordIcon />, label: "Discord" },
    x_oauth: { icon: <XIcon />, label: "X" },
};

export const SocialManagementSection = () => {
    const { user, disconnectSocialConnection, connectSocialAccount } =
        useUser();
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
            <div className="w-flex w-items-center w-gap-3">
                <div className="w-grow w-flex-col w-gap-1">
                    <div className="w-sec">Connected accounts</div>
                    <div className="w-secsub">
                        Sign in faster by linking third-party accounts.
                    </div>
                </div>
            </div>

            <div className="w-list">
                {enabledProviders.map((provider) => {
                    const meta =
                        providerMeta[
                            provider.provider as keyof typeof providerMeta
                        ];
                    if (!meta) return null;

                    const accounts =
                        user?.social_connections?.filter(
                            (c) => c.provider === provider.provider,
                        ) || [];
                    const linked = accounts.length > 0;

                    return (
                        <div
                            key={provider.provider}
                            className="w-vrow"
                        >
                            <div className="w-flex w-items-center w-gap-3 w-grow">
                                <IconWrapper>{meta.icon}</IconWrapper>
                                <div className="w-flex-col w-gap-1 w-grow">
                                    <div className="w-sec">{meta.label}</div>
                                    {linked ? (
                                        <div className="w-flex w-wrap w-gap-1">
                                            {accounts.map((account) => (
                                                <span
                                                    key={account.id}
                                                    className="w-chip"
                                                >
                                                    <span className="w-truncate">
                                                        {account.email_address}
                                                    </span>
                                                    <span
                                                        className="w-chip-x"
                                                        role="button"
                                                        onClick={() =>
                                                            handleDisconnect(
                                                                account.id,
                                                            )
                                                        }
                                                        title="Remove connection"
                                                        aria-label="Remove connection"
                                                    >
                                                        <X
                                                            size={10}
                                                            weight="bold"
                                                        />
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="w-secsub">
                                            Not linked
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`w-flex w-justify-end w-none${linked ? " w-row-act-top" : ""}`}>
                                <Button
                                    $size="sm"
                                    $outline
                                    onClick={() =>
                                        handleConnect(provider.provider)
                                    }
                                >
                                    {linked ? "Link another" : "Link"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
