import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Fingerprint, Loader2 } from "lucide-react";
import { useUser } from "../../hooks/use-user";
import { useDeployment } from "../../hooks/use-deployment";
import { Button } from "../utility/button";

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-2xl);
`;

const IconContainer = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg);
  
  svg {
    width: 32px;
    height: 32px;
    color: white;
  }
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 var(--space-xs);
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ErrorMessage = styled.p`
  font-size: var(--font-xs);
  color: var(--color-error);
  text-align: center;
  margin: var(--space-sm) 0 0;
`;

interface PasskeyPromptProps {
    onComplete?: () => void;
    onSkip?: () => void;
}

export function PasskeyPrompt({ onComplete, onSkip }: PasskeyPromptProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { registerPasskey } = useUser();
    const { deployment } = useDeployment();

    const handleRegister = async () => {
        setIsRegistering(true);
        setError(null);

        try {
            await registerPasskey();
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register passkey");
        } finally {
            setIsRegistering(false);
        }
    };

    const appName = deployment?.ui_settings?.app_name || "this app";

    return (
        <>
            <Header>
                <IconContainer>
                    <Fingerprint />
                </IconContainer>
                <Title>Add a Passkey</Title>
                <Subtitle>
                    Sign in faster and more securely with a passkey. Use your fingerprint,
                    face, or screen lock to access {appName}.
                </Subtitle>
            </Header>

            <ButtonGroup>
                <Button $fullWidth $size="sm" onClick={handleRegister} disabled={isRegistering}>
                    {isRegistering ? (
                        <>
                            <Spinner size={16} />
                            Registering...
                        </>
                    ) : (
                        <>
                            <Fingerprint size={16} />
                            Add Passkey
                        </>
                    )}
                </Button>
                <Button $fullWidth $size="sm" $outline onClick={onSkip}>
                    Maybe Later
                </Button>
            </ButtonGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
        </>
    );
}
