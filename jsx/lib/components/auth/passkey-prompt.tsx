import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Fingerprint, CircleNotch } from "@phosphor-icons/react";
import { useUser } from "../../hooks/use-user";
import { useDeployment } from "../../hooks/use-deployment";
import { Button } from "../utility/button";

const Header = styled.div`
    text-align: center;
    margin-bottom: var(--space-12u);
`;

const IconContainer = styled.div`
    width: var(--size-32u);
    height: var(--size-32u);
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-primary),
        var(--color-primary-hover)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-8u);

    svg {
        width: calc(var(--size-8u) * 2);
        height: calc(var(--size-8u) * 2);
        color: var(--color-foreground-inverse);
    }
`;

const Title = styled.h1`
    font-size: var(--font-size-2xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin: 0 0 var(--space-2u);
`;

const Subtitle = styled.p`
    color: var(--color-secondary-text);
    font-size: var(--font-size-md);
    margin: 0;
    line-height: 1.5;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-4u);
    margin-top: var(--space-10u);
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(CircleNotch)`
    animation: ${spin} 1s linear infinite;
`;

const ErrorMessage = styled.p`
    font-size: var(--font-size-md);
    color: var(--color-error);
    text-align: center;
    margin: var(--space-4u) 0 0;
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
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to register passkey",
            );
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
                    Sign in faster and more securely with a passkey. Use your
                    fingerprint, face, or screen lock to access {appName}.
                </Subtitle>
            </Header>

            <ButtonGroup>
                <Button
                    $fullWidth
                    onClick={handleRegister}
                    disabled={isRegistering}
                >
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
                <Button $fullWidth $outline onClick={onSkip}>
                    Maybe Later
                </Button>
            </ButtonGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
        </>
    );
}
