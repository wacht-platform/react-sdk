import { useEffect, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Loader2 } from "lucide-react";
import { useSignInWithStrategy } from "../../hooks/use-signin";
import type { OAuthProvider } from "../../hooks/use-signin";
import { useSession } from "../../hooks/use-session";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";

import { SocialAuthButtons } from "./social-buttons";
import { ForgotPassword } from "./forgot-password";
import { OtherSignInOptions } from "./other-signin-options";
import { TwoFactorVerification } from "./two-factor-verification";
import { ProfileCompletion } from "./profile-completion";
import { PasskeyPrompt } from "./passkey-prompt";
import {
  useSignInContext,
  SignInProvider,
} from "../../context/signin-provider";
import { NavigationLink } from "../utility/navigation";
import { Input } from "@/components/utility/input";
import { PhoneNumberInput } from "../utility/phone";
import { Form, FormGroup, Label } from "../utility/form";
import type { SignInParams } from "@/types";
import type { DeploymentSocialConnection } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { useNavigation } from "@/hooks/use-navigation";
import { Button } from "@/components/utility";
import { AuthFormImage } from "./auth-image";
import { Fingerprint } from "lucide-react";

const spin = keyframes`
  from {
  transform: rotate(0deg);
}
  to {
  transform: rotate(360deg);
}
`;

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-2xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
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
  background: var(--color-border);
}
`;

const DividerText = styled.span`
position: relative;
  background: var(--color-background);
  padding: 0 var(--space-md);
  color: var(--color-muted);
  font-size: var(--font-xs);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PasswordGroup = styled.div`
position: relative;
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
margin: 0;
  margin-top: var(--space-2xs);
`;

const SubmitButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !["$fullWidth", "$size"].includes(prop),
}) <{ $fullWidth?: boolean; $size?: "sm" | "md" | "lg" }>`
  margin-top: var(--space-md);
`;

const ButtonSpinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const PasskeyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  font-weight: 500;
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-sm);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);

  &:hover:not(:disabled) {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    color: var(--color-primary);
  }
`;

const Footer = styled.div`
  margin-top: var(--space-md);
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

const SsoErrorBanner = styled.div`
  background: var(--color-error-background, rgba(239, 68, 68, 0.1));
  border: 1px solid var(--color-error, #ef4444);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  text-align: center;
`;

const SsoErrorTitle = styled.div`
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--color-error, #ef4444);
  margin-bottom: var(--space-xs);
`;

const SsoErrorMessage = styled.div`
  font-size: var(--font-xs);
  color: var(--color-foreground);
  margin-bottom: var(--space-sm);
`;

const SsoErrorLink = styled.span`
  font-size: var(--font-xs);
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: var(--color-primary-hover);
  }
`;

export function SignInForm() {
  return (
    <SignInProvider>
      <SignInFormContent />
    </SignInProvider>
  );
}

