import { useEffect, useState } from "react";
import styled from "styled-components";
import { useSignInWithStrategy } from "../../hooks/use-signin";
import type { OAuthProvider } from "../../hooks/use-signin";
import { SignInStrategy } from "../../hooks/use-signin";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";

import { SocialAuthButtons } from "./social-buttons";
import { ForgotPassword } from "./forgot-password";
import { OtherSignInOptions } from "./other-signin-options";
import {
  useSignInContext,
  SignInProvider,
} from "../../context/signin-provider";
import { NavigationLink } from "../utility/navigation";
import { Input } from "@/components/utility/input";
import { PhoneNumberInput } from "../utility/phone";
import { Form, FormGroup, Label } from "../utility/form";
import { ErrorCode } from "@/types/client";
import type { SignInParams } from "@/types/auth";
import type { DeploymentSocialConnection } from "@/types/deployment";
import { useDeployment } from "@/hooks/use-deployment";
import { Button } from "@/components/utility";
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

const PasswordGroup = styled.div`
  position: relative;
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

export function SignInForm() {
  return (
    <SignInProvider>
      <SignInFormContent />
    </SignInProvider>
  );
}

function SignInFormContent() {
  const { deployment } = useDeployment();
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
  } = useSignInContext();
  const {
    loading,
    signIn,
    signinAttempt,
    discardSignInAttempt,
    errors: signInErrors,
  } = useSignInWithStrategy(SignInStrategy.Generic);
  const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      // Format phone number like in signup
      value = value.replace(/[^0-9-]/g, "");
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
  };

  const createSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;

    const newErrors: Record<string, string> = {};

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
      if (otpSent && !otpCode) {
        newErrors.otp = "OTP code is required";
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
      if (otpSent && !otpCode) {
        newErrors.otp = "OTP code is required";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Determine strategy based on firstFactor
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
      await signIn.create({
        ...formData,
        strategy,
      });
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;
    setIsSubmitting(true);
    const newErrors: Record<string, string> = {};
    if (!otpCode) {
      newErrors.otp = "OTP code is required";
    }
    setErrors(newErrors);
    signIn.completeVerification(otpCode);
    setIsSubmitting(false);
  };

  const initSocialAuthSignIn = async (
    connection: DeploymentSocialConnection
  ) => {
    if (loading || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await oauthSignIn.create({
        provider: connection.provider as OAuthProvider,
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

  useEffect(() => {
    if (!signIn || !signinAttempt) return;

    if (otpSent) {
      return;
    }

    if (signinAttempt.completed) {
      let redirectUri = new URLSearchParams(window.location.search).get(
        "redirect_uri"
      );

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

    switch (signinAttempt.current_step) {
      case "verify_email":
      case "verify_email_otp":
      case "verify_email_link":
        const strategy =
          firstFactor === "email_magic_link" ? "magic_link" : "email_otp";
        signIn.prepareVerification(strategy);
        break;
      case "verify_phone":
      case "verify_phone_otp":
        signIn.prepareVerification("phone_otp");
        break;
    }

    setOtpSent(true);
  }, [signinAttempt, signIn, otpSent, setOtpSent]);

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (signInErrors?.errors) {
      if (Array.isArray(signInErrors?.errors)) {
        for (const err of signInErrors.errors) {
          if (
            [
              ErrorCode.InvalidCredentials,
              ErrorCode.UserNotFound,
              ErrorCode.UserAlreadySignedIn,
              ErrorCode.Internal,
              ErrorCode.UserDisabled,
            ].includes(err.code)
          ) {
            newErrors.submit = err.message;
          }
        }
      }
    }

    setErrors(newErrors);
  }, [signInErrors]);

  if (showOtherOptions) {
    return <OtherSignInOptions onBack={() => setShowOtherOptions(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  if (signinAttempt?.requires_completion) {
    // Redirect to profile completion
    const redirectUri = new URLSearchParams(window.location.search).get("redirect_uri") ||
                       window.location.origin;

    // Use the utility function for consistent redirect behavior
    const url = `/profile-completion?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
    return null;
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        {otpSent ? (
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

        {!otpSent ? (
          <>
            {enabledSocialsProviders.length > 0 && (
              <>
                <SocialAuthButtons
                  connections={enabledSocialsProviders}
                  callback={initSocialAuthSignIn}
                />

                <Divider>
                  <DividerText>or</DividerText>
                </Divider>
              </>
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

              {(firstFactor === "email_password" ||
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

                <SubmitButton type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting ? "Signing in..." : "Sign in"}
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
                <NavigationLink to={deployment!.ui_settings.sign_up_page_url}>
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
                }}
                onResend={async () => {
                  const strategy =
                    firstFactor === "email_otp" ? "email_otp" : "phone_otp";
                  await signIn.prepareVerification(strategy);
                }}
                error={errors.otp}
                isSubmitting={isSubmitting}
              />

              <SubmitButton
                type="submit"
                disabled={isSubmitting || loading || !otpCode}
              >
                {isSubmitting ? "Verifying..." : "Continue to Wacht"}
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
