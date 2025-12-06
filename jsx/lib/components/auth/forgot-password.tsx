import { useState } from "react";
import styled from "styled-components";
import { Button, Input, FormGroup, Label, Form } from "../utility";
import { OTPInput } from "../utility/otp-input";
import {
  useForgotPassword,
} from "../../hooks/use-forgot-password";
import { OtherAuthOptions } from "./other-auth-options";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "./auth-image";
import { useDeployment } from "@/hooks/use-deployment";
import { useNavigation } from "@/hooks/use-navigation";

interface ForgotPasswordProps {
  onBack: () => void;
}

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
`;

const Title = styled.h1`
  font-size: var(--font-lg);
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
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();
  const [step, setStep] = useState<"start" | "email" | "otp" | "reset">(
    "start"
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    forgotPassword,
    verifyOtp,
    resetPassword,
  } = useForgotPassword();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setStep("otp");
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtp(email, otp);
      if (result.data) {
        setToken(result.data.token);
        setStep("reset");
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    if (password.length < 8) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassword(token, password);
      if (result.data) {
        const session = result.data;
        // Check for incomplete sign-in attempts (e.g. 2FA)
        // We take the last attempt as it is the one created by the password reset
        const incompleteAttempt =
          session.signin_attempts && session.signin_attempts.length > 0
            ? session.signin_attempts[session.signin_attempts.length - 1]
            : null;

        if (incompleteAttempt && !incompleteAttempt.completed) {
          const signinUrl = deployment?.ui_settings?.sign_in_page_url;
          if (signinUrl) {
            const url = new URL(signinUrl, window.location.origin);
            url.searchParams.set("signin_attempt_id", incompleteAttempt.id);
            navigate(url.toString());
          } else {
            // Fallback if no sign-in URL is configured
            onBack();
          }
        } else {
          // Auto-login successful
          const redirectUrl =
            deployment?.ui_settings?.after_signin_redirect_url || "/";
          navigate(redirectUrl);
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const renderInitialView = () => (
    <>
      <AuthFormImage />

      <Header>
        <Title>Forgot Password</Title>
      </Header>

      <ResetButton
        onClick={() => setStep("email")}
        disabled={loading}
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
            <AuthFormImage />

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
              {error && (
                <ErrorMessage>{error.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={loading}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {loading ? "Sending..." : "Send Code"}
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
            <AuthFormImage />

            <Header>
              <Title>Enter Verification Code</Title>
              <Message>
                We've sent a 6-digit code to {email}. Please enter it below.
              </Message>
            </Header>
            <Form onSubmit={handleOtpSubmit} noValidate>
              <OTPInput
                onComplete={(code) => setOtp(code)}
                isSubmitting={loading}
                error={error?.message}
                onResend={async () => {
                  await forgotPassword(email);
                }}
              />
              {error && (
                <ErrorMessage>{error.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {loading ? "Verifying..." : "Verify"}
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
            <AuthFormImage />

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
              {error && (
                <ErrorMessage>{error.message}</ErrorMessage>
              )}
              <Button
                type="submit"
                disabled={loading}
                style={{ width: "100%", marginTop: "var(--space-md)" }}
              >
                {loading ? "Resetting..." : "Reset Password"}
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
