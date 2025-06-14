import { useState } from "react";
import styled from "styled-components";
import { Button, Input, FormGroup, Label, Form } from "../utility";
import { OTPInput } from "../utility/otp-input";
import {
  useForgotPassword,
  useResetPassword,
} from "../../hooks/use-forgot-password";
import { OtherAuthOptions } from "./other-auth-options";
import { DefaultStylesProvider } from "../utility/root";

interface ForgotPasswordProps {
  onBack: () => void;
}

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
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-xs) 0;
`;

const Message = styled.p`
  font-size: var(--font-sm);
  color: var(--color-muted);
  margin: 0;
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
`;

const ResetButton = styled(Button)`
  width: 100%;
  margin-bottom: var(--space-lg);
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--space-lg) 0;
  color: var(--color-muted);
  font-size: var(--font-xs);

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--color-border);
  }

  &::before {
    margin-right: var(--space-sm);
  }

  &::after {
    margin-left: var(--space-sm);
  }
`;

const DividerText = styled.span`
  white-space: nowrap;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-lg);
`;

const FooterText = styled.p`
  font-size: var(--font-sm);
  color: var(--color-muted);
  margin: 0;
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<"start" | "email" | "otp" | "reset">(
    "start"
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    forgotPassword,
    loading: forgotPasswordLoading,
    error: forgotPasswordError,
  } = useForgotPassword();
  const {
    resetPassword,
    loading: resetPasswordLoading,
    error: resetPasswordError,
  } = useResetPassword();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }
    const result = await forgotPassword(email);
    if (!result.errors) {
      setStep("otp");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return;
    }
    setStep("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    if (password.length < 8) {
      return;
    }
    const result = await resetPassword(email, otp, password);
    if (!result.errors) {
      onBack(); // Go back to sign in form
    }
  };

  const renderInitialView = () => (
    <>
      <Header>
        <Title>Forgot Password</Title>
      </Header>

      <ResetButton
        onClick={() => setStep("email")}
        disabled={forgotPasswordLoading}
      >
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
            Back to login
          </Link>
        </FooterText>
      </Footer>
    </>
  );

  return (
    <DefaultStylesProvider>
      <Container>
        {step === "start" && renderInitialView()}

        {step === "email" && (
          <>
            <Header>
              <Title>Forgot Password</Title>
              <Message>
                Enter your email address and we'll send you a code to reset your
                password.
              </Message>
            </Header>
            <Form onSubmit={handleEmailSubmit} noValidate>
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </FormGroup>
              {forgotPasswordError && (
                <ErrorMessage>{forgotPasswordError.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={forgotPasswordLoading}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {forgotPasswordLoading ? "Sending..." : "Send Code"}
              </Button>
            </Form>
            <Footer>
              <FooterText style={{ marginTop: "var(--space-sm)" }}>
                <Link onClick={onBack} style={{ cursor: "pointer" }}>
                  Back to login
                </Link>
              </FooterText>
            </Footer>
          </>
        )}

        {step === "otp" && (
          <>
            <Header>
              <Title>Enter Verification Code</Title>
              <Message>
                We've sent a 6-digit code to {email}. Please enter it below.
              </Message>
            </Header>
            <Form onSubmit={handleOtpSubmit} noValidate>
              <OTPInput
                onComplete={(code) => setOtp(code)}
                isSubmitting={resetPasswordLoading}
                error={resetPasswordError?.message}
                onResend={async () => {
                  await forgotPassword(email);
                }}
              />
              {resetPasswordError && (
                <ErrorMessage>{resetPasswordError.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={resetPasswordLoading || otp.length !== 6}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {resetPasswordLoading ? "Verifying..." : "Verify"}
              </Button>
            </Form>
            <Footer>
              <FooterText style={{ marginTop: "var(--space-sm)" }}>
                <Link onClick={onBack} style={{ cursor: "pointer" }}>
                  Back to login
                </Link>
              </FooterText>
            </Footer>
          </>
        )}

        {step === "reset" && (
          <>
            <Header>
              <Title>Reset Password</Title>
              <Message>Create a new password for your account.</Message>
            </Header>
            <Form onSubmit={handleResetSubmit} noValidate>
              <FormGroup>
                <Label htmlFor="password">New Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </FormGroup>
              {resetPasswordError && (
                <ErrorMessage>{resetPasswordError.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={resetPasswordLoading}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {resetPasswordLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </Form>
            <Footer>
              <FooterText style={{ marginTop: "var(--space-sm)" }}>
                <Link onClick={onBack} style={{ cursor: "pointer" }}>
                  Back to login
                </Link>
              </FooterText>
            </Footer>
          </>
        )}
      </Container>
    </DefaultStylesProvider>
  );
}
