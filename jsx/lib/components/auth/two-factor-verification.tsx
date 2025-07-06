import { useEffect, useState } from "react";
import styled from "styled-components";
import { useSignIn } from "../../hooks/use-signin";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";
import { Input } from "@/components/utility/input";
import { Form, FormGroup, Label } from "../utility/form";
import { Button } from "@/components/utility";
import { AuthFormImage } from "./auth-image";
import { useDeployment } from "@/hooks/use-deployment";
import { NavigationLink } from "../utility/navigation";
import { TwoFactorMethodSelector, type TwoFactorMethod } from "./two-factor-method-selector";
import { PhoneVerification } from "./phone-verification";
import { ShieldIcon } from "../icons/shield";
import { SmartphoneIcon } from "../icons/smartphone";
import { KeyIcon } from "../icons/key";

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
`;

const Footer = styled.p`
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

const CodeInput = styled(Input)`
  text-align: center;
  font-size: var(--font-lg);
  letter-spacing: 0.5em;
  font-family: monospace;
`;

interface TwoFactorVerificationProps {
  onBack?: () => void;
}

export function TwoFactorVerification({ onBack }: TwoFactorVerificationProps) {
  const { deployment } = useDeployment();
  const { loading, signIn, signinAttempt, errors: signInErrors } = useSignIn();
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(true);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");

  // Determine available 2FA methods from signin attempt
  const available2FAMethods = signinAttempt?.available_2fa_methods || [];
  
  const availableMethods: TwoFactorMethod[] = [
    {
      id: "authenticator",
      name: "Authenticator app",
      description: "Use your authenticator app",
      icon: <ShieldIcon />,
      available: available2FAMethods.includes("authenticator"),
    },
    {
      id: "phone_otp",
      name: "Text message",
      description: "Get a code via SMS",
      icon: <SmartphoneIcon />,
      available: available2FAMethods.includes("phone_otp"),
      phoneNumber: maskedPhone,
    },
    {
      id: "backup_code",
      name: "Backup code",
      description: "Use one of your backup codes",
      icon: <KeyIcon />,
      available: available2FAMethods.includes("backup_code"),
    },
  ].filter(method => method.available);

  const handleMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    setShowMethodSelector(false);

    if (methodId === "phone_otp" && signIn) {
      // Request phone verification
      setIsSubmitting(true);
      try {
        const response = await signIn.prepareVerification("phone_otp");
        if (response && "data" in response && response.data?.masked_phone) {
          setMaskedPhone(response.data.masked_phone);
          setShowPhoneVerification(true);
        }
      } catch (err) {
        setErrors({ submit: (err as Error).message });
        setShowMethodSelector(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePhoneVerification = async (lastFourDigits: string) => {
    if (!signIn || !signinAttempt) return;
    
    setIsSubmitting(true);
    try {
      // Call prepareVerification again with last_digits parameter
      const response = await signIn.prepareVerification("phone_otp", lastFourDigits);
      
      if (response && "data" in response && response.data?.otp_sent) {
        setShowPhoneVerification(false);
      } else {
        setErrors({ phone: "Phone number verification failed" });
      }
    } catch (err) {
      setErrors({ phone: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting || !signIn) return;

    const newErrors: Record<string, string> = {};
    
    if (!verificationCode) {
      newErrors.code = "Verification code is required";
    } else if (selectedMethod === "authenticator" && verificationCode.length !== 6) {
      newErrors.code = "Authentication code must be 6 digits";
    } else if (selectedMethod === "phone_otp" && verificationCode.length !== 6) {
      newErrors.code = "SMS code must be 6 digits";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn.completeVerification(verificationCode);
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    setErrors((prev) => ({ ...prev, code: "" }));
  };

  useEffect(() => {
    if (signInErrors?.errors) {
      const newErrors: Record<string, string> = {};
      if (Array.isArray(signInErrors.errors)) {
        for (const err of signInErrors.errors) {
          newErrors.submit = err.message;
        }
      }
      setErrors(newErrors);
    }
  }, [signInErrors]);

  useEffect(() => {
    // Check if sign-in is completed after verification
    if (signinAttempt?.completed) {
      let redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");

      if (!redirectUri) {
        redirectUri = "https://" + window.location.hostname;
      }

      const uri = new URL(redirectUri);

      if (deployment?.mode === "staging") {
        uri.searchParams.set(
          "dev_session",
          localStorage.getItem("__dev_session__") ?? ""
        );
      }

      window.location.href = uri.toString();
    }
  }, [signinAttempt, deployment]);

  // Show method selector
  if (showMethodSelector) {
    // If no methods available, show setup prompt
    if (availableMethods.length === 0) {
      return (
        <DefaultStylesProvider>
          <Container>
            <AuthFormImage />
            <Header>
              <Title>Set Up Two-Factor Authentication</Title>
              <Subtitle>
                Your account requires two-factor authentication, but you haven't set up any methods yet.
                Please contact your administrator to set up 2FA.
              </Subtitle>
            </Header>
            <Footer>
              {onBack && (
                <div>
                  <Link onClick={onBack} style={{ cursor: "pointer" }}>
                    Back to login
                  </Link>
                </div>
              )}
              <div style={{ marginTop: "var(--space-sm)" }}>
                Having trouble?{" "}
                <Link>
                  <NavigationLink to={deployment?.ui_settings.support_page_url || "#"}>
                    Get help
                  </NavigationLink>
                </Link>
              </div>
            </Footer>
          </Container>
        </DefaultStylesProvider>
      );
    }
    
    return (
      <TwoFactorMethodSelector
        methods={availableMethods}
        onSelectMethod={handleMethodSelect}
        onBack={onBack}
      />
    );
  }

  // Show phone verification
  if (showPhoneVerification && selectedMethod === "phone_otp") {
    return (
      <PhoneVerification
        maskedPhoneNumber={maskedPhone}
        onVerify={handlePhoneVerification}
        onBack={() => {
          setShowPhoneVerification(false);
          setShowMethodSelector(true);
          setSelectedMethod(null);
        }}
        loading={isSubmitting}
      />
    );
  }

  // Show verification form
  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Two-factor authentication</Title>
          <Subtitle>
            {selectedMethod === "authenticator" && "Enter the 6-digit code from your authenticator app"}
            {selectedMethod === "phone_otp" && "Enter the 6-digit code sent to your phone"}
            {selectedMethod === "backup_code" && "Enter one of your backup codes"}
          </Subtitle>
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          {selectedMethod === "backup_code" ? (
            <FormGroup>
              <Label htmlFor="code">Backup code</Label>
              <CodeInput
                type="text"
                id="code"
                name="code"
                value={verificationCode}
                onChange={handleInputChange}
                placeholder="Enter backup code"
                maxLength={20}
                autoComplete="one-time-code"
                aria-invalid={!!errors.code}
                autoFocus
              />
              {errors.code && <ErrorMessage>{errors.code}</ErrorMessage>}
            </FormGroup>
          ) : (
            <OTPInput
              onComplete={async (code) => {
                setVerificationCode(code);
                // Auto-submit when OTP is complete for non-backup codes
                if (selectedMethod !== "backup_code") {
                  const event = new Event('submit', { bubbles: true, cancelable: true });
                  await handleSubmit(event as any);
                }
              }}
              onResend={selectedMethod === "phone_otp" ? async () => {
                if (signIn) {
                  await signIn.prepareVerification("phone_otp");
                }
              } : undefined}
              error={errors.code || errors.submit}
              isSubmitting={isSubmitting}
            />
          )}

          <div>
            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <SubmitButton type="submit" disabled={isSubmitting || loading || !verificationCode}>
              {isSubmitting ? "Verifying..." : "Verify"}
            </SubmitButton>
          </div>
        </Form>

        <Footer>
          <Link onClick={() => {
            setShowMethodSelector(true);
            setSelectedMethod(null);
            setVerificationCode("");
            setErrors({});
          }} style={{ cursor: "pointer" }}>
            Try another method
          </Link>
          <div style={{ marginTop: "var(--space-sm)" }}>
            Having trouble?{" "}
            <Link>
              <NavigationLink to={deployment?.ui_settings.support_page_url || "#"}>
                Get help
              </NavigationLink>
            </Link>
          </div>
          {onBack && (
            <div style={{ marginTop: "var(--space-sm)" }}>
              <Link onClick={onBack} style={{ cursor: "pointer" }}>
                Back to login
              </Link>
            </div>
          )}
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}