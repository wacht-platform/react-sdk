import { useState } from "react";
import styled from "styled-components";
import { useDeployment } from "../../hooks/use-deployment";
import { TypographyProvider } from "../utility/typography";
import { SocialAuthButtons } from "./social-buttons";
import { ArrowLeft } from "lucide-react";

const Container = styled.div`
  max-width: 400px;
  width: 400px;
  padding: 32px 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
  position: relative;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 4px;
`;

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: 16px 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
  }
`;

const DividerText = styled.span`
  position: relative;
  background: white;
  padding: 0 12px;
  color: #6b7280;
  font-size: 14px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 6px;
  left: 0px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 24px;
  color: #64748b;
  background: none;
  border: none;

  &:hover {
    color: #1e293b;
  }
`;

const ResetButton = styled.button`
  width: 100%;
  padding: 9px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #4f46e5;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EmailButton = styled.button`
  width: 100%;
  padding: 6px 16px;
  background: #f9fafb;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

interface ForgotPasswordProps {
  onBack: () => void;
  onHelp: () => void;
}

export function ForgotPassword({
  onBack,
}: ForgotPasswordProps) {
  const { deployment } = useDeployment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authSettings = deployment?.auth_settings;
  const enabledSocialsProviders =
    deployment?.social_connections.filter((conn) => conn.enabled) || [];

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setIsSubmitting(false);
  };

  return (
    <TypographyProvider>
      <Container>
        <Header>
          <BackButton onClick={onBack}>
            <ArrowLeft size={16} />
          </BackButton>
          <Title>Forgot Password?</Title>
        </Header>

        <ResetButton onClick={handleResetPassword} disabled={isSubmitting}>
          Reset your password
        </ResetButton>

        <Divider>
          <DividerText>Or, sign in with another method</DividerText>
        </Divider>

        {enabledSocialsProviders.length > 0 && (
          <SocialAuthButtons
            connections={enabledSocialsProviders}
            callback={(connection) => {
              console.log(connection);
            }}
          />
        )}

        {authSettings?.email_address.required && (
          <div>
            <EmailButton>Get a magic on your email</EmailButton>
            <EmailButton>Login with email code</EmailButton>
          </div>
        )}
      </Container>
    </TypographyProvider>
  );
}
