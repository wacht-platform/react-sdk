import { GithubIcon } from "../icons/github";
import { GoogleIcon } from "../icons/google";
import { XIcon } from "../icons/x";
import { FacebookIcon } from "../icons/facebook";
import { LinkedInIcon } from "../icons/linkedin";
import { GitLabIcon } from "../icons/gitlab";
import { AppleIcon } from "../icons/apple";
import { DiscordIcon } from "../icons/discord";
import { DeploymentSocialConnection } from "@/types";

const socialAuthProviders = {
    google_oauth: { label: "Continue with Google", icon: <GoogleIcon /> },
    github_oauth: { label: "Continue with GitHub", icon: <GithubIcon /> },
    x_oauth: { label: "Continue with X", icon: <XIcon /> },
    facebook_oauth: { label: "Continue with Facebook", icon: <FacebookIcon /> },
    linkedin_oauth: { label: "Continue with LinkedIn", icon: <LinkedInIcon /> },
    gitlab_oauth: { label: "Continue with GitLab", icon: <GitLabIcon /> },
    apple_oauth: { label: "Continue with Apple", icon: <AppleIcon /> },
    discord_oauth: { label: "Continue with Discord", icon: <DiscordIcon /> },
};

interface SocialAuthButtonsProps {
    connections: DeploymentSocialConnection[];
    callback: (provider: DeploymentSocialConnection) => void;
}

export const SocialAuthButtons = ({
    connections,
    callback,
}: SocialAuthButtonsProps) => {
    const items = connections
        .map((connection) => ({
            connection,
            config: socialAuthProviders[
                connection.provider as keyof typeof socialAuthProviders
            ],
        }))
        .filter((item) => item.config);

    if (!items.length) return null;

    // 4+ providers collapse to a compact icon grid; ≤3 stay full-width buttons.
    if (items.length > 3) {
        const cols = Math.min(items.length, 4);
        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: 8,
                }}
            >
                {items.map(({ connection, config }) => (
                    <button
                        key={connection.provider}
                        type="button"
                        className="w-social"
                        style={{ justifyContent: "center", padding: 0 }}
                        onClick={() => callback(connection)}
                        title={config.label}
                        aria-label={config.label}
                    >
                        {config.icon}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(({ connection, config }) => (
                <button
                    key={connection.provider}
                    type="button"
                    className="w-social"
                    onClick={() => callback(connection)}
                >
                    {config.icon}
                    <span className="w-social-label">{config.label}</span>
                </button>
            ))}
        </div>
    );
};
