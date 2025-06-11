import styled, { css } from "styled-components";
import { GithubIcon } from "../icons/github";
import { MicrosoftIcon } from "../icons/microsoft";
import { GoogleIcon } from "../icons/google";
import { XIcon } from "../icons/x";
import { DeploymentSocialConnection } from "@/types/deployment";

const socialAuthProviders = {
  google_oauth: {
    shortLabel: "Google",
    fullLabel: "Continue with Google",
    icon: <GoogleIcon />,
  },
  microsoft_oauth: {
    shortLabel: "Microsoft",
    fullLabel: "Continue with Microsoft",
    icon: <MicrosoftIcon />,
  },
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
  font-weight: 500;
  height: 36px;

  ${(props) => {
    if (props.$totalProviders <= 6) {
      return css`
        flex: 1 1 0;
      `;
    }
    return css`
      flex: 0 0 calc((100% - (var(--space-sm) * 5)) / 6);
      ${props.$isWide &&
      css`
        flex: 0 0 calc((100% - (var(--space-sm) * 3)) / 4);
      `}
    `;
  }}

  &:hover {
    background-color: var(--color-input-background);
    border-color: var(--color-input-border);
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
        <ButtonRow key={row[0].id}>
          {row.map((connection) => {
            const provider =
              connection.provider as keyof typeof socialAuthProviders;
            return (
              <SocialAuthButton
                key={connection.id}
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
