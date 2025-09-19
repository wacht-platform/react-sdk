"use client";

import { useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useSSOCallback } from "../../hooks/use-sso-callback";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { AuthFormImage } from "./auth-image";

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

export function SSOCallback() {
  const loadingMessage = "Completing sign in...";
  const successMessage = "Sign in successful! Redirecting...";
  const errorMessage = "Sign in failed";
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();
  const {
    error,
    session,
    processed,
    requiresCompletion,
    signinAttempt,
    requires2FA,
    redirectUri,
    loading,
  } = useSSOCallback();

  // Handle navigation based on state
  useEffect(() => {
    if (!processed || loading || !session) return;

    // If we have an incomplete signin attempt, redirect to signin page with the attempt ID
    if (signinAttempt && !signinAttempt.completed) {
      const signinUrl = deployment?.ui_settings?.sign_in_page_url;
      if (signinUrl) {
        const url = new URL(signinUrl, window.location.origin);
        url.searchParams.set("signin_attempt_id", signinAttempt.id);

        // Preserve the original redirect URI if present
        if (redirectUri) {
          url.searchParams.set("redirect_uri", redirectUri);
        }

        navigate(url.toString());
      }
      return;
    }

    // Redirect to final destination (either signin was fully successful or attempt is completed)
    let finalRedirectUrl = redirectUri || null;

    if (!finalRedirectUrl) {
      finalRedirectUrl =
        deployment?.ui_settings?.after_signin_redirect_url ||
        deployment?.frontend_host ||
        null;
    }

    if (finalRedirectUrl) {
      navigate(finalRedirectUrl);
    }
  }, [session, processed, loading, redirectUri, deployment, signinAttempt, navigate]);

  // Handle error redirect to login
  useEffect(() => {
    if (error && error.message.includes("No OAuth callback data found")) {
      setTimeout(() => {
        const loginUrl =
          deployment?.ui_settings?.sign_in_page_url ||
          deployment?.frontend_host ||
          "/";
        navigate(loginUrl);
      }, 2000);
    }
  }, [error, deployment, navigate]);

  const getStatus = () => {
    if (requires2FA && signinAttempt) return "requires2fa";
    if (requiresCompletion && signinAttempt) return "success";
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

  // The actual redirects for 2FA and profile completion happen in the useEffect in useSSOCallback hook
  // This component just shows loading/success/error states

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
