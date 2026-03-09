import styled, { css } from "styled-components";
import { ChevronRight } from "lucide-react";
import { GithubIcon } from "../icons/github";
// import { MicrosoftIcon } from "../icons/microsoft";
import { GoogleIcon } from "../icons/google";
import { XIcon } from "../icons/x";
import { FacebookIcon } from "../icons/facebook";
import { LinkedInIcon } from "../icons/linkedin";
import { GitLabIcon } from "../icons/gitlab";
import { AppleIcon } from "../icons/apple";
import { DiscordIcon } from "../icons/discord";
import { DeploymentSocialConnection } from "@/types";

const socialAuthProviders = {
    google_oauth: {
        shortLabel: "Google",
        fullLabel: "Continue with Google",
        icon: <GoogleIcon />,
    },
    // Microsoft OAuth temporarily disabled - unverified credentials
    // microsoft_oauth: {
    //   shortLabel: "Microsoft",
    //   fullLabel: "Continue with Microsoft",
    //   icon: <MicrosoftIcon />,
    // },
    github_oauth: {
        shortLabel: "GitHub",
        fullLabel: "Continue with GitHub",
        icon: <GithubIcon />,
    },
    x_oauth: {
        shortLabel: "X",
        fullLabel: "Continue with X",
        icon: <XIcon />,
    },
    facebook_oauth: {
        shortLabel: "Facebook",
        fullLabel: "Continue with Facebook",
        icon: <FacebookIcon />,
    },
    linkedin_oauth: {
        shortLabel: "LinkedIn",
        fullLabel: "Continue with LinkedIn",
        icon: <LinkedInIcon />,
    },
    gitlab_oauth: {
        shortLabel: "GitLab",
        fullLabel: "Continue with GitLab",
        icon: <GitLabIcon />,
    },
    apple_oauth: {
        shortLabel: "Apple",
        fullLabel: "Continue with Apple",
        icon: <AppleIcon />,
    },
    discord_oauth: {
        shortLabel: "Discord",
        fullLabel: "Continue with Discord",
        icon: <DiscordIcon />,
    },
};

const SocialAuthButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-2u);
    margin-bottom: var(--space-6u);
`;

const ButtonRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2u);
`;

const SocialAuthButton = styled.button<{
    $isWide?: boolean;
    $totalProviders: number;
}>`
    display: flex;
    align-items: center;
    justify-content: ${(props) =>
        props.$totalProviders < 3 ? "space-between" : "center"};
    gap: var(--space-2u);
    padding: var(--space-4u) var(--space-6u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
    font-size: var(--font-size-md);
    color: var(--color-card-foreground);
    font-weight: 400;
    height: var(--size-18u);
    min-height: var(--size-18u);
    padding-top: 0;
    padding-bottom: 0;
    line-height: 1;

    ${(props) => {
        if (props.$totalProviders <= 6) {
            return css`
                flex: 1 1 0;
            `;
        }
        return css`
            flex: 0 0 calc((100% - (var(--space-2u) * 5)) / 6);
            ${props.$isWide &&
            css`
                flex: 0 0 calc((100% - (var(--space-2u) * 3)) / 4);
            `}
        `;
    }}

    &:hover {
        background-color: var(--color-accent);
        border-color: var(--color-border-hover);
        color: var(--color-accent-foreground);
    }

    svg {
        width: var(--size-8u);
        height: var(--size-8u);
        flex-shrink: 0;
    }
`;

const SocialAuthButtonContent = styled.span`
    display: inline-flex;
    align-items: center;
    gap: var(--space-4u);
    min-width: 0;
`;

const SocialAuthLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const SocialAuthArrow = styled(ChevronRight)`
    margin-left: auto;
    width: var(--space-7u);
    height: var(--space-7u);
    color: var(--color-secondary-text);
    flex-shrink: 0;

    ${SocialAuthButton}:hover & {
        color: var(--color-accent-foreground);
    }
`;

interface SocialAuthButtonsProps {
    connections: DeploymentSocialConnection[];
    callback: (provider: DeploymentSocialConnection) => void;
}

export const SocialAuthButtons = ({
    connections,
    callback,
}: SocialAuthButtonsProps) => {
    const organizeButtons = () => {
        if (connections.length <= 6) {
            return [connections];
        }
        if (connections.length <= 12) {
            return [connections.slice(0, 4), connections.slice(4)];
        }
        return [
            connections.slice(0, 4),
            connections.slice(4, 8),
            connections.slice(8),
        ];
    };

    const totalProviders = connections.length;

    const buttonRows = organizeButtons();

    return (
        <SocialAuthButtonsContainer>
            {buttonRows.map((row, rowIndex) => (
                <ButtonRow key={`row-${rowIndex}`}>
                    {row.map((connection, connectionIndex) => {
                        const provider =
                            connection.provider as keyof typeof socialAuthProviders;
                        return (
                            <SocialAuthButton
                                key={`${connection.provider}-${connectionIndex}`}
                                onClick={() => callback(connection)}
                                type="button"
                                $isWide={
                                    buttonRows.length > 1 &&
                                    rowIndex < buttonRows.length - 1
                                }
                                $totalProviders={totalProviders}
                            >
                                <SocialAuthButtonContent>
                                    {socialAuthProviders[provider].icon}
                                    {totalProviders < 3 && (
                                        <SocialAuthLabel>
                                            {totalProviders === 1
                                                ? socialAuthProviders[provider]
                                                      .fullLabel
                                                : socialAuthProviders[provider]
                                                      .shortLabel}
                                        </SocialAuthLabel>
                                    )}
                                </SocialAuthButtonContent>
                                {totalProviders < 3 && <SocialAuthArrow />}
                            </SocialAuthButton>
                        );
                    })}
                </ButtonRow>
            ))}
        </SocialAuthButtonsContainer>
    );
};
