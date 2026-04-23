import styled from "styled-components";
import { CaretRight } from "@phosphor-icons/react";
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

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-3u);
    margin-bottom: var(--space-6u);
`;

const SocialButton = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    width: 100%;
    height: var(--size-18u);
    padding: 0 var(--space-6u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-card-foreground);
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
        background-color: var(--color-accent);
        border-color: var(--color-border-hover);
    }

    &:hover .arrow {
        opacity: 1;
        transform: translateX(0);
    }

    svg:not(.arrow) {
        width: var(--size-8u);
        height: var(--size-8u);
        flex-shrink: 0;
    }
`;

const Label = styled.span`
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Arrow = styled(CaretRight)`
    width: var(--space-6u);
    height: var(--space-6u);
    color: var(--color-secondary-text);
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
`;

interface SocialAuthButtonsProps {
    connections: DeploymentSocialConnection[];
    callback: (provider: DeploymentSocialConnection) => void;
}

export const SocialAuthButtons = ({
    connections,
    callback,
}: SocialAuthButtonsProps) => {
    return (
        <Container>
            {connections.map((connection) => {
                const config =
                    socialAuthProviders[
                        connection.provider as keyof typeof socialAuthProviders
                    ];
                if (!config) return null;
                return (
                    <SocialButton
                        key={connection.provider}
                        type="button"
                        onClick={() => callback(connection)}
                    >
                        {config.icon}
                        <Label>{config.label}</Label>
                        <Arrow className="arrow" />
                    </SocialButton>
                );
            })}
        </Container>
    );
};
