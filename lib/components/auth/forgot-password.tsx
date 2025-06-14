import { useState } from "react";
import styled from "styled-components";
import { DefaultStylesProvider } from "@/components/utility/root";

import { OtherAuthOptions } from "@/components/auth/other-auth-options";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px var(--color-shadow);
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

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: var(--space-lg) 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--color-divider);
  }
`;

const DividerText = styled.span`
  position: relative;
  background: var(--color-background);
  padding: 0 var(--space-sm);
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const ResetButton = styled.button`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-xs);
  cursor: pointer;
  transition: background-color 0.2s;
  height: 36px;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-lg);
`;

const FooterText = styled.p`
  font-size: var(--font-xs);
  color: var(--color-muted);
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;
`;

interface ForgotPasswordProps {
  onBack: () => void;
  onHelp: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setIsSubmitting(false);
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <Title>Forgot Password</Title>
        </Header>

        <ResetButton onClick={handleResetPassword} disabled={isSubmitting}>
          Reset your password
        </ResetButton>

        <Divider>
          <DividerText>Or, sign in with another method</DividerText>
        </Divider>

        <OtherAuthOptions />

        <Footer>
          <FooterText>
            Unable to reset password? <Link href="/contact">Get help</Link>
          </FooterText>
          <FooterText style={{ marginTop: "var(--space-sm)" }}>
            <Link onClick={onBack} style={{ cursor: "pointer" }}>
              Back to previous screen
            </Link>
          </FooterText>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
