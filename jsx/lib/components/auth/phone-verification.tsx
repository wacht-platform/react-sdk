import { useState } from "react";
import styled from "styled-components";
import { Button } from "@/components/utility";
import { Input } from "@/components/utility/input";
import { Form, FormGroup, Label } from "../utility/form";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "./auth-image";

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
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
`;

const SubmitButton = styled(Button)`
  margin-top: var(--space-sm);
  width: 100%;
`;

const Footer = styled.div`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

const LastDigitsInput = styled(Input)`
  text-align: center;
  font-size: var(--font-md);
  letter-spacing: 0.5em;
  font-family: monospace;
  padding: var(--space-sm) var(--space-md);
`;

interface PhoneVerificationProps {
  onVerify: (lastFourDigits: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export function PhoneVerification({
  onVerify,
  onBack,
  loading,
}: PhoneVerificationProps) {
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lastFourDigits.length !== 4) {
      setError("Please enter the last 4 digits of your phone number");
      return;
    }

    onVerify(lastFourDigits);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setLastFourDigits(value);
    setError("");
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Verify your phone number</Title>
          <Subtitle>
            To send a verification code, please confirm the last 4 digits of
            your primary phone number
          </Subtitle>
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <Label htmlFor="lastDigits">Last 4 digits</Label>
            <LastDigitsInput
              type="text"
              id="lastDigits"
              name="lastDigits"
              value={lastFourDigits}
              onChange={handleInputChange}
              placeholder="0000"
              maxLength={4}
              autoComplete="off"
              aria-invalid={!!error}
              autoFocus
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </FormGroup>

          <SubmitButton
            type="submit"
            disabled={loading || lastFourDigits.length !== 4}
          >
            {loading ? "Verifying..." : "Send code"}
          </SubmitButton>
        </Form>

        <Footer>
          <Link onClick={onBack} style={{ cursor: "pointer" }}>
            Choose a different method
          </Link>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
