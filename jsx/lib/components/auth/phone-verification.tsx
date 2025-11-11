import { useState } from "react";
import styled from "styled-components";
import { Button } from "@/components/utility";
import { Form } from "../utility/form";
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

const InputWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin: var(--space-lg) 0;
`;

const DigitInput = styled.input`
  width: 56px;
  height: 64px;
  text-align: center;
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--color-foreground);
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 59, 130, 246), 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--color-muted);
  }
`;

const HelpText = styled.p`
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin: var(--space-md) 0;
  line-height: 1.5;
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
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lastFourDigits = digits.join("");
    if (lastFourDigits.length !== 4) {
      setError("Please enter all 4 digits");
      return;
    }

    onVerify(lastFourDigits);
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    // Auto-focus next input
    if (digit && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (digit && index === 3 && newDigits.every(d => d)) {
      const form = document.getElementById("phone-verification-form");
      if (form) {
        const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);

    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < pastedData.length && i < 4; i++) {
        newDigits[i] = pastedData[i];
      }
      setDigits(newDigits);

      // Focus last filled input
      const lastIndex = Math.min(pastedData.length, 3);
      const lastInput = document.getElementById(`digit-${lastIndex}`);
      lastInput?.focus();
    }
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Verify your phone number</Title>
          <Subtitle>
            Enter the last 4 digits of your registered phone number
          </Subtitle>
        </Header>

        <Form id="phone-verification-form" onSubmit={handleSubmit} noValidate>
          <HelpText>
            We'll send a verification code to this number
          </HelpText>

          <InputWrapper>
            {digits.map((digit, index) => (
              <DigitInput
                key={index}
                id={`digit-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                autoFocus={index === 0}
                autoComplete="off"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </InputWrapper>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <SubmitButton
            type="submit"
            disabled={loading || digits.some(d => !d)}
          >
            {loading ? "Verifying..." : "Continue"}
          </SubmitButton>
        </Form>

        <Footer>
          <Link onClick={onBack} style={{ cursor: "pointer" }}>
            Try a different method
          </Link>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
