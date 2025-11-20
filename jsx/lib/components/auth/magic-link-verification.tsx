import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import {
  useMagicLinkVerification,
  useMagicLinkParams,
} from "../../hooks/use-magic-link";
import { DefaultStylesProvider } from "../utility/root";
import { Button } from "../utility";
import { useNavigation } from "../../hooks/use-navigation";
import { useDeployment } from "../../hooks/use-deployment";

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

const SubMessage = styled.p`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

interface MagicLinkVerificationProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MagicLinkVerification({
  onSuccess,
  onError,
}: MagicLinkVerificationProps = {}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [subMessage, setSubMessage] = useState("");
  const { token, attempt, redirectUri } = useMagicLinkParams();
  const { verifyMagicLink, error, success } = useMagicLinkVerification();
  const { navigate } = useNavigation();
  const { deployment } = useDeployment();
  const hasVerified = useRef(false);

  useEffect(() => {
    const performVerification = async () => {
      if (hasVerified.current) return;

      if (!token || !attempt) {
        setStatus("error");
        setSubMessage(
          "The magic link appears to be malformed. Please try signing in again.",
        );
        onError?.("Invalid magic link parameters");
        return;
      }

      hasVerified.current = true;
      setStatus("loading");
      setSubMessage("Please wait while we verify your magic link.");

      await verifyMagicLink({ token, attempt, redirectUri });
    };

    performVerification();
  }, [token, attempt]);

  useEffect(() => {
    if (success) {
      setStatus("success");
      setSubMessage("You will be redirected to your account shortly.");
      onSuccess?.();

      // Handle redirect similar to signin-form
      setTimeout(() => {
        let finalRedirectUri = redirectUri;

        if (!finalRedirectUri) {
          finalRedirectUri = deployment?.ui_settings?.after_signin_redirect_url;
        }

        // Fallback to frontend host if no redirect URL configured
        if (!finalRedirectUri && deployment?.frontend_host) {
          finalRedirectUri = `https://${deployment.frontend_host}`;
        }

        if (finalRedirectUri) {
          const uri = new URL(finalRedirectUri);

          if (deployment?.mode === "staging") {
            uri.searchParams.set(
              "__dev_session__",
              localStorage.getItem("__dev_session__") || "",
            );
          }

          navigate(uri.toString());
        }
      }, 2000);
    } else if (error) {
      setStatus("error");
      setSubMessage(
        "The magic link may have expired or already been used. Please try signing in again.",
      );
      onError?.(error.message);
    }
  }, [success, error, navigate, deployment, redirectUri, onSuccess, onError]);

  const handleRetry = () => {
    if (deployment?.ui_settings?.sign_in_page_url) {
      navigate(deployment.ui_settings.sign_in_page_url);
    }
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <Title>Magic Link Verification</Title>
          <Subtitle>Verifying your magic link</Subtitle>
        </Header>

        <StatusContainer>
          {status === "loading" && (
            <>
              <LoadingSpinner />
              <SubMessage>{subMessage}</SubMessage>
            </>
          )}

          {status === "success" && (
            <>
              <SuccessIcon>✓</SuccessIcon>
              <SubMessage>{subMessage}</SubMessage>
            </>
          )}

          {status === "error" && (
            <>
              <ErrorIcon>✗</ErrorIcon>
              <SubMessage>{subMessage}</SubMessage>
              <Button
                onClick={handleRetry}
                style={{ marginTop: "var(--space-xl)" }}
              >
                Try Again
              </Button>
            </>
          )}
        </StatusContainer>
      </Container>
    </DefaultStylesProvider>
  );
}
