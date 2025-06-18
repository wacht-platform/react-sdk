import { useEffect, useState } from "react";
import styled from "styled-components";
import { useMagicLinkVerification } from "../../hooks/use-magic-link";
import { DefaultStylesProvider } from "../utility/root";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
  text-align: center;
`;

const Header = styled.div`
  margin-bottom: var(--space-xl);
`;

const Title = styled.h1`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-sm) 0;
`;

const Subtitle = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0;
`;

const StatusContainer = styled.div`
  padding: var(--space-lg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  max-width: 400px;
  width: 100%;
`;

const SuccessIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md) auto;
  color: white;
  font-size: 24px;
`;

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-error);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md) auto;
  color: white;
  font-size: 24px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-md) auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md) 0;
`;

const SubMessage = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
`;

const Button = styled.button`
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  margin-top: var(--space-md);
  
  &:hover {
    background: var(--color-primary-hover);
  }
  
  &:disabled {
    background: var(--color-border);
    cursor: not-allowed;
  }
`;

interface MagicLinkVerificationProps {
  token?: string;
  attempt?: string;
  redirectUri?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MagicLinkVerification({
  token,
  attempt,
  redirectUri,
  onSuccess,
  onError
}: MagicLinkVerificationProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const { verifyMagicLink, error, success } = useMagicLinkVerification();

  useEffect(() => {
    const performVerification = async () => {
      if (!token || !attempt) {
        setStatus('error');
        setMessage('Invalid magic link');
        setSubMessage('The magic link appears to be malformed. Please try signing in again.');
        onError?.('Invalid magic link parameters');
        return;
      }

      setStatus('loading');
      setMessage('Verifying magic link...');
      setSubMessage('Please wait while we verify your magic link.');

      await verifyMagicLink({ token, attempt, redirectUri });

      if (success) {
        setStatus('success');
        setMessage('Magic link verified successfully!');
        setSubMessage('You will be redirected to your account shortly.');
        onSuccess?.();

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (error) {
        setStatus('error');
        setMessage('Magic link verification failed');
        setSubMessage('The magic link may have expired or already been used. Please try signing in again.');
        onError?.(error.message);
      }
    };

    performVerification();
  }, [token, attempt, onSuccess, onError, verifyMagicLink, success, error]);

  const handleRetry = () => {
    window.location.href = '/auth/signin';
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <Title>Magic Link Verification</Title>
          <Subtitle>Verifying your magic link</Subtitle>
        </Header>

        <StatusContainer>
          {status === 'loading' && (
            <>
              <LoadingSpinner />
              <Message>{message}</Message>
              <SubMessage>{subMessage}</SubMessage>
            </>
          )}

          {status === 'success' && (
            <>
              <SuccessIcon>✓</SuccessIcon>
              <Message>{message}</Message>
              <SubMessage>{subMessage}</SubMessage>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorIcon>✗</ErrorIcon>
              <Message>{message}</Message>
              <SubMessage>{subMessage}</SubMessage>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </>
          )}
        </StatusContainer>
      </Container>
    </DefaultStylesProvider>
  );
}