function SignInFormContent() {
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();
  const { session, loading: sessionLoading, refetch: refetchSession, exchangeTicket } = useSession();
  const isMultiSessionEnabled =
    deployment?.auth_settings?.multi_session_support?.enabled ?? false;

  const {
    setEmail,
    otpSent,
    setOtpSent,
    showForgotPassword,
    setShowForgotPassword,
    showOtherOptions,
    setShowOtherOptions,
    enabledSocialsProviders,
    firstFactor,
    signInStep,
    setSignInStep,
  } = useSignInContext();
  const {
    loading,
    signIn,
    signinAttempt,
    discardSignInAttempt,
    setSignInAttempt,
  } = useSignInWithStrategy("generic");
  const { signIn: oauthSignIn } = useSignInWithStrategy("oauth");
  const { signIn: passkeySignIn } = useSignInWithStrategy("passkey");
  const [formData, setFormData] = useState<SignInParams>({
    email: "",
    username: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countryCode, setCountryCode] = useState<string | undefined>("US");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [pendingRedirectUri, setPendingRedirectUri] = useState<string | null>(null);

  // Check for SSO error params in URL (e.g., from JIT provisioning disabled)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (error === "access_denied" && errorDescription) {
      setSsoError(errorDescription);
      // Clear error params from URL
      urlParams.delete("error");
      urlParams.delete("error_description");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    if (
      !sessionLoading &&
      session?.active_signin &&
      !isMultiSessionEnabled &&
      !isRedirecting &&
      !showPasskeyPrompt
    ) {
      let redirectUri = new URLSearchParams(window.location.search).get(
        "redirect_uri",
      );

      if (!redirectUri) {
        redirectUri =
          deployment?.ui_settings?.after_signin_redirect_url || null;
      }

      if (!redirectUri && deployment?.frontend_host) {
        redirectUri = `https://${deployment.frontend_host}`;
      }

      const passkeySettings = deployment?.auth_settings?.passkey;
      const shouldPrompt =
        passkeySettings?.enabled &&
        passkeySettings?.prompt_registration_on_auth &&
        !session.active_signin?.user?.has_passkeys;

      if (shouldPrompt) {
        setPendingRedirectUri(redirectUri);
        setShowPasskeyPrompt(true);
      } else if (redirectUri) {
        setIsRedirecting(true);
        navigate(redirectUri);
      }
    }
  }, [
    session,
    sessionLoading,
    isMultiSessionEnabled,
    deployment,
    navigate,
    isRedirecting,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/[^0-9]/g, "");
    } else if (name === "email") {
      setEmail(value);
      value = value.toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetFormData = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      phone: "",
    });
    setErrors({});
    setCountryCode("US");
    setSignInStep("identifier");
  };

  const handleIdentify = async (email: string) => {
    if (!email) {
      setErrors({ email: "Email address is required" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await signIn.identify(email);

      if (result.strategy === "sso" && result.connection_id) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUri = searchParams.get("redirect_uri") || undefined;
        const response = await signIn.initEnterpriseSso(result.connection_id, redirectUri);
        if (response && response.sso_url) {
          setIsRedirecting(true);
          window.location.href = response.sso_url;
          return;
        }
      } else if (result.strategy === "social" && result.provider) {
        const socialConnection = enabledSocialsProviders.find(
          (conn) => conn.provider === result.provider
        );
        if (socialConnection) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectUri = searchParams.get("redirect_uri") || undefined;
          const { data } = await oauthSignIn.create({
            provider: socialConnection.provider as OAuthProvider,
            redirectUri,
          });
          if (data && typeof data === "object" && "oauth_url" in data) {
            setIsRedirecting(true);
            window.location.href = data.oauth_url as string;
            return;
          }
        } else {
          setSignInStep("password");
        }
      } else {
        setSignInStep("password");
      }
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      if (!isRedirecting) {
        setIsSubmitting(false);
      }
    }
  };

  const createSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;
    discardSignInAttempt();

    const newErrors: Record<string, string> = {};

    if (signInStep === "identifier" && firstFactor === "email_password") {
      if (!formData.email) {
        setErrors({ email: "Email address is required" });
        return;
      }
      await handleIdentify(formData.email);
      return;
    }

    if (firstFactor === "email_password") {
      if (!formData.email) {
        newErrors.email = "Email address is required";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    } else if (firstFactor === "username_password") {
      if (!formData.username) {
        newErrors.username = "Username is required";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    } else if (firstFactor === "email_otp") {
      if (!formData.email) {
        newErrors.email = "Email address is required";
      }
    } else if (firstFactor === "email_magic_link") {
      if (!formData.email) {
        newErrors.email = "Email address is required";
      }
    } else if (firstFactor === "phone_otp") {
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else {
        // Validate phone number format like in signup
        const phonePattern = /^\d{7,15}$/;
        if (!phonePattern.test(formData.phone)) {
          newErrors.phone = "Phone number must contain 7-15 digits";
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    let strategy = "";
    switch (firstFactor) {
      case "email_password":
        strategy = "plain_email";
        break;
      case "username_password":
        strategy = "plain_username";
        break;
      case "email_otp":
        strategy = "email_otp";
        break;
      case "email_magic_link":
        strategy = "magic_link";
        break;
      case "phone_otp":
        strategy = "phone_otp";
        break;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        ...formData,
        strategy,
      };

      if (firstFactor === "phone_otp" && countryCode) {
        submitData.phone_country_code = countryCode;
      }

      await signIn.create(submitData);
    } catch (err) {
      setErrors({ submit: (err as Error).message });
      setIsSubmitting(false);
    }
  };

  const completeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;

    const newErrors: Record<string, string> = {};
    if (!otpCode) {
      newErrors.otp = "OTP code is required";
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signIn.completeVerification(otpCode);
      setOtpSent(false);
      setOtpCode("");
    } catch (err) {
      setErrors({ otp: (err as Error).message || "Verification failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initSocialAuthSignIn = async (
    connection: DeploymentSocialConnection,
  ) => {
    if (loading || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUri = searchParams.get("redirect_uri") || undefined;
      const { data } = await oauthSignIn.create({
        provider: connection.provider as OAuthProvider,
        redirectUri,
      });
      if (data && typeof data === "object" && "oauth_url" in data) {
        window.location.href = data.oauth_url as string;
      }
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasskeySignIn = async () => {
    if (loading || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await passkeySignIn.create();
      if ("data" in result && result.data) {
        await refetchSession();

        let redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");
        if (!redirectUri) {
          redirectUri = deployment?.ui_settings?.after_signin_redirect_url || null;
        }
        if (!redirectUri && deployment?.frontend_host) {
          redirectUri = `https://${deployment.frontend_host}`;
        }

        setIsRedirecting(true);
        if (redirectUri) {
          navigate(redirectUri);
        }
      }
    } catch (err) {
      setErrors({ submit: (err as Error).message || "Passkey sign-in failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketExchangeInitiatedRef = useRef(false);

  useEffect(() => {
    if (sessionLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const ticket = urlParams.get("ticket");

    // Handle session ticket exchange for impersonation
    if (ticket && !ticketExchangeInitiatedRef.current && !loading) {
      ticketExchangeInitiatedRef.current = true;

      urlParams.delete("ticket");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      const handleTicketExchange = async () => {
        try {
          setIsSubmitting(true);
          await exchangeTicket(ticket);
          setIsRedirecting(true);
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
        } catch (err) {
          setErrors({ submit: (err as Error).message || "Failed to exchange ticket" });
          ticketExchangeInitiatedRef.current = false;
        } finally {
          setIsSubmitting(false);
        }
      };

      handleTicketExchange();
      return;
    }

    const attemptId = urlParams.get("signin_attempt_id");

    if (attemptId && session?.signin_attempts && !signinAttempt) {
      const attempt = session.signin_attempts.find((a) => a.id === attemptId);
      if (attempt) {
        setSignInAttempt(attempt);

        urlParams.delete("signin_attempt_id");
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()} `
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [session, sessionLoading, signinAttempt, setSignInAttempt, loading]);

  useEffect(() => {
    if (!signinAttempt) return;

    if (signinAttempt.completed) {
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

    if (!signIn || otpSent) return;

    const strategyMap: Record<
      string,
      "phone_otp" | "email_otp" | "magic_link"
    > = {
      verify_email: "email_otp",
      verify_email_otp: "email_otp",
      verify_email_link: "magic_link",
      verify_phone: "phone_otp",
      verify_phone_otp: "phone_otp",
    };

    const strategy = strategyMap[signinAttempt.current_step];
    if (!strategy) return;

    const prepareVerificationAsync = async () => {
      try {
        await signIn.prepareVerification({ strategy });
        setOtpSent(true);
      } catch (err) {
        console.error("Failed to prepare verification:", err);
        setErrors({ submit: "Failed to send verification. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    };

    prepareVerificationAsync();
  }, [signinAttempt, signIn, otpSent, setOtpSent, navigate, deployment]);

  useEffect(() => {
    // Error handling logic moved to try/catch blocks
  }, []);

  if (showOtherOptions) {
    return <OtherSignInOptions onBack={() => setShowOtherOptions(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  if (signinAttempt?.current_step === "verify_second_factor") {
    return (
      <TwoFactorVerification
        attempt={signinAttempt}
        completeVerification={signIn.completeVerification}
        prepareVerification={signIn.prepareVerification}
        onBack={() => {
          discardSignInAttempt();
          resetFormData();
          setOtpSent(false);
        }}
      />
    );
  }

  if (signinAttempt?.current_step === "complete_profile") {
    return (
      <ProfileCompletion
        attempt={signinAttempt}
        completeProfile={signIn.completeProfile}
        completeVerification={signIn.completeVerification}
        prepareVerification={signIn.prepareVerification}
        onBack={() => {
          discardSignInAttempt();
          resetFormData();
          setOtpSent(false);
        }}
      />
    );
  }

  if (showPasskeyPrompt) {
    const handlePasskeyComplete = () => {
      setShowPasskeyPrompt(false);
      if (pendingRedirectUri) {
        setIsRedirecting(true);
        navigate(pendingRedirectUri);
      }
    };

    const handlePasskeySkip = () => {
      setShowPasskeyPrompt(false);
      if (pendingRedirectUri) {
        setIsRedirecting(true);
        navigate(pendingRedirectUri);
      }
    };

    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />
          <PasskeyPrompt onComplete={handlePasskeyComplete} onSkip={handlePasskeySkip} />
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (sessionLoading) {
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

  const isVerificationStep =
    signinAttempt?.current_step &&
    [
      "verify_email",
      "verify_email_otp",
      "verify_email_link",
      "verify_phone",
      "verify_phone_otp",
    ].includes(signinAttempt.current_step);

  const showOtpForm = isVerificationStep && otpSent;

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        {showOtpForm ? (
          <>
            <Header>
              <Title>
                {firstFactor === "phone_otp"
                  ? "Check your phone"
                  : "Check your email"}
              </Title>
              <Subtitle>
                {firstFactor === "email_magic_link"
                  ? `If ${formData.email} exists in our records, you will receive a magic link. Click the link to sign in.`
                  : firstFactor === "phone_otp"
                    ? `If ${formData.phone} exists in our records, you will receive a verification code via SMS. Enter it below to continue.`
                    : `If ${formData.email} exists in our records, you will receive a verification code. Enter it below to continue.`}
              </Subtitle>
            </Header>
          </>
        ) : (
          <Header>
            <Title>Sign in to your account</Title>
            <Subtitle>
              Please enter your details to continue to{" "}
              {deployment?.ui_settings.app_name || "App"}!
            </Subtitle>
          </Header>
        )}

        {/* SSO Error Banner */}
        {ssoError && (
          <SsoErrorBanner>
            <SsoErrorTitle>Access Denied</SsoErrorTitle>
            <SsoErrorMessage>{ssoError}</SsoErrorMessage>
            <SsoErrorLink onClick={() => setSsoError(null)}>
              Try again
            </SsoErrorLink>
          </SsoErrorBanner>
        )}

        {!showOtpForm ? (
          <>
            {enabledSocialsProviders.length > 0 && (
              <>
                <SocialAuthButtons
                  connections={enabledSocialsProviders}
                  callback={initSocialAuthSignIn}
                />
              </>
            )}

            {/* Passkey Sign In */}
            {deployment?.auth_settings?.passkey?.enabled && (
              <PasskeyButton
                type="button"
                onClick={handlePasskeySignIn}
                disabled={isSubmitting}
              >
                <Fingerprint size={16} />
                Sign in with Passkey
              </PasskeyButton>
            )}

            {(enabledSocialsProviders.length > 0 || deployment?.auth_settings?.passkey?.enabled) && (
              <Divider>
                <DividerText>or</DividerText>
              </Divider>
            )}

            <Form onSubmit={createSignIn} noValidate>
              {(firstFactor === "email_password" ||
                firstFactor === "email_otp" ||
                firstFactor === "email_magic_link") &&
                deployment?.auth_settings?.email_address?.enabled && (
                  <FormGroup>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <ErrorMessage>{errors.email}</ErrorMessage>
                    )}
                  </FormGroup>
                )}

              {firstFactor === "username_password" &&
                deployment?.auth_settings?.username?.enabled && (
                  <FormGroup>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                      aria-invalid={!!errors.username}
                    />
                    {errors.username && (
                      <ErrorMessage>{errors.username}</ErrorMessage>
                    )}
                  </FormGroup>
                )}

              {firstFactor === "phone_otp" &&
                deployment?.auth_settings?.phone_number?.enabled && (
                  <FormGroup>
                    <Label htmlFor="phone">Phone number</Label>
                    <PhoneNumberInput
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      countryCode={countryCode}
                      setCountryCode={setCountryCode}
                    />
                    {errors.phone && (
                      <ErrorMessage>{errors.phone}</ErrorMessage>
                    )}
                  </FormGroup>
                )}

              {signInStep === "password" &&
                (firstFactor === "email_password" ||
                  firstFactor === "username_password") &&
                deployment?.auth_settings?.password?.enabled && (
                  <FormGroup>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Label htmlFor="password">Password</Label>
                      <Link
                        style={{ fontSize: "12px" }}
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <PasswordGroup>
                      <Input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        aria-invalid={!!errors.password}
                      />
                    </PasswordGroup>
                    {errors.password && (
                      <ErrorMessage>{errors.password}</ErrorMessage>
                    )}
                  </FormGroup>
                )}

              <div>
                {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

                <SubmitButton type="submit" $fullWidth $size="sm" disabled={isSubmitting || loading}>
                  {isSubmitting ? (
                    <ButtonSpinner size={16} />
                  ) : (
                    signInStep === "identifier" ? "Continue" : "Sign in"
                  )}
                </SubmitButton>
              </div>

              <Link
                style={{ fontSize: "12px", textAlign: "center" }}
                onClick={() => setShowOtherOptions(true)}
              >
                Use other methods
              </Link>
            </Form>
            <Footer>
              Don't have an account?{" "}
              <Link>
                <NavigationLink
                  to={`${deployment!.ui_settings?.sign_up_page_url}${window.location.search}`}
                >
                  Sign up
                </NavigationLink>
              </Link>
            </Footer>
          </>
        ) : firstFactor === "email_magic_link" ? (
          <Footer>
            Having trouble?{" "}
            <Link>
              <NavigationLink to={deployment!.ui_settings.support_page_url}>
                Get help
              </NavigationLink>
            </Link>
            <div style={{ marginTop: "var(--space-sm)" }}>
              <Link
                onClick={() => {
                  setOtpSent(false);
                  discardSignInAttempt();
                  resetFormData();
                }}
                style={{ cursor: "pointer" }}
              >
                Back to login
              </Link>
            </div>
          </Footer>
        ) : (
          <>
            <Form
              style={{ gap: "15px" }}
              onSubmit={completeVerification}
              noValidate
            >
              <OTPInput
                onComplete={async (code) => {
                  setOtpCode(code);
                  if (code && code.length === 6) {
                    setIsSubmitting(true);
                    setErrors({});
                    try {
                      await signIn.completeVerification(code);
                      // Clear OTP state after successful verification
                      // This allows the component to transition to the next step
                      setOtpSent(false);
                    } catch (err) {
                      setErrors({
                        otp: (err as Error).message || "Verification failed",
                      });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }}
                onResend={async () => {
                  const strategy =
                    firstFactor === "email_otp" ? "email_otp" : "phone_otp";
                  await signIn.prepareVerification({ strategy });
                }}
                error={errors.otp}
                isSubmitting={isSubmitting}
              />

              <SubmitButton
                type="submit"
                $fullWidth
                $size="sm"
                disabled={isSubmitting || loading || !otpCode}
                style={{ margin: 0 }}
              >
                {isSubmitting
                  ? "Verifying..."
                  : `Continue to ${deployment?.ui_settings?.app_name}`}
              </SubmitButton>
            </Form>
            <Footer>
              Having trouble?{" "}
              <Link>
                <NavigationLink to={deployment!.ui_settings.support_page_url}>
                  Get help
                </NavigationLink>
              </Link>
              <div style={{ marginTop: "var(--space-sm)" }}>
                <Link
                  onClick={() => {
                    setOtpSent(false);
                    discardSignInAttempt();
                    resetFormData();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Back to login
                </Link>
              </div>
            </Footer>
          </>
        )}
      </Container>
    </DefaultStylesProvider>
  );
}
