"use client";

import styled, { keyframes, css } from "styled-components";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useSSOCallback } from "../../hooks/use-sso-callback";
import { useDeployment } from "../../hooks/use-deployment";
import { AuthFormImage } from "./auth-image";
import { TwoFactorVerification } from "./two-factor-verification";
import { ProfileCompletion } from "./profile-completion";

const Container = styled.div`
  max-width: 360px;
  width: 360px;
  padding: var(--space-2xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
  text-align: center;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Message = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
  margin-bottom: var(--space-md);
`;

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const IconContainer = styled.div<{
  $status: "loading" | "success" | "error" | "redirecting" | "requires2fa";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.$status) {
      case "loading":
        return "var(--color-primary-background)";
      case "success":
        return "var(--color-success-background)";
      case "error":
        return "var(--color-error-background)";
      default:
        return "var(--color-primary-background)";
    }
  }};

  svg {
    color: ${(props) => {
      switch (props.$status) {
        case "loading":
          return "var(--color-primary)";
        case "success":
          return "var(--color-success)";
        case "error":
          return "var(--color-error)";
        default:
          return "var(--color-primary)";
      }
    }};

    ${(props) =>
      (props.$status === "loading" || props.$status === "redirecting") &&
      css`
        animation: ${spin} 1s linear infinite;
      `}
  }
`;

const StatusText = styled.div<{
  $status: "loading" | "success" | "error" | "redirecting" | "requires2fa";
}>`
  font-size: var(--font-sm);
  font-weight: 500;
  color: ${(props) => {
    switch (props.$status) {
      case "loading":
        return "var(--color-foreground)";
      case "success":
        return "var(--color-success)";
      case "redirecting":
        return "var(--color-foreground)";
      case "error":
        return "var(--color-error)";
      default:
        return "var(--color-foreground)";
    }
  }};
`;

const ErrorDetails = styled.div`
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-error-background);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-border);

  p {
    margin: 0;
    font-size: var(--font-xs);
    color: var(--color-error);
    text-align: left;
  }
`;

interface SSOCallbackProps {
  onSuccess?: (session: any, redirectUri?: string) => void;
  onError?: (error: Error) => void;
  onRequiresCompletion?: (signupAttempt: any, session: any) => void;
  autoRedirect?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  showCompletionForm?: boolean;
}

export function SSOCallback({
  onSuccess,
  onError,
  onRequiresCompletion,
  autoRedirect = true,
  loadingMessage = "Completing sign in...",
  successMessage = "Sign in successful! Redirecting...",
  errorMessage = "Sign in failed",
  showCompletionForm = true,
}: SSOCallbackProps = {}) {
  const { deployment } = useDeployment();
  const {
    error,
    session,
    processed,
    requiresCompletion,
    requiresVerification,
    signupAttempt,
    signinAttempt,
    requires2FA,
  } = useSSOCallback({
    onSuccess,
    onError,
    onRequiresCompletion,
    autoRedirect,
  });

  const redirectUri =
    new URLSearchParams(window.location.search).get("redirect_uri") ||
    undefined;

  const getStatus = () => {
    if (requires2FA && signinAttempt) return "requires2fa";
    if (
      (requiresCompletion || requiresVerification) &&
      signupAttempt &&
      showCompletionForm
    )
      return "success";
    if (error && error.message.includes("No OAuth callback data found"))
      return "redirecting";
    if (error) return "error";
    if (session && processed) return "success";
    return "loading";
  };

  const status = getStatus();

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 size={24} />;
      case "success":
        return <CheckCircle size={24} />;
      case "redirecting":
        return <Loader2 size={24} />;
      case "error":
        return <AlertCircle size={24} />;
      default:
        return <Loader2 size={24} />;
    }
  };

  const renderMessage = () => {
    switch (status) {
      case "loading":
        return loadingMessage;
      case "success":
        return successMessage;
      case "redirecting":
        return "Redirecting to login...";
      case "error":
        return errorMessage;
      default:
        return loadingMessage;
    }
  };

  // If 2FA is required, show the TwoFactorVerification component
  if (requires2FA && signinAttempt) {
    return (
      <TwoFactorVerification
        onBack={() => {
          // Redirect back to login if user cancels
          const loginUrl =
            deployment?.ui_settings?.sign_in_page_url ||
            deployment?.frontend_host ||
            "/";
          window.location.href = loginUrl;
        }}
      />
    );
  }

  // If profile completion is required, show the ProfileCompletion component
  if (requiresCompletion && (signupAttempt || signinAttempt)) {
    return (
      <ProfileCompletion
        onComplete={(session) => {
          if (onSuccess) {
            onSuccess(session, redirectUri || undefined);
          } else if (autoRedirect) {
            const finalRedirectUrl =
              redirectUri ||
              deployment?.ui_settings?.sign_in_page_url ||
              deployment?.frontend_host ||
              "/";
            window.location.href = finalRedirectUrl;
          }
        }}
        onError={onError}
        onBack={() => {
          // Redirect back to login if user cancels
          const loginUrl =
            deployment?.ui_settings?.sign_in_page_url ||
            deployment?.frontend_host ||
            "/";
          window.location.href = loginUrl;
        }}
      />
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <AuthFormImage />
          <Title>Single Sign-On</Title>
          <Message>
            {!processed && !error ? "Processing your sign in request..." : ""}
          </Message>
        </Header>

        <StatusContainer>
          <IconContainer $status={status}>{renderIcon()}</IconContainer>

          <StatusText $status={status}>{renderMessage()}</StatusText>

          {error && status === "error" && (
            <ErrorDetails>
              <p>
                <strong>Error:</strong> {error.message}
              </p>
              {error.message.includes("OAuth Error") && (
                <p
                  style={{
                    marginTop: "var(--space-xs)",
                    fontSize: "var(--font-2xs)",
                  }}
                >
                  Please try signing in again or contact support if the problem
                  persists.
                </p>
              )}
            </ErrorDetails>
          )}
        </StatusContainer>
      </Container>
    </DefaultStylesProvider>
  );
}

export default SSOCallback;
