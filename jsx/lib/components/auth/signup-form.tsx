import { useState, useEffect } from "react";
import styled from "styled-components";
import { useSignUp } from "../../hooks/use-signup";
import {
  useSignInWithStrategy,
  SignInStrategy,
  type OAuthProvider,
} from "../../hooks/use-signin";
import { useDeployment } from "../../hooks/use-deployment";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";

import { SocialAuthButtons } from "./social-buttons";
import { NavigationLink } from "../utility/navigation";
import { Input } from "../utility/input";
import { PhoneNumberInput } from "../utility/phone";
import type { SignUpParams } from "@/types";
import type { DeploymentSocialConnection } from "@/types";
import { AuthFormImage } from "./auth-image";

const breakpoints = {
  sm: "36rem",
  md: "48rem",
  lg: "62rem",
  xl: "75rem",
};

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);

  @media (max-width: ${breakpoints.sm}) {
    max-width: 100%;
    padding: var(--space-lg);
    border-radius: 0;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;

  @media (max-width: ${breakpoints.sm}) {
    margin-bottom: var(--space-md);
  }
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;

  @media (max-width: ${breakpoints.sm}) {
    font-size: var(--font-md);
  }
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;

  @media (max-width: ${breakpoints.sm}) {
    font-size: var(--font-2xs);
  }
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

  @media (max-width: ${breakpoints.sm}) {
    margin: var(--space-md) 0;
  }
`;

const DividerText = styled.span`
  position: relative;
  background: var(--color-background);
  padding: 0 var(--space-sm);
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);

  @media (max-width: ${breakpoints.sm}) {
    gap: 1rem;
  }
`;

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$isBothEnabled ? "1fr 1fr" : "1fr"};
  gap: var(--space-sm);

  @media (max-width: ${breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const Label = styled.label`
  font-size: var(--font-xs);
  text-align: left;
  font-weight: 500;
  color: var(--color-foreground);

  @media (max-width: ${breakpoints.sm}) {
    font-size: 0.75rem;
  }
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

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.5625rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-xs);
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: var(--space-xs);

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: ${breakpoints.sm}) {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }
`;

const Footer = styled.p`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);

  @media (max-width: ${breakpoints.sm}) {
    margin-top: 1rem;
    font-size: 0.75rem;
  }
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

const RestrictedMessage = styled.div`
  text-align: center;
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
`;

const RestrictedText = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-sm) 0;
  line-height: 1.5;
`;

const RestrictedFooter = styled.div`
  text-align: center;
  margin-top: var(--space-lg);
`;

const RestrictedFooterText = styled.p`
  font-size: var(--font-xs);
  color: var(--color-muted);
  margin: 0;
`;

const RestrictedLink = styled.a`
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
`;

const RequiredAsterisk = styled.span`
  color: var(--color-danger);
  margin-left: 2px;
