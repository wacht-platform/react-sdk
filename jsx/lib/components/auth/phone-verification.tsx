import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/utility";
import { Input } from "@/components/utility/input";
import { Form, FormGroup, Label } from "../utility/form";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "./auth-image";
import { standaloneAuthShell } from "./auth-shell";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const ButtonSpinner = styled(CircleNotch)`
    animation: ${spin} 1s linear infinite;
`;

const Container = styled.div`
  ${standaloneAuthShell}
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-8u);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin-bottom: var(--space-2u);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-size-md);
`;

const ErrorMessage = styled.p`
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-1u);
`;

const SubmitButton = styled(Button)`
  margin-top: var(--space-4u);
  width: 100%;
`;

const Footer = styled.div`
  margin-top: var(--space-8u);
  text-align: center;
  font-size: var(--font-size-md);
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
  }
`;

const LastDigitsInput = styled(Input)`
  padding: var(--space-4u) var(--space-6u);
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
          <Title>Verify Phone</Title>
          <Subtitle>
            Enter the last 4 digits of your phone number.
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
            {loading ? <ButtonSpinner size={16} /> : "Send code"}
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
