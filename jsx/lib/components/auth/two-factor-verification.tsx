import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";
import { Input } from "@/components/utility/input";
import { Form, FormGroup, Label } from "../utility/form";
import { Button } from "@/components/utility";
import { AuthFormImage } from "./auth-image";
import { useDeployment } from "@/hooks/use-deployment";
import { NavigationLink } from "../utility/navigation";
import {
  TwoFactorMethodSelector,
  type TwoFactorMethod,
} from "./two-factor-method-selector";
import { PhoneVerification } from "./phone-verification";
import { ShieldIcon } from "../icons/shield";
import { SmartphoneIcon } from "../icons/smartphone";
import { KeyIcon } from "../icons/key";
import { ProfileCompletionProps } from "@wacht/types";
import { useNavigation } from "@/hooks";
import { Loader2 } from "lucide-react";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-2xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  svg {
    animation: ${spin} 1s linear infinite;
    color: var(--color-primary);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-md);
  font-weight: 400;
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

const Footer = styled.div`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
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

const CodeInput = styled(Input)`
  padding: var(--space-sm) var(--space-md);
`;

export function TwoFactorVerification({
  onBack,
  attempt,
  completeVerification,
  prepareVerification,
}: Omit<ProfileCompletionProps, "completeProfile">) {
  const { deployment } = useDeployment();
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(true);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { navigate } = useNavigation();

  const available2FAMethods = attempt?.available_2fa_methods || [];

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
  ].filter((method) => method.available);

  const handleMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    setShowMethodSelector(false);

    if (methodId === "phone_otp") {
      setShowPhoneVerification(true);
    }
  };

  const handlePhoneVerification = async (lastFourDigits: string) => {
    if (!attempt) return;

    setIsSubmitting(true);
    try {
      const response = await prepareVerification({
        strategy: "phone_otp",
        lastDigits: lastFourDigits,
      });

      if (response && "data" in response && response.data?.otp_sent) {
        if (response.data?.masked_phone) {
          setMaskedPhone(response.data.masked_phone);
        }
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

  const handleSubmit = async (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault();
    if (isSubmitting) return;

    const codeToVerify = codeOverride || verificationCode;
    const newErrors: Record<string, string> = {};

    if (!codeToVerify) {
      newErrors.code = "Verification code is required";
    } else if (
      selectedMethod === "authenticator" &&
      codeToVerify.length !== 6
    ) {
      newErrors.code = "Authentication code must be 6 digits";
    } else if (
      selectedMethod === "phone_otp" &&
      codeToVerify.length !== 6
    ) {
      newErrors.code = "SMS code must be 6 digits";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await completeVerification(codeToVerify);
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (selectedMethod !== "backup_code") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setVerificationCode(value);
    setErrors((prev) => ({ ...prev, code: "" }));
  };

  useEffect(() => {
    if (attempt.completed) {
      setIsRedirecting(true);
      let redirectUri: string | null = new URLSearchParams(
        window.location.search,
      ).get("redirect_uri");

      if (!redirectUri) {
        redirectUri =
          deployment?.ui_settings?.after_signin_redirect_url || null;
      }

      if (!redirectUri && deployment?.frontend_host) {
        redirectUri = `https://${deployment.frontend_host}`;
      }

      if (redirectUri) {
        let uri: URL;
        try {
          uri = new URL(redirectUri);
        } catch {
          uri = new URL(redirectUri, window.location.origin);
        }

        if (deployment?.mode === "staging") {
          uri.searchParams.set(
            "__dev_session__",
            localStorage.getItem("__dev_session__") || "",
          );
        }

        navigate(uri.toString());
      }
      return;
    }
  }, [attempt, deployment]);

  if (isRedirecting) {
    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />
          <LoadingContainer>
            <Loader2 size={32} />
          </LoadingContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (showMethodSelector) {
    if (availableMethods.length === 0) {
      return (
        <DefaultStylesProvider>
          <Container>
            <AuthFormImage />
            <Header>
              <Title>Set Up Two-Factor Authentication</Title>
              <Subtitle>
                Your account requires two-factor authentication, but you haven't
                set up any methods yet. Please contact your administrator to set
                up 2FA.
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
                  <NavigationLink
                    to={deployment?.ui_settings.support_page_url || "#"}
                  >
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

  if (showPhoneVerification && selectedMethod === "phone_otp") {
    return (
      <PhoneVerification
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

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Two-factor authentication</Title>
          <Subtitle>
            {selectedMethod === "authenticator" &&
              "Enter the 6-digit code from your authenticator app"}
            {selectedMethod === "phone_otp" &&
              `Enter the 6-digit code sent to your phone ${maskedPhone}`}
            {selectedMethod === "backup_code" &&
              "Enter one of your backup codes"}
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
                if (selectedMethod !== "backup_code") {
                  const event = new Event("submit", {
                    bubbles: true,
                    cancelable: true,
                  });
                  await handleSubmit(event as any, code);
                }
              }}
              onResend={
                selectedMethod === "phone_otp"
                  ? async () => {
                    try {
                      await prepareVerification({
                        strategy: "phone_otp",
                        lastDigits: maskedPhone.slice(-4),
                      });
                    } catch (error) {
                      setErrors({ submit: (error as Error).message });
                    }
                  }
                  : undefined
              }
              error={errors.code}
              isSubmitting={isSubmitting}
            />
          )}

          <div>
            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <SubmitButton
              type="submit"
              disabled={isSubmitting || !verificationCode}
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </SubmitButton>
          </div>
        </Form>

        <Footer>
          <Link
            onClick={() => {
              setShowMethodSelector(true);
              setSelectedMethod(null);
              setVerificationCode("");
              setErrors({});
            }}
            style={{ cursor: "pointer" }}
          >
            Try another method
          </Link>
          <div style={{ marginTop: "var(--space-sm)" }}>
            Having trouble?{" "}
            <Link>
              <NavigationLink
                to={deployment?.ui_settings.support_page_url || "#"}
              >
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
