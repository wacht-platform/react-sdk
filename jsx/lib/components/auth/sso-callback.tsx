"use client";

import { useEffect } from "react";
import styled from "styled-components";
import { DefaultStylesProvider } from "../utility/root";
import { useSSOCallback } from "../../hooks/use-sso-callback";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { Button } from "../utility";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
`;

const StatusContainer = styled.div`
  padding-top: var(--space-xl);
  text-align: center;
`;

const ErrorIcon = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border-radius: 50%;
  background: var(--color-error-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg) auto;
  color: var(--color-error);
  font-size: var(--font-xl);
`;

const LoadingSpinner = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-lg) auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const SuccessIcon = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border-radius: 50%;
  background: var(--color-success-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg) auto;
  color: var(--color-success);
  font-size: var(--font-xl);
`;

const Message = styled.p`
  font-size: var(--font-sm);
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
`;

const SubMessage = styled.p`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin-bottom: var(--space-lg);
`;

const Footer = styled.div`
  margin-top: var(--space-xl);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 400;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }
`;

export function SSOCallback() {
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();
  const { error, session, processed, signinAttempt, redirectUri, loading } =
    useSSOCallback();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleReturnToSignIn = () => {
    const signInUrl = deployment?.ui_settings?.sign_in_page_url || "/sign-in";
    navigate(signInUrl);
  };

  useEffect(() => {
    if (!processed || loading) return;

    if (signinAttempt && !signinAttempt.completed) {
      const signinUrl = deployment?.ui_settings?.sign_in_page_url;
      if (signinUrl) {
        const url = new URL(signinUrl, window.location.origin);
        url.searchParams.set("signin_attempt_id", signinAttempt.id);

        if (redirectUri) {
          url.searchParams.set("redirect_uri", redirectUri);
        }

        navigate(url.toString());
      }
      return;
    }

    if (signinAttempt?.completed) {
      const redirectTarget =
        redirectUri ||
        deployment?.ui_settings?.after_signin_redirect_url ||
        deployment?.frontend_host ||
        "/";

      let redirectUrl: URL;
      try {
        redirectUrl = new URL(redirectTarget);
      } catch {
        redirectUrl = new URL(redirectTarget, window.location.origin);
      }

      if (redirectUrl) {
        if (deployment?.mode === "staging") {
          redirectUrl.searchParams.set(
            "__dev_session__",
            localStorage.getItem("__dev_session__") || "",
          );
        }

        navigate(redirectUrl.toString());
      }
    }
  }, [
    session,
    processed,
    loading,
    redirectUri,
    deployment,
    signinAttempt,
    navigate,
  ]);

  useEffect(() => {
    if (error && error.message.includes("No OAuth callback data found")) {
      setTimeout(() => {
        const loginUrl =
          deployment?.ui_settings?.sign_in_page_url ||
          deployment?.frontend_host;

        if (loginUrl) {
          navigate(loginUrl);
        }
      }, 2000);
    }
  }, [error, deployment, navigate]);

  if (loading && !processed) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Completing sign in</Title>
            <Subtitle>Please wait while we authenticate you</Subtitle>
          </Header>
          <StatusContainer>
            <LoadingSpinner />
            <Message>Verifying your credentials...</Message>
            <SubMessage>This will only take a moment.</SubMessage>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (session && processed && !error) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Success!</Title>
            <Subtitle>Authentication completed successfully</Subtitle>
          </Header>
          <StatusContainer>
            <SuccessIcon>✓</SuccessIcon>
            <Message>Redirecting you now...</Message>
            <SubMessage>
              You'll be redirected to your destination shortly.
            </SubMessage>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (error) {
    const isNoCallbackData = error.message.includes(
      "No OAuth callback data found",
    );

    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Something went wrong</Title>
            <Subtitle>We couldn't complete your sign in</Subtitle>
          </Header>
          <StatusContainer>
            <ErrorIcon>✗</ErrorIcon>
            <Message>Authentication Failed</Message>
            <SubMessage>
              {error.message ||
                "An unexpected error occurred during authentication."}
            </SubMessage>
            {!isNoCallbackData && (
              <Button
                onClick={handleRetry}
                style={{ marginTop: "var(--space-lg)" }}
              >
                Try Again
              </Button>
            )}
          </StatusContainer>
          {!isNoCallbackData && (
            <Footer>
              <div>
                Having trouble?{" "}
                <Link onClick={handleReturnToSignIn}>Return to sign in</Link>
              </div>
            </Footer>
          )}
        </Container>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <Title>Completing sign in</Title>
          <Subtitle>Please wait while we authenticate you</Subtitle>
        </Header>
        <StatusContainer>
          <LoadingSpinner />
          <Message>Verifying your credentials...</Message>
          <SubMessage>This will only take a moment.</SubMessage>
        </StatusContainer>
      </Container>
    </DefaultStylesProvider>
  );
}

export default SSOCallback;