`;

export function SignUpForm() {
  const {
    loading,
    signUp,
    signupAttempt,
    discardSignupAttempt,
    errors: signUpErrors,
  } = useSignUp();
  const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
  const { deployment } = useDeployment();
  const [formData, setFormData] = useState<SignUpParams>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    username: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState(
    Intl.DateTimeFormat().resolvedOptions().locale.split("-")?.pop(),
  );

  const isSignupRestricted =
    deployment?.restrictions?.sign_up_mode === "restricted";
  const isWaitlistMode = deployment?.restrictions?.sign_up_mode === "waitlist";

  useEffect(() => {
    if (!deployment) return;

    if (isWaitlistMode) {
      const waitlistUrl =
        deployment.ui_settings?.waitlist_page_url ||
        `${deployment.frontend_host}/waitlist` ||
        "/waitlist";
      window.location.href = waitlistUrl;
      return;
    }
  }, [deployment, isWaitlistMode]);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone_number") {
      value = value.replace(/[^0-9-]/g, "");
    } else if (name === "email") {
      value = value.toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetFormData = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      username: "",
      phone_number: "",
    });
    setErrors({});
    setOtpSent(false);
    setOtpCode("");
    discardSignupAttempt();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;

    const newErrors: Record<string, string> = {};

    const namePattern = /^[a-zA-Z]{3,30}$/;
    const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phonePattern = /^\d{7,15}$/;
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$/;

    if (authSettings?.first_name.required && !formData.first_name) {
      newErrors.first_name = "First name is required";
    } else if (
      authSettings?.first_name.enabled &&
      formData.first_name &&
      !namePattern.test(formData.first_name)
    ) {
      newErrors.first_name = "Invalid name";
    }

    if (authSettings?.last_name.required && !formData.last_name) {
      newErrors.last_name = "Last name is required";
    } else if (
      authSettings?.last_name.enabled &&
      formData.last_name &&
      !namePattern.test(formData.last_name)
    ) {
      newErrors.last_name = "Invalid last name";
    }

    if (authSettings?.username.required && !formData.username) {
      newErrors.username = "Username is required";
    } else if (
      authSettings?.username.enabled &&
      formData.username &&
      !usernamePattern.test(formData.username)
    ) {
      newErrors.username = "Username must be 3-20 characters";
    }

    if (authSettings?.email_address.required && !formData.email) {
      newErrors.email = "Email address is required";
    } else if (
      authSettings?.email_address.enabled &&
      formData.email &&
      !emailPattern.test(formData.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (authSettings?.phone_number.required && !formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else if (
      authSettings?.phone_number.enabled &&
      formData.phone_number &&
      !phonePattern.test(formData.phone_number)
    ) {
      newErrors.phone_number = "Phone number must contain 7-15 digits";
    }

    if (authSettings?.password.required && !formData.password) {
      newErrors.password = "Password is required";
    } else if (authSettings?.password.enabled && !formData.password) {
      newErrors.password = "Password is required";
    } else if (
      authSettings?.password.enabled &&
      formData.password &&
      !passwordPattern.test(formData.password)
    ) {
      newErrors.password =
        "Password must be 8-125 characters and include uppercase, lowercase, number, and special character";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.phone_number) {
        formData.phone_number = `+${countryCode}${formData.phone_number}`;
      }
      await signUp.create(formData);
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (connection: DeploymentSocialConnection) => {
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

  const enabledSocialProviders =
    deployment?.social_connections.filter((conn) => conn.enabled) || [];

  const authSettings = deployment?.auth_settings;

  const isBothNamesEnabled = Boolean(
    authSettings?.first_name?.enabled && authSettings?.last_name?.enabled,
  );

  const completeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;
    setIsSubmitting(true);
    const newErrors: Record<string, string> = {};
    if (!otpCode) {
      newErrors.otp = "OTP code is required";
    }
    setErrors(newErrors);
    signUp.completeVerification(otpCode);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!signupAttempt) return;

    if (signupAttempt.completed || otpSent) {
      return;
    }

    switch (signupAttempt.current_step) {
      case "verify_email":
        signUp.prepareVerification({ strategy: "email_otp" });
        break;
      case "verify_phone":
        signUp.prepareVerification({ strategy: "phone_otp" });
        break;
    }

    setOtpSent(true);
  }, [signupAttempt, signUp, otpSent]);

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    console.log("signUpErrors", signUpErrors);
    if (signUpErrors?.errors) {
      if (Array.isArray(signUpErrors?.errors)) {
        for (const err of signUpErrors.errors) {
          if (err.code === "USERNAME_EXISTS") {
            newErrors.username = err.message;
          }

          if (err.code === "EMAIL_EXISTS") {
            newErrors.email = err.message;
          }

          if (err.code === "PHONE_NUMBER_EXISTS") {
            newErrors.phone_number = err.message;
          }

          if (err.code === "INVALID_CREDENTIALS") {
            newErrors.password = err.message;
          }
          if (
            [
              "COUNTRY_RESTRICTED",
              "EMAIL_NOT_ALLOWED",
              "EMAIL_BLOCKED",
              "DISPOSABLE_EMAIL_BLOCKED",
              "VOIP_NUMBER_BLOCKED",
              "BANNED_KEYWORD",
            ].includes(err.code)
          ) {
            newErrors.submit = err.message;
          }
        }
      }
    }

    console.log("newErrors", newErrors);
    setErrors(newErrors);
  }, [signUpErrors]);

  // Show restricted message if signup is restricted
  if (isSignupRestricted) {
    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />

          <Header>
            <Title>Sign up Restricted!</Title>
          </Header>

          <RestrictedMessage>
            <RestrictedText>
              New account registration is currently restricted. Please check
              back later.
            </RestrictedText>
          </RestrictedMessage>

          <RestrictedFooter>
            <RestrictedFooterText>
              Need assistance?{" "}
              <RestrictedLink
                href={
                  deployment?.ui_settings?.sign_in_page_url
                    ? `${deployment.ui_settings.sign_in_page_url}?help=true`
                    : "/contact"
                }
              >
                Get help
              </RestrictedLink>
            </RestrictedFooterText>
          </RestrictedFooter>
        </Container>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        {otpSent ? (
          <>
            <Header>
              <Title>
                Check your{" "}
                {signupAttempt?.current_step === "verify_email"
                  ? "email"
                  : "phone"}
              </Title>
              <Subtitle>
                {signupAttempt?.current_step === "verify_email"
                  ? `${formData.email} to continue to Wacht`
                  : `${formData.phone_number} to continue to Wacht`}
              </Subtitle>
            </Header>
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
                    signupAttempt?.current_step === "verify_email"
                      ? "email_otp"
                      : "phone_otp";
                  await signUp.prepareVerification({ strategy });
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
                  Contact support
                </NavigationLink>
              </Link>
              <div style={{ marginTop: "var(--space-sm)" }}>
                <Link
                  onClick={() => {
                    resetFormData();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Use other method
                </Link>
              </div>
            </Footer>
          </>
        ) : (
          <>
            <AuthFormImage />

            <Header>
              <Title>Create your account</Title>
              <Subtitle>
                Welcome! Please fill in the details to get started.
              </Subtitle>
            </Header>

            {enabledSocialProviders.length > 0 && (
              <>
                <SocialAuthButtons
                  connections={enabledSocialProviders}
                  callback={handleSocialSignIn}
                />

                <Divider>
                  <DividerText>or</DividerText>
                </Divider>
              </>
            )}

            <Form onSubmit={handleSubmit} noValidate>
              {(authSettings?.first_name?.enabled ||
                authSettings?.last_name?.enabled) && (
                <NameFields $isBothEnabled={isBothNamesEnabled}>
                  {authSettings?.first_name?.enabled && (
                    <FormGroup>
                      <Label htmlFor="first_name">
                        First name
                        {authSettings?.first_name?.required && (
                          <RequiredAsterisk>*</RequiredAsterisk>
                        )}
                      </Label>
                      <Input
                        type="text"
                        id="first_name"
                        name="first_name"
                        required
                        minLength={3}
                        maxLength={30}
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="First name"
                        aria-invalid={!!errors.first_name}
                        pattern="^[a-zA-Z]{3,30}$"
                      />
                      {errors.first_name && (
                        <ErrorMessage>{errors.first_name}</ErrorMessage>
                      )}
                    </FormGroup>
                  )}
                  {authSettings?.last_name?.enabled && (
                    <FormGroup>
                      <Label htmlFor="last_name">
                        Last name
                        {authSettings?.last_name?.required && (
                          <RequiredAsterisk>*</RequiredAsterisk>
                        )}
                      </Label>
                      <Input
                        type="text"
                        id="last_name"
                        name="last_name"
                        required
                        minLength={3}
                        maxLength={30}
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        aria-invalid={!!errors.last_name}
                        pattern="^[a-zA-Z]{3,30}$"
                      />
                      {errors.last_name && (
                        <ErrorMessage>{errors.last_name}</ErrorMessage>
                      )}
                    </FormGroup>
                  )}
                </NameFields>
              )}

              {authSettings?.username.enabled && (
                <FormGroup>
                  <Label htmlFor="username">
                    Username
                    {authSettings.username.required && (
                      <RequiredAsterisk>*</RequiredAsterisk>
                    )}
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    minLength={3}
                    maxLength={20}
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    aria-invalid={!!errors.username}
                    required
                    pattern="^[a-zA-Z][a-zA-Z0-9_.]{2,29}$"
                  />

                  {errors.username && (
                    <ErrorMessage>{errors.username}</ErrorMessage>
                  )}
                </FormGroup>
              )}

              {authSettings?.email_address.enabled && (
                <FormGroup>
                  <Label htmlFor="email">
                    Email address
                    {authSettings.email_address.required && (
                      <RequiredAsterisk>*</RequiredAsterisk>
                    )}
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    maxLength={320}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    aria-invalid={!!errors.email}
                    required
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  />
                  {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
                </FormGroup>
              )}

              {authSettings?.phone_number.enabled && (
                <FormGroup>
                  <Label htmlFor="phone_number">
                    Phone number
                    {authSettings.phone_number.required && (
                      <RequiredAsterisk>*</RequiredAsterisk>
                    )}
                  </Label>

                  <PhoneNumberInput
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    error={errors.phone_number}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                  />

                  {errors.phone_number && (
                    <ErrorMessage>{errors.phone_number}</ErrorMessage>
                  )}
                </FormGroup>
              )}

              {authSettings?.password.enabled && (
                <FormGroup>
                  <Label htmlFor="password">
                    Password
                    {authSettings.password.required && (
                      <RequiredAsterisk>*</RequiredAsterisk>
                    )}
                  </Label>
                  <PasswordGroup>
                    <Input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      aria-invalid={!!errors.password}
                      required
                      minLength={8}
                      maxLength={128}
                      pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$"
                    />
                  </PasswordGroup>
                  {errors.password && (
                    <ErrorMessage>{errors.password}</ErrorMessage>
                  )}
                </FormGroup>
              )}

              {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

              <SubmitButton type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? "Creating account..." : "Continue"}
              </SubmitButton>
            </Form>

            <Footer>
              Already have an account?{" "}
              <Link>
                <NavigationLink to={deployment!.ui_settings.sign_in_page_url}>
                  Sign in
                </NavigationLink>
              </Link>
            </Footer>
          </>
        )}
      </Container>
    </DefaultStylesProvider>
  );
}
