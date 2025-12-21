import styled, { css } from "styled-components";
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
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
`;

const SocialAuthButton = styled.button<{
  $isWide?: boolean;
  $totalProviders: number;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--font-xs);
  color: var(--color-foreground);
  font-weight: 400;
  height: 34px;

  ${(props) => {
    if (props.$totalProviders <= 6) {
      return css`
        flex: 1 1 0;
      `;
    }
    return css`
      flex: 0 0 calc((100% - (var(--space-xs) * 5)) / 6);
      ${props.$isWide &&
      css`
        flex: 0 0 calc((100% - (var(--space-xs) * 3)) / 4);
      `}
    `;
  }}

  &:hover {
    background-color: var(--color-background-hover);
    border-color: var(--color-border-hover);
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
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
                  buttonRows.length > 1 && rowIndex < buttonRows.length - 1
                }
                $totalProviders={totalProviders}
              >
                {socialAuthProviders[provider].icon}
                {totalProviders < 3 && (
                  <span>
                    {totalProviders === 1
                      ? socialAuthProviders[provider].fullLabel
                      : socialAuthProviders[provider].shortLabel}
                  </span>
                )}
              </SocialAuthButton>
            );
          })}
        </ButtonRow>
      ))}
    </SocialAuthButtonsContainer>
  );
};
